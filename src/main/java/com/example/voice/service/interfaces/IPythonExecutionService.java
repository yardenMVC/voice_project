package com.example.voice.service.interfaces;

import com.example.voice.dto.PythonAnalysisResult;

import java.nio.file.Path;

/**
 * ISP + SRP: This interface is exclusively responsible for
 * running the Python ML script and returning its parsed output.
 * The analysis business logic lives in IAnalysisService.
 */
public interface IPythonExecutionService {
    PythonAnalysisResult execute(Path audioFilePath) throws Exception;
}
