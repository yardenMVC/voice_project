package com.example.voice.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * EnsembleFeature — join table between EnsembleConfiguration and FeatureDefinition.
 *
 * SRP: Answers exactly one question:
 *      "Which features (from the dictionary) does this model configuration use,
 *       and in which model (AE / RBM / both)?"
 *
 * activeInAe  — true if this feature is in the Autoencoder's input subset
 * activeInRbm — true if this feature is in the RBM's input subset
 *
 * Why not a simple @ManyToMany?
 * A plain join table can't store the extra columns (activeInAe, activeInRbm).
 * Using an explicit entity gives us full control and matches the
 * active_features structure already returned by Flask.
 */
@Entity
@Table(name = "ensemble_features",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"ensemble_config_id", "feature_id"}))
@Data
@NoArgsConstructor
public class EnsembleFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ensemble_config_id", nullable = false)
    private EnsembleConfiguration ensembleConfiguration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feature_id", nullable = false)
    private FeatureDefinition featureDefinition;

    @Column(name = "active_in_ae", nullable = false)
    private boolean activeInAe;

    @Column(name = "active_in_rbm", nullable = false)
    private boolean activeInRbm;

    public EnsembleFeature(EnsembleConfiguration config,
                           FeatureDefinition feature,
                           boolean activeInAe,
                           boolean activeInRbm) {
        this.ensembleConfiguration = config;
        this.featureDefinition     = feature;
        this.activeInAe            = activeInAe;
        this.activeInRbm           = activeInRbm;
    }
}