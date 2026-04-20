package com.example.voice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for public registration — password included.
 * Separate from UserDto which is used for admin user management.
 */
public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 30)
        String username,

        @Email
        @NotBlank
        String email,

        @NotBlank
        @Size(min = 8)
        String password
) {}