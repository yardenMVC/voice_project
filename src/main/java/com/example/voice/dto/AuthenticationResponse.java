package com.example.voice.dto;

/** Immutable response carrying access + refresh tokens. */
public record AuthenticationResponse(
        String accessToken,
        String refreshToken
) {}
