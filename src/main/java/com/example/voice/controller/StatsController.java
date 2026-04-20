package com.example.voice.controller;

import com.example.voice.repository.AnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * StatsController — public system-wide statistics.
 * No auth required — aggregate data only, no PII exposed.
 *
 * GET /api/stats → {
 *   totalAnalyses, fakeCount, realCount,
 *   avgConfidence, avgProcessingTimeMs
 * }
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final AnalysisRepository analysisRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        long total    = analysisRepository.count();
        long fakeCount = analysisRepository.countByFinalPrediction("FAKE");
        long realCount = analysisRepository.countByFinalPrediction("REAL");

        Double avgConfidence  = analysisRepository.avgEnsembleScore();
        Double avgProcessingTime = analysisRepository.avgProcessingTimeMs();

        return ResponseEntity.ok(Map.of(
                "totalAnalyses",       total,
                "fakeCount",           fakeCount,
                "realCount",           realCount,
                "avgConfidence",       avgConfidence  != null ? avgConfidence  : 0.0,
                "avgProcessingTimeMs", avgProcessingTime != null ? avgProcessingTime.longValue() : 0L
        ));
    }
}