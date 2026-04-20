package com.example.voice.service;

import com.example.voice.dto.AnalysisResponse;
import com.example.voice.dto.AnalysisResponse.ActiveFeatures;
import com.example.voice.dto.AnalysisResponse.FeatureEntry;
import com.example.voice.dto.PythonAnalysisResult;
import com.example.voice.entity.Analysis;
import com.example.voice.entity.AnalysisLog;
import com.example.voice.entity.User;
import com.example.voice.exception.AudioValidationException;
import com.example.voice.exception.ResourceNotFoundException;
import com.example.voice.repository.AnalysisLogRepository;
import com.example.voice.repository.AnalysisRepository;
import com.example.voice.repository.UserRepository;
import com.example.voice.service.interfaces.IAnalysisService;
import com.example.voice.service.interfaces.IPythonExecutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService implements IAnalysisService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3");
    private static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024L;

    private final IPythonExecutionService pythonExecutionService;
    private final AnalysisRepository analysisRepository;
    private final AnalysisLogRepository analysisLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    //@Async
    public AnalysisResponse analyzeAudio(MultipartFile audioFile, String username) {
        log.info("Analysis requested by user: {} for file: {}", username, audioFile.getOriginalFilename());

        validateAudioFile(audioFile);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        Path tempFile = null;
        try {
            tempFile = saveToTemp(audioFile);

            PythonAnalysisResult result = pythonExecutionService.execute(tempFile);

            String featuresJson       = objectMapper.writeValueAsString(result.getFeaturesVector());
            String activeFeaturesJson = objectMapper.writeValueAsString(result.getActiveFeatures());

            Analysis analysis = Analysis.builder()
                    .user(user)
                    .finalPrediction(result.getFinalPrediction())
                    .autoencoderScore(result.getModelScores() != null
                            ? result.getModelScores().getAutoencoder() : null)
                    .rbmScore(result.getModelScores() != null
                            ? result.getModelScores().getRbm() : null)
                    .featuresVectorJson(featuresJson)
                    .activeFeaturesJson(activeFeaturesJson)
                    .processingTimeMs(result.getProcessingTimeMs())
                    .originalFilename(audioFile.getOriginalFilename())
                    .build();

            analysisRepository.save(analysis);

            AnalysisLog auditLog = AnalysisLog.builder()
                    .user(user)
                    .analysis(analysis)
                    .build();
            analysisLogRepository.save(auditLog);

            log.info("Analysis complete for user: {} - prediction: {} - time: {}ms",
                    username, result.getFinalPrediction(), result.getProcessingTimeMs());

            return toResponse(analysis, result.getFeaturesVector(), result.getActiveFeatures());

        } catch (Exception e) {
            log.error("Analysis failed for user {}: {}", username, e.getMessage());
            throw new RuntimeException("Audio analysis failed: " + e.getMessage(), e);
        } finally {
            cleanupTempFile(tempFile);
        }
    }

    @Override
    public List<AnalysisResponse> getHistoryForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        return analysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(a -> {
                    Map<String, Object> features       = parseFeaturesJson(a.getFeaturesVectorJson());
                    PythonAnalysisResult.ActiveFeaturesResult af = parseActiveFeaturesJson(a.getActiveFeaturesJson());
                    return toResponse(a, features, af);
                })
                .toList();
    }

    @Override
    public List<AnalysisResponse> getHistoryByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        return analysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(a -> {
                    Map<String, Object> features = parseFeaturesJson(a.getFeaturesVectorJson());
                    PythonAnalysisResult.ActiveFeaturesResult af = parseActiveFeaturesJson(a.getActiveFeaturesJson());
                    return toResponse(a, features, af);
                })
                .toList();
    }
    // ── Private helpers ────────────────────────────────────────────────────

    private void validateAudioFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new AudioValidationException("Audio file must not be empty");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()))
            throw new AudioValidationException(
                    "Invalid file type. Only WAV and MP3 are accepted. Received: " + contentType);

        if (file.getSize() > MAX_FILE_SIZE_BYTES)
            throw new AudioValidationException("File exceeds maximum allowed size of 50 MB");
    }

    private Path saveToTemp(MultipartFile file) throws IOException {
        Path tempDir  = Files.createTempDirectory("voice_analysis_");
        Path tempFile = tempDir.resolve(System.currentTimeMillis() + "_" + file.getOriginalFilename());
        Files.copy(file.getInputStream(), tempFile, StandardCopyOption.REPLACE_EXISTING);
        log.debug("Temp file saved: {}", tempFile);
        return tempFile;
    }

    private void cleanupTempFile(Path tempFile) {
        if (tempFile == null) return;
        try {
            Files.deleteIfExists(tempFile);
            Files.deleteIfExists(tempFile.getParent());
            log.debug("Temp file cleaned up: {}", tempFile);
        } catch (IOException e) {
            log.warn("Could not delete temp file {}: {}", tempFile, e.getMessage());
        }
    }

    private Map<String, Object> parseFeaturesJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.warn("Could not parse features JSON: {}", e.getMessage());
            return Map.of();
        }
    }

    private PythonAnalysisResult.ActiveFeaturesResult parseActiveFeaturesJson(String json) {
        try {
            return objectMapper.readValue(json, PythonAnalysisResult.ActiveFeaturesResult.class);
        } catch (Exception e) {
            log.warn("Could not parse activeFeatures JSON: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Maps Analysis entity + raw Python result to the AnalysisResponse DTO.
     * Converts PythonAnalysisResult.ActiveFeaturesResult → AnalysisResponse.ActiveFeatures.
     */
    private AnalysisResponse toResponse(
            Analysis analysis,
            Map<String, Object> features,
            PythonAnalysisResult.ActiveFeaturesResult af) {

        ActiveFeatures activeFeatures = null;
        if (af != null) {
            List<FeatureEntry> entries = af.getFeatures() == null ? List.of() :
                    af.getFeatures().stream()
                            .map(f -> new FeatureEntry(f.getName(), f.getIndex(), f.getActiveIn()))
                            .collect(Collectors.toList());

            activeFeatures = new ActiveFeatures(
                    af.getTotalExtracted(),
                    af.getAeCount(),
                    af.getRbmCount(),
                    af.getSelectionMethod(),
                    entries
            );
        }

        return new AnalysisResponse(
                analysis.getId(),
                analysis.getFinalPrediction(),
                analysis.getAutoencoderScore(),
                analysis.getRbmScore(),
                features,
                analysis.getOriginalFilename(),
                analysis.getCreatedAt(),
                analysis.getProcessingTimeMs(),
                activeFeatures
        );
    }
}