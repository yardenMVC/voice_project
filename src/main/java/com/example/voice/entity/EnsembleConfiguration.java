package com.example.voice.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * EnsembleConfiguration — snapshot of the ML model state at a given point in time.
 *
 * SRP: Records which model files and threshold were active when a set of
 * analyses were performed. Allows audit: "which model version flagged this file?"
 *
 * modelHash    — unique fingerprint sent by Flask in the /analyze response.
 *                Python generates it from the model file bytes (e.g. MD5).
 *                Java uses it as an idempotency key — if the hash already exists,
 *                no new row is created.
 * aeModelPath  — filename of the Autoencoder model file (e.g. "ae_v4.pkl")
 * rbmModelPath — filename of the RBM model file (e.g. "rbm_v4.pkl")
 * threshold    — the decision threshold active at inference time (e.g. 0.30)
 * registeredAt — when this configuration was first seen by the Java backend
 */
@Entity
@Table(name = "ensemble_configurations",
        uniqueConstraints = @UniqueConstraint(columnNames = "model_hash"))
@Data
@NoArgsConstructor
public class EnsembleConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "model_hash", nullable = false, length = 64)
    private String modelHash;

    @Column(name = "ae_model_path", nullable = false, length = 256)
    private String aeModelPath;

    @Column(name = "rbm_model_path", nullable = false, length = 256)
    private String rbmModelPath;

    @Column(name = "threshold", nullable = false)
    private Double threshold;

    @Column(name = "registered_at", nullable = false)

    private LocalDateTime registeredAt = LocalDateTime.now();

    /**
     * The features that are active in this configuration.
     * Populated once when the configuration is first registered.
     * Read-only after that.
     */
    @OneToMany(mappedBy = "ensembleConfiguration",
            cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EnsembleFeature> ensembleFeatures = new ArrayList<>();

    public EnsembleConfiguration(String modelHash, String aeModelPath,
                                 String rbmModelPath, Double threshold) {
        this.modelHash    = modelHash;
        this.aeModelPath  = aeModelPath;
        this.rbmModelPath = rbmModelPath;
        this.threshold    = threshold;
        this.registeredAt = LocalDateTime.now();
    }
}