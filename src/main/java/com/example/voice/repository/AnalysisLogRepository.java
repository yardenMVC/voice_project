package com.example.voice.repository;

import com.example.voice.entity.AnalysisLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisLogRepository extends JpaRepository<AnalysisLog, Long> {
    // השורה הזו מאפשרת לשלוף היסטוריה מסודרת מהחדש לישן
    List<AnalysisLog> findByUserIdOrderByTimestampDesc(Long userId);

    @Query("SELECT AVG(al.processingTimeMs) FROM AnalysisLog al WHERE al.processingTimeMs IS NOT NULL")
    Double getAverageProcessingTime();
}