package com.example.voice.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@SuppressWarnings("ALL")
@Entity
@Table(name = "analyses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String finalPrediction;

    @Column
    private Double ensembleScore;

    @Column
    private Double autoencoderScore;

    @Column
    private Double rbmScore;

    @Column(columnDefinition = "TEXT")
    private String featuresVectorJson;


    // Processing time from Flask (ms) — used for StatsPage average

    // ── REMOVED: activeFeaturesJson ───────────────────────────────────────────
    // Previously stored active features as a redundant JSON blob.
    // Now resolved via ensembleConfiguration → ensemble_features join.
    // The frontend receives the same ActiveFeatures structure — AnalysisService
    // builds it from the DB relations instead of deserializing a JSON string.

    /**
     * Links this analysis to the exact model configuration that produced it.
     * Allows audit: "which model version and threshold were used for this result?"
     * LAZY fetch — only loaded when AnalysisService explicitly needs it.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ensemble_config_id", nullable = true)
    private EnsembleConfiguration ensembleConfiguration;

    @OneToMany(mappedBy = "analysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<AnalysisLog> analysisLogs;


}