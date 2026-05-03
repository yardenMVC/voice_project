package com.example.voice.service.interfaces;

import com.example.voice.dto.UserDto;
import java.util.List;

/** ISP: User CRUD concerns only. */

import java.util.List;
import com.example.voice.dto.UserDto;

public interface IUserService {

    // ── CRUD Operations ──────────────────────────────────────────────────
    List<UserDto> getAllUsers();

    UserDto getUserById(Long id);

    UserDto createUser(UserDto userDto);

    UserDto updateUser(Long id, UserDto userDto);

    void deleteUser(Long id);

    // ── Authentication & Registration ─────────────────────────────────────
    /** Public registration — always assigns ROLE_USER, hashes password. */
    UserDto registerUser(String username, String email, String password);


}