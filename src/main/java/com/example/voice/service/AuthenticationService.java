package com.example.voice.service;

import com.example.voice.dto.AuthenticationResponse;
import com.example.voice.service.interfaces.IAuthenticationService;
import com.example.voice.service.interfaces.ITokenBlacklistService;
import com.example.voice.service.interfaces.ITokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * AuthenticationService.
 *
 * SOLID:
 * - SRP: Handles only login, logout, and token refresh flows.
 * - DIP: Depends on interfaces (ITokenService, ITokenBlacklistService, UserDetailsService).
 * - OCP: New auth strategies (e.g., OAuth) can be added via new IAuthenticationService impls.
 *
 * IP address is passed as a parameter from the controller (extracted from HttpServletRequest).
 * It is NOT part of the DTO - clean separation of concerns.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService implements IAuthenticationService {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final ITokenService tokenService;
    private final ITokenBlacklistService tokenBlacklistService;

    @Override
    public AuthenticationResponse login(String username, String password, String clientIp) {
        log.info("Login attempt for user: {} from IP: {}", username, clientIp);

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new AuthenticationServiceException("Invalid username or password");
        }

        String accessJwtId  = UUID.randomUUID().toString();
        String refreshJwtId = UUID.randomUUID().toString();

        String accessToken  = tokenService.generateAccessToken(userDetails, accessJwtId);
        String refreshToken = tokenService.generateRefreshToken(userDetails, refreshJwtId);

        log.info("Login successful for user: {}", username);
        return new AuthenticationResponse(accessToken, refreshToken);
    }

    @Override
    public AuthenticationResponse refreshToken(String refreshToken, String clientIp) {
        log.info("Refresh token request from IP: {}", clientIp);

        try {
            String username = tokenService.extractUsername(refreshToken);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!tokenService.validateToken(refreshToken, userDetails)) {
                throw new AuthenticationServiceException("Refresh token is invalid or expired");
            }

            String oldJwtId = tokenService.extractJwtId(refreshToken);
            tokenBlacklistService.blacklist(oldJwtId);

            String newAccessJwtId  = UUID.randomUUID().toString();
            String newRefreshJwtId = UUID.randomUUID().toString();

            return new AuthenticationResponse(
                    tokenService.generateAccessToken(userDetails, newAccessJwtId),
                    tokenService.generateRefreshToken(userDetails, newRefreshJwtId)
            );

        } catch (AuthenticationServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthenticationServiceException("Refresh token is invalid or expired");
        }
    }

    @Override
    public void logout(String jwtId) {
        tokenBlacklistService.blacklist(jwtId);
        log.info("Token blacklisted on logout: {}", jwtId);
    }
}
