package com.example.voice.controller;

import com.example.voice.config.JwtConfig;
import com.example.voice.dto.AuthenticationRequest;
import com.example.voice.dto.AuthenticationResponse;
import com.example.voice.dto.RegisterRequest;
import com.example.voice.dto.UserDto;
import com.example.voice.service.interfaces.IAuthenticationService;
import com.example.voice.service.interfaces.ITokenService;
import com.example.voice.service.interfaces.IUserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final IAuthenticationService authenticationService;
    private final ITokenService tokenService;
    private final IUserService userService;
    private final JwtConfig jwtConfig;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthenticationRequest request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        try {
            String clientIp = httpRequest.getRemoteAddr();
            AuthenticationResponse response = authenticationService.login(
                    request.username(), request.password(), clientIp);

            addTokenCookies(httpResponse, response);

            return ResponseEntity.ok(Map.of(
                    "username", response.username(),
                    "roles", response.roles()
            ));
        } catch (org.springframework.security.authentication.AuthenticationServiceException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        UserDto created = userService.registerUser(
                request.username(), request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(HttpServletRequest httpRequest,
                                          HttpServletResponse httpResponse) {
        String refreshToken = extractCookie(httpRequest, JwtConfig.REFRESH_COOKIE);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No refresh token"));
        }

        String clientIp = httpRequest.getRemoteAddr();
        AuthenticationResponse response = authenticationService.refreshToken(refreshToken, clientIp);

        addTokenCookies(httpResponse, response);

        return ResponseEntity.ok(Map.of(
                "username", response.username(),
                "roles", response.roles()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "username", userDetails.getUsername(),
                "roles", userDetails.getAuthorities().stream()
                        .map(a -> a.getAuthority()).toList()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        try {
            String token = extractCookie(httpRequest, JwtConfig.ACCESS_COOKIE);
            if (token != null) {
                String jwtId = tokenService.extractJwtId(token);
                java.time.Instant expiresAt = tokenService.extractExpiration(token).toInstant();
                authenticationService.logout(jwtId, expiresAt);
            }
        } catch (Exception ignored) {}

        clearTokenCookies(httpResponse);
        return ResponseEntity.noContent().build();
    }

    // ── Cookie helpers ─────────────────────────────────────────────────────

    private void addTokenCookies(HttpServletResponse response, AuthenticationResponse tokens) {
        ResponseCookie access = buildCookie(
                JwtConfig.ACCESS_COOKIE,
                tokens.accessToken(),
                jwtConfig.getExpirationMs() / 1000);
        ResponseCookie refresh = buildCookie(
                JwtConfig.REFRESH_COOKIE,
                tokens.refreshToken(),
                jwtConfig.getRefreshExpirationMs() / 1000);

        response.addHeader(HttpHeaders.SET_COOKIE, access.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refresh.toString());
    }

    private void clearTokenCookies(HttpServletResponse response) {
        ResponseCookie access  = buildCookie(JwtConfig.ACCESS_COOKIE, "", 0);
        ResponseCookie refresh = buildCookie(JwtConfig.REFRESH_COOKIE, "", 0);

        response.addHeader(HttpHeaders.SET_COOKIE, access.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refresh.toString());
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSecs) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false)       // set to true when behind HTTPS in production
                .path("/")
                .maxAge(maxAgeSecs)
                .sameSite("Lax")
                .build();
    }

    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }
}
