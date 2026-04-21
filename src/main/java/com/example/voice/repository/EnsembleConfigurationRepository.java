package com.example.voice.repository;

import com.example.voice.entity.EnsembleConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnsembleConfigurationRepository
        extends JpaRepository<EnsembleConfiguration, Long> {
    Optional<EnsembleConfiguration> findByModelHash(String modelHash);
}