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

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository  userRepository;
    private final RoleRepository  roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Override
    public UserDto createUser(UserDto dto) {
        User user = new User();
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // ← הוסף
        if (dto.roles() != null) {
            List<Role> roles = dto.roles().stream()
                    .map(r -> roleRepository.findByRoleName(r.roleName())
                            .orElseThrow(() -> new ResourceNotFoundException("Role", r.roleName())))
                    .toList();
            user.setRoles(roles);
        }
        return toDto(userRepository.save(user));
    }

    @Override
    public UserDto updateUser(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setEmail(dto.email());
        // Update roles if provided
        if (dto.roles() != null) {
            List<Role> roles = dto.roles().stream()
                    .map(r -> roleRepository.findByRoleName(r.roleName())
                            .orElseThrow(() -> new ResourceNotFoundException("Role", r.roleName())))
                    .toList();
            user.setRoles(roles);
        }
        return toDto(userRepository.save(user));
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id))
            throw new ResourceNotFoundException("User", id);
        userRepository.deleteById(id);
    }

    /**
     * Public registration — always assigns ROLE_USER, hashes password.
     * Called from /api/auth/register — not the admin user management flow.
     */
    @Override
    public UserDto registerUser(String username, String email, String password) {
        if (userRepository.findByUsername(username).isPresent())
            throw new IllegalArgumentException("User already exists"); // תואם לספר

        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new ResourceNotFoundException("Role", "USER"));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(List.of(userRole));

        return toDto(userRepository.save(user));
    }

    // ── Mapper ─────────────────────────────────────────────────────────────
    private UserDto toDto(User user) {
        List<RoleDto> roles = user.getRoles().stream()
                .map(r -> new RoleDto(r.getId(), r.getRoleName(), r.getDescription()))
                .toList();
        return new UserDto(user.getId(), user.getUsername(), user.getEmail(), roles);
    }
}