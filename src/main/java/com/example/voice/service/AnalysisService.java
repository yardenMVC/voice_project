package com.example.voice.service;

import com.example.voice.dto.AnalysisResponse;
import com.example.voice.dto.AnalysisResponse.ActiveFeatures;
import com.example.voice.dto.AnalysisResponse.FeatureEntry;
import com.example.voice.dto.PythonAnalysisResult;
import com.example.voice.entity.*;
import com.example.voice.exception.AudioValidationException;
import com.example.voice.exception.ResourceNotFoundException;
import com.example.voice.repository.*;
import com.example.voice.repository.FeatureDefinitionRepository;
import com.example.voice.service.interfaces.IAnalysisService;
import com.example.voice.service.interfaces.IPythonExecutionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
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

    private final IPythonExecutionService         pythonExecutionService;
    private final AnalysisRepository              analysisRepository;
    private final AnalysisLogRepository           analysisLogRepository;
    private final UserRepository                  userRepository;
    private final FeatureDefinitionRepository featureDefinitionRepository;
    private final EnsembleConfigurationRepository ensembleConfigRepository;
    private final EnsembleFeatureRepository       ensembleFeatureRepository;
    private final ObjectMapper                    objectMapper;

    // ── analyzeAudio ──────────────────────────────────────────────────────────

    @Override
    public AnalysisResponse analyzeAudio(MultipartFile audioFile, String username) {
        log.info("Analysis requested by user: {} for file: {}",
                username, audioFile.getOriginalFilename());

        validateAudioFile(audioFile);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        Path tempFile = null;
        try {
            tempFile = saveToTemp(audioFile);

            // 1. Call Flask ML microservice
            PythonAnalysisResult result = pythonExecutionService.execute(tempFile);

            // 2. Resolve (or register) the ensemble configuration
            EnsembleConfiguration config = resolveEnsembleConfiguration(result);

            // 3. Persist the analysis
            //    featuresVectorJson stays exactly as Flask sent it: {"MFCC_1": 0.5, ...}
            //    activeFeaturesJson is gone — replaced by the config FK
            String featuresJson = objectMapper.writeValueAsString(result.getFeaturesVector());

            Analysis analysis = Analysis.builder()
                    .user(user)
                    .finalPrediction(result.getFinalPrediction())
                    .autoencoderScore(result.getModelScores() != null
                            ? result.getModelScores().getAutoencoder() : null)
                    .rbmScore(result.getModelScores() != null
                            ? result.getModelScores().getRbm() : null)
                    .ensembleScore(result.getEnsembleScore())
                    .featuresVectorJson(featuresJson)
                    .ensembleConfiguration(config)
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

            return toResponse(analysis, result.getFeaturesVector(), config);

        } catch (Exception e) {
            log.error("Analysis failed for user {}: {}", username, e.getMessage());
            throw new RuntimeException("Audio analysis failed: " + e.getMessage(), e);
        } finally {
            cleanupTempFile(tempFile);
        }
    }

    // ── getHistoryForUser ─────────────────────────────────────────────────────

    @Override
    public List<AnalysisResponse> getHistoryForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        return analysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(a -> {
                    Map<String, Object> features = parseFeaturesJson(a.getFeaturesVectorJson());
                    return toResponse(a, features, a.getEnsembleConfiguration());
                })
                .toList();
    }

    // ── getHistoryByUsername ──────────────────────────────────────────────────

    @Override
    public List<AnalysisResponse> getHistoryByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        return analysisRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(a -> {
                    Map<String, Object> features = parseFeaturesJson(a.getFeaturesVectorJson());
                    return toResponse(a, features, a.getEnsembleConfiguration());
                })
                .toList();
    }

    // ── resolveEnsembleConfiguration ─────────────────────────────────────────

    /**
     * Idempotent: if Flask reports a model_hash we've seen before, reuse the
     * existing EnsembleConfiguration row. If it's new (model was retrained),
     * create a new row and map the active features from FeatureDefinition.
     *
     * Uses result.getModelHash() — MD5 of best_model.json computed by Flask
     * at startup. Changes only when a new training run replaces the model files.
     */
    private EnsembleConfiguration resolveEnsembleConfiguration(
            PythonAnalysisResult result) {

        if (result.getModelHash() == null || result.getModelHash().isBlank()) {
            log.warn("Flask response missing model_hash — no EnsembleConfiguration registered");
            return null;
        }

        return ensembleConfigRepository
                .findByModelHash(result.getModelHash())
                .orElseGet(() -> registerNewConfiguration(result));
    }

    private EnsembleConfiguration registerNewConfiguration(PythonAnalysisResult result) {
        log.info("Registering new EnsembleConfiguration — hash: {}", result.getModelHash());

        EnsembleConfiguration config = new EnsembleConfiguration(
                result.getModelHash(),
                result.getAeModelPath()  != null ? result.getAeModelPath()  : "",
                result.getRbmModelPath() != null ? result.getRbmModelPath() : "",
                result.getThreshold()
        );
        ensembleConfigRepository.save(config);

        if (result.getActiveFeatures() != null
                && result.getActiveFeatures().getFeatures() != null) {

            for (PythonAnalysisResult.FeatureEntry fe
                    : result.getActiveFeatures().getFeatures()) {

                featureDefinitionRepository.findByFeatureName(fe.getName())
                        .ifPresentOrElse(
                                def -> {
                                    boolean inAe  = fe.getActiveIn().contains("AE");
                                    boolean inRbm = fe.getActiveIn().contains("RBM");
                                    ensembleFeatureRepository.save(
                                            new EnsembleFeature(config, def, inAe, inRbm));
                                },
                                () -> log.warn(
                                        "Feature '{}' from Flask not in feature_definitions — skipping",
                                        fe.getName())
                        );
            }
        }

        return config;
    }

    // ── toResponse ────────────────────────────────────────────────────────────

    /**
     * Builds the AnalysisResponse DTO.
     *
     * ActiveFeatures is now built from DB relations
     * (EnsembleConfiguration → EnsembleFeature → FeatureDefinition)
     * instead of deserializing activeFeaturesJson.
     *
     * The frontend receives exactly the same JSON structure as before.
     */
    private AnalysisResponse toResponse(
            Analysis analysis,
            Map<String, Object> features,
            EnsembleConfiguration config) {

        ActiveFeatures activeFeatures = null;

        if (config != null) {
            List<EnsembleFeature> efList =
                    ensembleFeatureRepository.findByConfigIdWithDefinition(config.getId());

            List<FeatureEntry> entries = efList.stream()
                    .map(ef -> {
                        List<String> activeIn = new ArrayList<>();
                        if (ef.isActiveInAe())  activeIn.add("AE");
                        if (ef.isActiveInRbm()) activeIn.add("RBM");
                        return new FeatureEntry(
                                ef.getFeatureDefinition().getFeatureName(),
                                ef.getFeatureDefinition().getFeatureIndex(),
                                activeIn
                        );
                    })
                    .collect(Collectors.toList());

            long aeCount  = efList.stream().filter(EnsembleFeature::isActiveInAe).count();
            long rbmCount = efList.stream().filter(EnsembleFeature::isActiveInRbm).count();

            activeFeatures = new ActiveFeatures(
                    52,
                    (int) aeCount,
                    (int) rbmCount,
                    "KS statistic",
                    entries
            );
        }

        return new AnalysisResponse(
                analysis.getId(),
                analysis.getFinalPrediction(),
                analysis.getAutoencoderScore(),
                analysis.getRbmScore(),
                analysis.getEnsembleScore(),
                config != null ? config.getThreshold() : null,  // ← הוסף שורה זו
                features,
                analysis.getOriginalFilename(),
                analysis.getCreatedAt(),
                analysis.getProcessingTimeMs(),
                activeFeatures
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void validateAudioFile(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new AudioValidationException("Audio file must not be empty");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()))
            throw new AudioValidationException(
                    "Invalid file type. Only WAV and MP3 are accepted. Received: " + contentType);

        if (file.getSize() > MAX_FILE_SIZE_BYTES)
            throw new AudioValidationException(
                    "File exceeds maximum allowed size of 50 MB");
    }

    private Path saveToTemp(MultipartFile file) throws IOException {
        Path tempDir  = Files.createTempDirectory("voice_analysis_");
        Path tempFile = tempDir.resolve(
                System.currentTimeMillis() + "_" + file.getOriginalFilename());
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
}