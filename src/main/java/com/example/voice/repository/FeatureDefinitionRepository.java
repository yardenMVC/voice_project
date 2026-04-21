package com.example.voice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeatureDefinitionRepository extends JpaRepository<com.example.voice.entity.FeatureDefinition, Long> {
    Optional<com.example.voice.entity.FeatureDefinition> findByFeatureName(String featureName);
}