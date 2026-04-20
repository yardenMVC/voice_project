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

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * JwtUtil - implements ITokenService.
 *
 * SOLID changes from original:
 * - SRP: No longer handles authentication logic, only token lifecycle.
 * - DIP: Implements ITokenService interface; callers depend on the interface.
 * - OCP: Token configuration (expiration) comes from JwtConfig (externalized).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil implements ITokenService {

    private final JwtConfig jwtConfig;
    private final ITokenBlacklistService tokenBlacklistService;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance("HmacSHA256");
            this.secretKey = Keys.hmacShaKeyFor(keyGen.generateKey().getEncoded());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to initialize JWT secret key", e);
        }
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
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .id(jwtId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getRefreshExpirationMs()))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            String jwtId    = extractJwtId(token);

            if (tokenBlacklistService.isBlacklisted(jwtId)) {
                log.warn("Token {} is blacklisted", jwtId);
                return false;
            }
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
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

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}
