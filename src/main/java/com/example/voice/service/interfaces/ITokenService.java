package com.example.voice.service.interfaces;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

/**
 * ISP: Token operations are split from authentication operations.
 * This interface covers only token lifecycle concerns.
 */
public interface ITokenService {
    String generateAccessToken(UserDetails userDetails, String jwtId);
    String generateRefreshToken(UserDetails userDetails, String jwtId);
    boolean validateToken(String token, UserDetails userDetails);
    String extractUsername(String token);
    String extractJwtId(String token);
    Date extractExpiration(String token);
}
