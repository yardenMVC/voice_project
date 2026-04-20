package com.example.voice.controller;

import com.example.voice.dto.AnalysisResponse;
import com.example.voice.service.interfaces.IAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * AnalysisController.
 *
 * Endpoints:
 *  POST /api/analysis/upload              — submit audio file (USER/ADMIN)
 *  GET  /api/analysis/history             — own history (USER/ADMIN)
 *  GET  /api/analysis/history/{username}  — any user's history (ADMIN only)
 */
@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final IAnalysisService analysisService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> uploadAudio(
            @RequestParam("file") MultipartFile audioFile,
            @AuthenticationPrincipal UserDetails userDetails) {

        AnalysisResponse response = analysisService.analyzeAudio(
                audioFile, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /** Returns the authenticated user's own history. */
    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<AnalysisResponse> history = analysisService.getHistoryForUser(
                userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    /**
     * Returns history for any user — ADMIN only.
     * Security enforced in SecurityConfig: ROLE_ADMIN required.
     */
    @GetMapping("/history/{username}")
    public ResponseEntity<List<AnalysisResponse>> getHistoryByUsername(
            @PathVariable String username) {

        List<AnalysisResponse> history = analysisService.getHistoryByUsername(username);
        return ResponseEntity.ok(history);
    }
}