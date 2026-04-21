package com.example.voice.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Immutable DTO returned to the client after an audio analysis.
 */
public record AnalysisResponse(
        Long analysisId,
        String finalPrediction,
        Double autoencoderScore,
        Double rbmScore,
        Double  ensembleScore,
        Map<String, Object> featuresVector,
        String originalFilename,
        LocalDateTime analyzedAt,
        Integer processingTimeMs,
        ActiveFeatures activeFeatures
) {
    /**
     * Active features metadata.
     * Features selected via KS statistic —
     * highest distributional separation between real and fake audio.
     * AE: 30 features (Deltas — spectral dynamics)
     * RBM: 19 features (MFCC + physiological)
     */
    public record ActiveFeatures(
            int totalExtracted,
            int aeCount,
            int rbmCount,
            String selectionMethod,
            List<FeatureEntry> features
    ) {}

    public record FeatureEntry(
            String name,
            int index,
            List<String> activeIn
    ) {}
}