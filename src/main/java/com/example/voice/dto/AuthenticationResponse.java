package com.example.voice.dto;

import java.util.List;

public record AuthenticationResponse(
        String accessToken,
        String refreshToken,
        String username,
        List<String> roles
) {}
