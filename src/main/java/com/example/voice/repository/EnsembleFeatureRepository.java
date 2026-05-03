package com.example.voice.repository;

import com.example.voice.entity.EnsembleFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnsembleFeatureRepository extends JpaRepository<EnsembleFeature, Long> {

    @Query("""
            SELECT ef FROM EnsembleFeature ef
            JOIN FETCH ef.featureDefinition
            WHERE ef.ensembleConfiguration.id = :configId
            ORDER BY ef.featureDefinition.featureIndex
            """)
    List<EnsembleFeature> findByConfigIdWithDefinition(Long configId);

    long countByEnsembleConfigurationId(Long configId);
}