package com.example.voice.repository;

import com.example.voice.entity.Analysis;
import jakarta.persistence.Column;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    // User history — ordered newest first
    List<Analysis> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Admin: get history by username
    List<Analysis> findByUserUsernameOrderByCreatedAtDesc(String username);

    // Stats queries
    long countByFinalPrediction(String finalPrediction);

    @Query("SELECT AVG(a.ensembleScore) FROM Analysis a WHERE a.ensembleScore IS NOT NULL")
    Double avgEnsembleScore();

    @Query("SELECT AVG(a.processingTimeMs) FROM Analysis a WHERE a.processingTimeMs IS NOT NULL")
    Double avgProcessingTimeMs();
}