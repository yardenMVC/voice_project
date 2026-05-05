package com.example.voice.service.interfaces;

import com.example.voice.dto.PythonAnalysisResult;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;

// ISP + SRP: This interface is exclusively responsible for
// running the Python ML script and returning its parsed output.
// The analysis business logic lives in IAnalysisService.
public interface IPythonExecutionService {

    // ── OLD: file-path based (requires shared filesystem) ──
    // PythonAnalysisResult execute(Path audioFilePath) throws Exception;

    // ── NEW: direct proxy — forwards MultipartFile as multipart/form-data ──
    PythonAnalysisResult execute(MultipartFile audioFile) throws Exception;
}
