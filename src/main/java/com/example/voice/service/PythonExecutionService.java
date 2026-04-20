package com.example.voice.service;

import com.example.voice.config.PythonConfig;
import com.example.voice.dto.PythonAnalysisResult;
import com.example.voice.service.interfaces.IPythonExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PythonExecutionService implements IPythonExecutionService {

    private final PythonConfig pythonConfig;
    private final RestTemplate restTemplate;

    @Override
    public PythonAnalysisResult execute(Path audioFilePath) throws Exception {
        log.info("Sending file to Flask: {}", audioFilePath);

        String url = pythonConfig.getFlaskUrl() + "/analyze";

        Map<String, String> body = Map.of(
                "file_path", audioFilePath.toAbsolutePath().toString()
        );

        try {
            ResponseEntity<PythonAnalysisResult> response = restTemplate.postForEntity(
                    url,
                    body,
                    PythonAnalysisResult.class
            );

            if (response.getBody() == null) {
                throw new RuntimeException("Flask returned empty response");
            }

            log.info("Flask analysis complete: {}", response.getBody().getFinalPrediction());
            return response.getBody();

        } catch (Exception e) {
            log.error("Flask call failed: {}", e.getMessage());
            throw new RuntimeException("AI service unavailable: " + e.getMessage(), e);
        }
    }
}