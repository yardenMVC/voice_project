package com.example.voice.service;
import java.util.UUID;
import com.example.voice.dto.RoleDto;
import com.example.voice.dto.UserDto;
import com.example.voice.entity.Role;
import com.example.voice.entity.User;
import com.example.voice.exception.ResourceNotFoundException;
import com.example.voice.repository.RoleRepository;
import com.example.voice.repository.UserRepository;
import com.example.voice.service.interfaces.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }


    @Override
    @Transactional
    public UserDto createUser(UserDto dto) {
        if (userRepository.existsByUsername(dto.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = new User();
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));

        return saveWithRoles(user, dto.roles());
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (userRepository.existsByEmailAndIdNot(dto.email(), id)) {
            throw new IllegalArgumentException("Email is already in use by another user");
        }

        user.setEmail(dto.email());

        return saveWithRoles(user, dto.roles());
    }

    @Override
    @Transactional
    public UserDto registerUser(String username, String email, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));

        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "USER"));
        user.setRoles(List.of(userRole));

        return toDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) throw new ResourceNotFoundException("User", id);
        userRepository.deleteById(id);
    }

    // ── פונקציות עזר ────────────────────────────────────────────────────────
    private UserDto saveWithRoles(User user, List<RoleDto> roleDtos) {
        if (roleDtos != null) {
            List<Role> roles = roleDtos.stream()
                    .map(r -> roleRepository.findByRoleName(r.roleName())
                            .orElseThrow(() -> new ResourceNotFoundException("Role", r.roleName())))
                    .toList();
            user.setRoles(roles);
        }
        return toDto(userRepository.save(user));
    }

    private UserDto toDto(User user) {
        List<RoleDto> roles = user.getRoles().stream()
                .map(r -> new RoleDto(r.getId(), r.getRoleName(), r.getDescription()))
                .toList();
        return new UserDto(user.getId(), user.getUsername(), user.getEmail(), roles);
    }
}