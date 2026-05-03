package com.example.voice.repository;

import com.example.voice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** DIP: Controllers/Services depend on this interface, not a concrete DAO. */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByUsernameAndIdNot(String username, Long id);
}