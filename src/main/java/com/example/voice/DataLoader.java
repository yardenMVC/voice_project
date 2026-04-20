package com.example.voice;

import com.example.voice.entity.Role;
import com.example.voice.entity.User;
import com.example.voice.repository.RoleRepository;
import com.example.voice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * DataLoader.
 * SRP: Only responsible for seeding initial DB data on first startup.
 * Guarded by existsBy check to be idempotent (safe to run multiple times).
 */
@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return; // Already seeded

        Role adminRole = roleRepository.save(new Role("ADMIN", "Full system access"));
        Role userRole  = roleRepository.save(new Role("USER",  "Standard access"));

        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@voice.ai");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRoles(List.of(adminRole, userRole));
        userRepository.save(admin);

        User user = new User();
        user.setUsername("user");
        user.setEmail("user@voice.ai");
        user.setPassword(passwordEncoder.encode("user123"));
        user.setRoles(List.of(userRole));
        userRepository.save(user);
    }
}
