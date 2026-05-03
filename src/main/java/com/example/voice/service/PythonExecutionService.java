package com.example.voice.service;

import com.example.voice.config.PythonConfig;
import com.example.voice.dto.PythonAnalysisResult;
import com.example.voice.exception.AudioValidationException;
import com.example.voice.exception.FlaskAnalysisException;
import com.example.voice.service.interfaces.IPythonExecutionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Path;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PythonExecutionService implements IPythonExecutionService {

    private final PythonConfig pythonConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public PythonAnalysisResult execute(Path audioFilePath) throws Exception {
        log.info("Sending file to Flask: {}", audioFilePath);

        String url = pythonConfig.getFlaskUrl() + "/analyze";

        Map<String, String> body = Map.of(
                "file_path", audioFilePath.toAbsolutePath().toString()
        );

        try {
            ResponseEntity<PythonAnalysisResult> response = restTemplate.postForEntity(
                    url, body, PythonAnalysisResult.class);

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
