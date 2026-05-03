package com.example.voice.service.interfaces;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Date;

public interface ITokenService {
    String generateAccessToken(UserDetails userDetails, String jwtId);
    String generateRefreshToken(UserDetails userDetails, String jwtId);
    String generateRefreshToken(UserDetails userDetails, String jwtId, String clientIp);
    boolean validateToken(String token, UserDetails userDetails);
    boolean validateAccessToken(String token, UserDetails userDetails);
    String extractUsername(String token);
    String extractJwtId(String token);
    Date extractExpiration(String token);
    String extractClaim(String token, String claimName);
}
