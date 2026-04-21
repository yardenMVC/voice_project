package com.example.voice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Internal DTO that maps the JSON output from the Flask ML microservice.
 *
 * Flask response format (updated):
 * {
 *   "final_prediction":  "FAKE",
 *   "model_scores":      { "autoencoder": 0.87, "rbm": 0.92 },
 *   "features_vector":   { "mfcc": [...], "jitter": 0.003, ... },
 *   "ensemble_score":    0.76,
 *   "threshold":         0.30,
 *   "processing_time_ms": 450,
 *
 *   "model_hash":        "d41d8cd98f00b204e9800998ecf8427e",
 *   "ae_model_path":     "autoencoder_v4.keras",
 *   "rbm_model_path":    "rbm_v4.pkl",
 *
 *   "active_features": {
 *     "total_extracted":  52,
 *     "ae_count":         30,
 *     "rbm_count":        19,
 *     "selection_method": "KS statistic",
 *     "features": [
 *       { "name": "MFCC_1", "index": 0, "active_in": ["AE", "RBM"] },
 *       ...
 *     ]
 *   }
 * }
 */
@Data
@NoArgsConstructor
public class PythonAnalysisResult {

    @JsonProperty("final_prediction")
    private String finalPrediction;

    @JsonProperty("model_scores")
    private ModelScores modelScores;

    @JsonProperty("features_vector")
    private Map<String, Object> featuresVector;

    @JsonProperty("ensemble_score")
    private Double ensembleScore;

    @JsonProperty("threshold")
    private Double threshold;

    @JsonProperty("processing_time_ms")
    private Integer processingTimeMs;

    // ── New fields — model identity ────────────────────────────────────────
    // Flask computes model_hash as MD5 of best_model.json at startup.
    // Java uses it as the idempotency key for EnsembleConfiguration.

    @JsonProperty("model_hash")
    private String modelHash;

    @JsonProperty("ae_model_path")
    private String aeModelPath;

    @JsonProperty("rbm_model_path")
    private String rbmModelPath;

    // ── Nested DTOs ────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    public static class ModelScores {
        @JsonProperty("autoencoder")
        private Double autoencoder;

        @JsonProperty("rbm")
        private Double rbm;
    }

    @Data
    @NoArgsConstructor
    public static class ActiveFeaturesResult {
        @JsonProperty("total_extracted")
        private int totalExtracted;

        @JsonProperty("ae_count")
        private int aeCount;

        @JsonProperty("rbm_count")
        private int rbmCount;

        @JsonProperty("selection_method")
        private String selectionMethod;

        @JsonProperty("features")
        private List<FeatureEntry> features;
    }

    @Data
    @NoArgsConstructor
    public static class FeatureEntry {
        @JsonProperty("name")
        private String name;

        @JsonProperty("index")
        private int index;

        @JsonProperty("active_in")
        private List<String> activeIn;
    }

    @JsonProperty("active_features")
    private ActiveFeaturesResult activeFeatures;
}