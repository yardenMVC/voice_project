package com.example.voice.controller;

import com.example.voice.config.JwtConfig;
import com.example.voice.dto.AuthenticationRequest;
import com.example.voice.dto.AuthenticationResponse;
import com.example.voice.dto.RefreshTokenRequest;
import com.example.voice.dto.RegisterRequest;
import com.example.voice.dto.UserDto;
import com.example.voice.service.interfaces.IAuthenticationService;
import com.example.voice.service.interfaces.ITokenService;
import com.example.voice.service.interfaces.IUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final IAuthenticationService authenticationService;
    private final ITokenService tokenService;
    private final IUserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login( // שינינו ל-? כדי שנוכל להחזיר גם שגיאה
                                    @Valid @RequestBody AuthenticationRequest request,
                                    HttpServletRequest httpRequest) {

        try {
            String clientIp = httpRequest.getRemoteAddr();
            AuthenticationResponse response = authenticationService.login(
                    request.username(), request.password(), clientIp);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            // כאן אנחנו מחזירים בדיוק את הטקסט שרשום לך בספר
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Invalid username or password"));
        }
    }
    /**
     * Public registration — always creates ROLE_USER.
     * Uses RegisterRequest (has password) not UserDto (no password).
     */
    @PostMapping("/register")
    public ResponseEntity<UserDto> register(
            @Valid @RequestBody RegisterRequest request) {

        UserDto created = userService.registerUser(
                request.username(), request.email(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthenticationResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = httpRequest.getRemoteAddr();
        AuthenticationResponse response = authenticationService.refreshToken(
                request.refreshToken(), clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        try {
            String header = httpRequest.getHeader(JwtConfig.HEADER_STRING);
            if (header != null && header.startsWith(JwtConfig.TOKEN_PREFIX)) {
                String token = header.substring(JwtConfig.TOKEN_PREFIX.length());
                String jwtId = tokenService.extractJwtId(token);
                authenticationService.logout(jwtId);
            }
        } catch (Exception ignored) {}
        return ResponseEntity.noContent().build();
    }
}