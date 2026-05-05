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

import java.util.List;
import java.util.UUID;

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
        String refreshToken = tokenService.generateRefreshToken(userDetails, refreshJwtId, clientIp);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority()).toList();

        log.info("Login successful for user: {}", username);
        return new AuthenticationResponse(accessToken, refreshToken, username, roles);
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

            String tokenIp = tokenService.extractClaim(refreshToken, "ip");
            if (tokenIp != null && !tokenIp.equals(clientIp)) {
                log.warn("Refresh token IP mismatch: token={} request={} user={}", tokenIp, clientIp, username);
                throw new AuthenticationServiceException("Token was issued to a different IP address");
            }

            String oldJwtId = tokenService.extractJwtId(refreshToken);
            tokenBlacklistService.blacklist(oldJwtId, tokenService.extractExpiration(refreshToken).toInstant());

            String newAccessJwtId  = UUID.randomUUID().toString();
            String newRefreshJwtId = UUID.randomUUID().toString();

            List<String> roles = userDetails.getAuthorities().stream()
                    .map(a -> a.getAuthority()).toList();

            return new AuthenticationResponse(
                    tokenService.generateAccessToken(userDetails, newAccessJwtId),
                    tokenService.generateRefreshToken(userDetails, newRefreshJwtId, clientIp),
                    username,
                    roles
            );

        } catch (AuthenticationServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthenticationServiceException("Refresh token is invalid or expired");
        }
    }

    @Override
    public void logout(String jwtId, java.time.Instant tokenExpiresAt) {
        tokenBlacklistService.blacklist(jwtId, tokenExpiresAt);
        log.info("Token blacklisted on logout: {}", jwtId);
    }
}
