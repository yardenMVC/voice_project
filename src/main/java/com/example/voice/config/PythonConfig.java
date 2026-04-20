package com.example.voice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "python")
@Data
public class PythonConfig {
    private String flaskUrl = "http://localhost:5001";
    private int timeoutSeconds = 30;
}