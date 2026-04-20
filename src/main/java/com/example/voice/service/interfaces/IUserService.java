package com.example.voice.service.interfaces;

import com.example.voice.dto.UserDto;
import java.util.List;

/** ISP: User CRUD concerns only. */
public interface IUserService {
    List<UserDto> getAllUsers();
    UserDto getUserById(Long id);
    UserDto createUser(UserDto userDto);
    UserDto updateUser(Long id, UserDto userDto);
    void deleteUser(Long id);

    /** Public registration — always assigns ROLE_USER, hashes password. */
    UserDto registerUser(String username, String email, String password);
}