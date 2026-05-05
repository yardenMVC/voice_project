package com.example.voice.service.interfaces;

import java.time.Instant;

// ISP: Token blacklist concerns separated from token generation/validation.
public interface ITokenBlacklistService {
    void blacklist(String jwtId, Instant expiresAt);
    boolean isBlacklisted(String jwtId);
}
