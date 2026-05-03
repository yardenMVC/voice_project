package com.example.voice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * OCP: Token configuration is now externalized to application.properties.
 * Adding new token types or changing expiration requires only config changes,
 * not code changes.
 */
@Component
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    private String secret;
    private long expirationMs   = 1_800_000L;
    private long refreshExpirationMs = 7_200_000L;
    public static final String TOKEN_PREFIX  = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
    public static final long ACCESS_MAX_DURATION_MS = 3_600_000L; // 1 hour boundary
}
