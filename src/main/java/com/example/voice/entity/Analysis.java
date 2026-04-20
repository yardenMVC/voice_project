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

    // Active features metadata — stored as JSON string
    // Contains: total_extracted, ae_count, rbm_count,
    //           selection_method, features[{name, index, active_in}]
    @Column(columnDefinition = "TEXT")
    private String activeFeaturesJson;

    // Processing time from Flask (ms) — used for StatsPage average
    @Column
    private Integer processingTimeMs;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}