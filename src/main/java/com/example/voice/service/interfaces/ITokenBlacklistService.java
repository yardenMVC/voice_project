package com.example.voice.service.interfaces;

/**
 * ISP: Token blacklist concerns separated from token generation/validation.
 */
public interface ITokenBlacklistService {
    void blacklist(String jwtId);
    boolean isBlacklisted(String jwtId);
}
