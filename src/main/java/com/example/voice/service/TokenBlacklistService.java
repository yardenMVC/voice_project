package com.example.voice.service;

import com.example.voice.service.interfaces.ITokenBlacklistService;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TokenBlacklistService.
 * SRP: Only manages the set of invalidated token IDs.
 * Thread-safe via ConcurrentHashSet for multi-threaded server use.
 *
 * Note: For production, replace with Redis for distributed systems.
 */
@Service
public class TokenBlacklistService implements ITokenBlacklistService {

    private final Set<String> blacklistedJwtIds = ConcurrentHashMap.newKeySet();

    @Override
    public void blacklist(String jwtId) {
        blacklistedJwtIds.add(jwtId);
    }

    @Override
    public boolean isBlacklisted(String jwtId) {
        return blacklistedJwtIds.contains(jwtId);
    }
}
