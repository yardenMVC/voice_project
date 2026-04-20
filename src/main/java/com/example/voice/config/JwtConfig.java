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
    private long expirationMs   = 1_800_000L;         // 30 min default
    private long refreshExpirationMs = 604_800_000L;  // 7 days default
    public static final String TOKEN_PREFIX  = "Bearer ";
    public static final String HEADER_STRING = "Authorization";
}
