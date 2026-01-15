package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
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

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@mops.ro");
        user.setPassword("password123");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPhoneNumber("0712345678");
        user.setRole("PATIENT");
    }

    @Test
    void createUser_ShouldSetCreatedAtDate() {
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User created = userService.createUser(user);

        assertNotNull(created.getCreatedAt(), "CreatedAt should be set automatically.");
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        List<User> users = Arrays.asList(user, new User());
        when(userRepository.findAll()).thenReturn(users);

        List<User> result = userService.getAllUsers();

        assertEquals(2, result.size());
        verify(userRepository, times(1)).findAll();
    }

    @Test
    void getUserById_ShouldReturnUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getUserById_ShouldReturnEmptyWhenNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getUserByEmail_ShouldReturnUser() {
        when(userRepository.findByEmail("test@mops.ro")).thenReturn(Optional.of(user));

        Optional<User> result = userService.getUserByEmail("test@mops.ro");

        assertTrue(result.isPresent());
        assertEquals("test@mops.ro", result.get().getEmail());
    }

    @Test
    void getUserByEmail_ShouldReturnEmptyWhenNotFound() {
        when(userRepository.findByEmail("notfound@mops.ro")).thenReturn(Optional.empty());

        Optional<User> result = userService.getUserByEmail("notfound@mops.ro");

        assertTrue(result.isEmpty());
    }

    @Test
    void getUsersByRole_ShouldReturnFilteredUsers() {
        List<User> patients = Arrays.asList(user);
        when(userRepository.findByRole("PATIENT")).thenReturn(patients);

        List<User> result = userService.getUsersByRole("PATIENT");

        assertEquals(1, result.size());
        verify(userRepository, times(1)).findByRole("PATIENT");
    }

    @Test
    void updateUser_ShouldUpdateFieldsAndSetUpdatedAt() {
        User updatedDetails = new User();
        updatedDetails.setFirstName("Jane");
        updatedDetails.setLastName("Smith");
        updatedDetails.setEmail("jane@mops.ro");
        updatedDetails.setPhoneNumber("0787654321");
        updatedDetails.setRole("DOCTOR");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User result = userService.updateUser(1L, updatedDetails);

        assertEquals("Jane", result.getFirstName());
        assertEquals("Smith", result.getLastName());
        assertEquals("jane@mops.ro", result.getEmail());
        assertEquals("0787654321", result.getPhoneNumber());
        assertEquals("DOCTOR", result.getRole());
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
    void deleteUser_ShouldCallRepositoryDelete() {
        userService.deleteUser(1L);

        verify(userRepository, times(1)).deleteById(1L);
    }

    @Test
    void emailExists_ShouldReturnTrueWhenEmailIsInDatabase() {
        when(userRepository.existsByEmail("exist@mops.ro")).thenReturn(true);

        boolean exists = userService.emailExists("exist@mops.ro");

        assertTrue(exists);
        verify(userRepository).existsByEmail("exist@mops.ro");
    }

    @Test
    void emailExists_ShouldReturnFalseWhenEmailNotInDatabase() {
        when(userRepository.existsByEmail("notexist@mops.ro")).thenReturn(false);

        boolean exists = userService.emailExists("notexist@mops.ro");

        assertFalse(exists);
    }

    @Test
    void login_ShouldReturnUserWhenCredentialsAreCorrect() {
        when(userRepository.findByEmail("test@mops.ro")).thenReturn(Optional.of(user));

        Optional<User> result = userService.login("test@mops.ro", "password123");

        assertTrue(result.isPresent());
        assertEquals("test@mops.ro", result.get().getEmail());
    }

    @Test
    void login_ShouldReturnEmptyWhenPasswordIsWrong() {
        when(userRepository.findByEmail("test@mops.ro")).thenReturn(Optional.of(user));

        Optional<User> result = userService.login("test@mops.ro", "wrongpassword");

        assertTrue(result.isEmpty(), "Login should have failed due to incorrect password.");
    }

    @Test
    void login_ShouldReturnEmptyWhenEmailNotFound() {
        when(userRepository.findByEmail("notfound@mops.ro")).thenReturn(Optional.empty());

        Optional<User> result = userService.login("notfound@mops.ro", "password123");

        assertTrue(result.isEmpty(), "Login should have failed due to email not found.");
    }
}
