package com.example.voice.controller;

import com.example.voice.repository.AnalysisLogRepository;
import com.example.voice.repository.AnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.voice.entity.EnsembleConfiguration;
import com.example.voice.repository.EnsembleConfigurationRepository;
import java.util.Comparator;
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
    private final AnalysisLogRepository analysisLogRepository;
    private final EnsembleConfigurationRepository ensembleConfigRepository;



    @GetMapping
    public ResponseEntity<Map<String, Object>> getStats() {
        long total           = analysisRepository.count();
        long fakeCount       = analysisRepository.countByFinalPrediction("FAKE");
        long realCount       = analysisRepository.countByFinalPrediction("REAL");
        Double avgConfidence = analysisRepository.avgEnsembleScore();
        // שורה תקינה (פנייה למשתנה שהגדרת למעלה):
        Double avgProcessingTime = analysisLogRepository.getAverageProcessingTime();

        EnsembleConfiguration latest = ensembleConfigRepository
                .findAll()
                .stream()
                .max(Comparator.comparing(EnsembleConfiguration::getRegisteredAt))
                .orElse(null);

        return ResponseEntity.ok(Map.of(
                "totalAnalyses",       total,
                "fakeCount",           fakeCount,
                "realCount",           realCount,
                "avgConfidence",       avgConfidence != null ? avgConfidence : 0.0,
                "avgProcessingTimeMs", avgProcessingTime != null ? avgProcessingTime.longValue() : 0L,
                "threshold",           latest != null ? latest.getThreshold() : 0.30,
                "aeModelPath",         latest != null ? latest.getAeModelPath() : "—",
                "rbmModelPath",        latest != null ? latest.getRbmModelPath() : "—"
        ));
    }
}