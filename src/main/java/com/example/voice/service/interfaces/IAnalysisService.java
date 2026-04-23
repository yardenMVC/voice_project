package com.example.voice.service.interfaces;

import com.example.voice.dto.AnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * ISP: Analysis concerns only.
 */
public interface IAnalysisService {
    AnalysisResponse analyzeAudio(MultipartFile audioFile, String username);
    List<AnalysisResponse> getHistoryForUser(String username);
    List<AnalysisResponse> getHistoryByUsername(String username);
    // הוסף את השורה הזו:
    void deleteAnalysis(Long id, String username);
}