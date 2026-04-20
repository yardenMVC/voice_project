package com.example.voice.service.interfaces;

import com.example.voice.dto.AuthenticationResponse;

/**
 * ISP: Authentication concerns only - login and token refresh.
 */
public interface IAuthenticationService {
    AuthenticationResponse login(String username, String password, String clientIp);
    AuthenticationResponse refreshToken(String refreshToken, String clientIp);
    void logout(String jwtId);
}
