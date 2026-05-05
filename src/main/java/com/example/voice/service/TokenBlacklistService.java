package com.example.voice.service;

import com.example.voice.entity.BlacklistedToken;
import com.example.voice.repository.BlacklistedTokenRepository;
import com.example.voice.service.interfaces.ITokenBlacklistService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService implements ITokenBlacklistService {

    private final BlacklistedTokenRepository repository;
    private final Set<String> cache = ConcurrentHashMap.newKeySet();

    @PostConstruct
    void loadFromDatabase() {
        List<BlacklistedToken> active = repository.findByExpiresAtAfter(Instant.now());
        active.forEach(t -> cache.add(t.getJwtId()));
        log.info("Loaded {} blacklisted tokens from database", active.size());
    }

    @Override
    @Transactional
    public void blacklist(String jwtId, Instant expiresAt) {
        cache.add(jwtId);
        repository.save(new BlacklistedToken(jwtId, expiresAt));
    }

    @Override
    public boolean isBlacklisted(String jwtId) {
        return cache.contains(jwtId);
    }

    @Scheduled(fixedRate = 6 * 60 * 60 * 1000) // every 6 hours
    @Transactional
    public void purgeExpiredTokens() {
        Instant now = Instant.now();
        int dbRemoved = repository.deleteExpiredTokens(now);

        int cacheRemoved = 0;
        // Cache is append-only during normal ops; rebuild from DB to stay in sync
        if (dbRemoved > 0) {
            List<BlacklistedToken> active = repository.findByExpiresAtAfter(now);
            Set<String> fresh = ConcurrentHashMap.newKeySet();
            active.forEach(t -> fresh.add(t.getJwtId()));
            cacheRemoved = cache.size() - fresh.size();
            cache.clear();
            cache.addAll(fresh);
        }
        log.info("Purged expired tokens — db: {}, cache: {}", dbRemoved, cacheRemoved);
    }
}
