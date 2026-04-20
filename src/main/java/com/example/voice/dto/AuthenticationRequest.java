package com.example.voice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Immutable DTO for login requests.
 * Java Record ensures immutability (no setters).
 * IP is NOT included here - it is extracted server-side from HttpServletRequest.
 * SRP: Only carries client credentials, nothing else.
 */
public record AuthenticationRequest(
        @NotBlank(message = "Username is required") String username,
        @NotBlank(message = "Password is required") String password
) {}
