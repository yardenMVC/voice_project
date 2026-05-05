package com.example.voice.service;

import com.example.voice.config.FlaskConfig;
import com.example.voice.config.PythonConfig;
import com.example.voice.dto.PythonAnalysisResult;
import com.example.voice.exception.AudioValidationException;
import com.example.voice.exception.FlaskAnalysisException;
import com.example.voice.service.interfaces.IPythonExecutionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PythonExecutionService implements IPythonExecutionService {

    private final PythonConfig pythonConfig;
    private final FlaskConfig flaskConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ══════════════════════════════════════════════════════════════════════════
    // OLD LOGIC: file-path based — sends the temp file's absolute path as JSON.
    // Requires Spring Boot and Flask to share the same filesystem.
    // ══════════════════════════════════════════════════════════════════════════
    //
    // @Override
    // public PythonAnalysisResult execute(Path audioFilePath) throws Exception {
    //     log.info("Sending file to Flask: {}", audioFilePath);
    //
    //     String url = flaskConfig.getUrl() + "/analyze";
    //
    //     HttpHeaders headers = new HttpHeaders();
    //     headers.setContentType(MediaType.APPLICATION_JSON);
    //     headers.set("X-Backend-Secret", flaskConfig.getSecret());
    //
    //     Map<String, String> body = Map.of(
    //             "file_path", audioFilePath.toAbsolutePath().toString()
    //     );
    //
    //     HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
    //
    //     try {
    //         ResponseEntity<PythonAnalysisResult> response = restTemplate.postForEntity(
    //                 url, request, PythonAnalysisResult.class);
    //
    //         if (response.getBody() == null) {
    //             throw new RuntimeException("Flask returned empty response");
    //         }
    //
    //         log.info("Flask analysis complete: {}", response.getBody().getFinalPrediction());
    //         return response.getBody();
    //
    //     } catch (HttpClientErrorException | HttpServerErrorException e) {
    //         throw mapFlaskError(e.getResponseBodyAsString(), e.getStatusCode().value());
    //     } catch (FlaskAnalysisException | AudioValidationException e) {
    //         throw e;
    //     } catch (Exception e) {
    //         log.error("Flask call failed: {}", e.getMessage());
    //         throw new RuntimeException("AI service unavailable: " + e.getMessage(), e);
    //     }
    // }

    // ══════════════════════════════════════════════════════════════════════════
    // NEW LOGIC: direct proxy — forwards the MultipartFile as multipart/form-data.
    // No shared filesystem needed; Flask receives the file bytes directly.
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public PythonAnalysisResult execute(MultipartFile audioFile) throws Exception {
        log.info("Forwarding file to Flask as multipart: {}", audioFile.getOriginalFilename());

        String url = flaskConfig.getUrl() + "/analyze";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-Backend-Secret", flaskConfig.getSecret());

        ByteArrayResource fileResource = new ByteArrayResource(audioFile.getBytes()) {
            @Override
            public String getFilename() {
                return audioFile.getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(fileResource, createFilePartHeaders(audioFile)));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<PythonAnalysisResult> response = restTemplate.postForEntity(
                    url, request, PythonAnalysisResult.class);

            if (response.getBody() == null) {
                throw new RuntimeException("Flask returned empty response");
            }

            log.info("Flask analysis complete: {}", response.getBody().getFinalPrediction());
            return response.getBody();

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw mapFlaskError(e.getResponseBodyAsString(), e.getStatusCode().value());
        } catch (FlaskAnalysisException | AudioValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Flask call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createFilePartHeaders(MultipartFile file) {
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"));
        return partHeaders;
    }

    private RuntimeException mapFlaskError(String responseBody, int statusCode) {
        try {
            JsonNode json = objectMapper.readTree(responseBody);
            String errorCode = json.has("error") ? json.get("error").asText() : "UNKNOWN";
            String message = json.has("message") ? json.get("message").asText() : "Analysis failed";

            return switch (errorCode) {
                case "FILE_NOT_FOUND", "AUDIO_TOO_SHORT", "AUDIO_CORRUPT" ->
                        new AudioValidationException(message);
                case "FEATURE_EXTRACTION_FAILED" ->
                        new FlaskAnalysisException(errorCode, message, HttpStatus.UNPROCESSABLE_ENTITY);
                case "MODEL_NOT_LOADED" ->
                        new FlaskAnalysisException(errorCode, message, HttpStatus.SERVICE_UNAVAILABLE);
                default ->
                        new FlaskAnalysisException(errorCode, message, HttpStatus.valueOf(statusCode));
            };
        } catch (Exception parseErr) {
            log.warn("Could not parse Flask error response: {}", responseBody);
            return new RuntimeException("AI service error (HTTP " + statusCode + ")");
        }
    }
}
