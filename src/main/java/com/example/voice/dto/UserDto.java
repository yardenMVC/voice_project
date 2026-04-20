package com.example.voice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record UserDto(
        Long id,
        @NotBlank String username,
        @Email String email,
        List<RoleDto> roles
) {}

