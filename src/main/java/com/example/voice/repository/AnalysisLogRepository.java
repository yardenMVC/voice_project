package com.example.voice.repository;

import com.example.voice.entity.AnalysisLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisLogRepository extends JpaRepository<AnalysisLog, Long> {
    List<AnalysisLog> findByUserIdOrderByAnalyzedAtDesc(Long userId);
}
