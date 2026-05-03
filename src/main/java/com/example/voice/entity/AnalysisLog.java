package com.example.voice.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * AnalysisLog entity.
 * SRP: Pure audit log - who ran which analysis and when.
 * Separated from Analysis so the audit trail is immutable and independent.
 */
@Entity
@Table(name = "analysis_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysis_id", nullable = false)
    private Analysis analysis;


    @Column(name = "timestamp", nullable = false)
    private java.time.LocalDateTime timestamp;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;



}
