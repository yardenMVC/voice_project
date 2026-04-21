package com.example.voice.controller;

import com.example.voice.entity.FeatureDefinition;
import com.example.voice.repository.FeatureDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FeatureController — public read-only access to the feature dictionary.
 *
 * GET /api/features          → all 52 feature definitions
 * GET /api/features/{name}   → single feature by exact name (e.g. "MFCC_1")
 *
 * No auth required — this is static reference data, not user data.
 */
@RestController
@RequestMapping("/api/features")
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureDefinitionRepository featureDefinitionRepository;

    @GetMapping
    public ResponseEntity<List<FeatureDefinition>> getAllFeatures() {
        List<FeatureDefinition> features = featureDefinitionRepository
                .findAll()
                .stream()
                .sorted((a, b) -> Integer.compare(a.getFeatureIndex(), b.getFeatureIndex()))
                .toList();
        return ResponseEntity.ok(features);
    }

    @GetMapping("/{featureName}")
    public ResponseEntity<FeatureDefinition> getFeature(@PathVariable String featureName) {
        return featureDefinitionRepository.findByFeatureName(featureName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}