package com.example.voice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FeatureDefinition — dictionary of all 52 extractable acoustic features.
 *
 * SRP: This entity only represents the static definition of a feature.
 * It is populated once at startup (DataLoader) and never modified.
 *
 * featureName  — the exact technical name used by Python (e.g. "MFCC_1")
 * displayName  — human-readable label for the UI (e.g. "MFCC Coefficient 1")
 * description  — explanation shown to the user in the result card
 * featureIndex — position in the 52-vector (0-based), matches config.py order
 */
@Entity
@Table(name = "feature_definitions",
        uniqueConstraints = @UniqueConstraint(columnNames = "feature_name"))
@Data
@NoArgsConstructor
public class FeatureDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "feature_name", nullable = false, length = 64)
    private String featureName;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "feature_index", nullable = false)
    private Integer featureIndex;

    public FeatureDefinition(String featureName, String displayName,
                             String description, Integer featureIndex) {
        this.featureName  = featureName;
        this.displayName  = displayName;
        this.description  = description;
        this.featureIndex = featureIndex;
    }
}