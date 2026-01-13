package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.User;
import com.mops.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_ShouldSetCreatedAtDate() {
        User user = new User();
        user.setEmail("test@mops.ro");
        
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User created = userService.createUser(user);

        assertNotNull(created.getCreatedAt(), "CreatedAt should be set automatically.");
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void login_ShouldReturnUserWhenCredentialsAreCorrect() {
        User user = new User();
        user.setEmail("user@test.ro");
        user.setPassword("parola123");

        when(userRepository.findByEmail("user@test.ro")).thenReturn(Optional.of(user));

        Optional<User> result = userService.login("user@test.ro", "parola123");

        assertTrue(result.isPresent());
        assertEquals("user@test.ro", result.get().getEmail());
    }

    @Test
    void login_ShouldReturnEmptyWhenPasswordIsWrong() {
        User user = new User();
        user.setEmail("user@test.ro");
        user.setPassword("parola_corecta");

        when(userRepository.findByEmail("user@test.ro")).thenReturn(Optional.of(user));

        Optional<User> result = userService.login("user@test.ro", "parola_gresita");

        assertTrue(result.isEmpty(), "Login should have failed due to incorrect password.");
    }

    @Test
    void updateUser_ShouldUpdateFieldsAndSetUpdatedAt() {
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setFirstName("Maria");

        User updatedDetails = new User();
        updatedDetails.setFirstName("Ion");
        updatedDetails.setEmail("maria@test.ro");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User result = userService.updateUser(1L, updatedDetails);

        assertEquals("Ion", result.getFirstName());
        assertEquals("maria@test.ro", result.getEmail());
        assertNotNull(result.getUpdatedAt(), "UpdatedAt should be set on update.");
    }

    @Test
    void updateUser_ShouldThrowExceptionWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            userService.updateUser(99L, new User());
        });
    }

    @Test
    void emailExists_ShouldReturnTrueWhenEmailIsInDatabase() {
        when(userRepository.existsByEmail("exist@mops.ro")).thenReturn(true);

        boolean exists = userService.emailExists("exist@mops.ro");

        assertTrue(exists);
        verify(userRepository).existsByEmail("exist@mops.ro");
    }
}