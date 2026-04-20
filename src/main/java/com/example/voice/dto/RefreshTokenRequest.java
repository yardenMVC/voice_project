package com.example.voice.dto;

import jakarta.validation.constraints.NotBlank;

/** Immutable DTO for refresh token requests. IP added server-side. */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required") String refreshToken
) {}
