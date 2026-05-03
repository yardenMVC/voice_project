package com.example.voice.config;

import com.example.voice.service.interfaces.ITokenBlacklistService;
import com.example.voice.service.interfaces.ITokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil implements ITokenService {

    private final JwtConfig jwtConfig;
    private final ITokenBlacklistService tokenBlacklistService;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        String secret = jwtConfig.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret is not set in application.properties — refusing to start with a random key");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ==========================================
    // ITokenService implementation
    // ==========================================

    @Override
    public String generateAccessToken(UserDetails userDetails, String jwtId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        claims.put("type", "access");

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .id(jwtId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getExpirationMs()))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public String generateRefreshToken(UserDetails userDetails, String jwtId) {
        return generateRefreshToken(userDetails, jwtId, null);
    }

    @Override
    public String generateRefreshToken(UserDetails userDetails, String jwtId, String clientIp) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        if (clientIp != null) {
            claims.put("ip", clientIp);
        }

        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .id(jwtId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getRefreshExpirationMs()))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public boolean validateAccessToken(String token, UserDetails userDetails) {
        return validateTokenInternal(token, userDetails, true);
    }

    @Override
    public boolean validateToken(String token, UserDetails userDetails) {
        return validateTokenInternal(token, userDetails, false);
    }

    private boolean validateTokenInternal(String token, UserDetails userDetails, boolean enforceAccessType) {
        try {
            Claims claims = extractAllClaims(token);
            String username = claims.getSubject();
            String jwtId = claims.getId();

            if (tokenBlacklistService.isBlacklisted(jwtId)) {
                log.warn("Token {} is blacklisted", jwtId);
                return false;
            }

            if (!username.equals(userDetails.getUsername())) {
                return false;
            }

            if (claims.getExpiration().before(new Date())) {
                return false;
            }

            long durationMs = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();
            String type = (String) claims.get("type");

            if (enforceAccessType) {
                if (!"access".equals(type) || durationMs > JwtConfig.ACCESS_MAX_DURATION_MS) {
                    log.warn("Refresh token presented where access token expected");
                    return false;
                }
            } else {
                if ("access".equals(type) && durationMs > JwtConfig.ACCESS_MAX_DURATION_MS) {
                    return false;
                }
                if ("refresh".equals(type) && durationMs <= JwtConfig.ACCESS_MAX_DURATION_MS) {
                    return false;
                }
            }

            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token expired: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("Token validation error: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    @Override
    public String extractJwtId(String token) {
        return extractAllClaims(token).getId();
    }

    @Override
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    @Override
    public String extractClaim(String token, String claimName) {
        Object value = extractAllClaims(token).get(claimName);
        return value != null ? value.toString() : null;
    }

    // ==========================================
    // Private helpers
    // ==========================================

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
