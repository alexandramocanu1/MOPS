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

import com.mops.backend.model.Specialty;
import com.mops.backend.repository.SpecialtyRepository;

@ExtendWith(MockitoExtension.class)
class SpecialtyServiceTest {

    @Mock
    private SpecialtyRepository specialtyRepository;

    @InjectMocks
    private SpecialtyService specialtyService;

    private Specialty specialty;

    @BeforeEach
    void setUp() {
        specialty = new Specialty();
        specialty.setId(1L);
        specialty.setName("Cardiology");
        specialty.setDescription("Heart and cardiovascular system");
    }

    @Test
    void createSpecialty_ShouldSaveAndReturnSpecialty() {
        when(specialtyRepository.save(any(Specialty.class))).thenReturn(specialty);

        Specialty created = specialtyService.createSpecialty(specialty);

        assertNotNull(created);
        assertEquals("Cardiology", created.getName());
        verify(specialtyRepository, times(1)).save(specialty);
    }

    @Test
    void getAllSpecialties_ShouldReturnAllSpecialties() {
        List<Specialty> specialties = Arrays.asList(specialty, new Specialty());
        when(specialtyRepository.findAll()).thenReturn(specialties);

        List<Specialty> result = specialtyService.getAllSpecialties();

        assertEquals(2, result.size());
        verify(specialtyRepository, times(1)).findAll();
    }

    @Test
    void getSpecialtyById_ShouldReturnSpecialty() {
        when(specialtyRepository.findById(1L)).thenReturn(Optional.of(specialty));

        Optional<Specialty> result = specialtyService.getSpecialtyById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getSpecialtyById_ShouldReturnEmptyWhenNotFound() {
        when(specialtyRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Specialty> result = specialtyService.getSpecialtyById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getSpecialtyByName_ShouldReturnSpecialty() {
        when(specialtyRepository.findByName("Cardiology")).thenReturn(Optional.of(specialty));

        Optional<Specialty> result = specialtyService.getSpecialtyByName("Cardiology");

        assertTrue(result.isPresent());
        assertEquals("Cardiology", result.get().getName());
    }

    @Test
    void getSpecialtyByName_ShouldReturnEmptyWhenNotFound() {
        when(specialtyRepository.findByName("Unknown")).thenReturn(Optional.empty());

        Optional<Specialty> result = specialtyService.getSpecialtyByName("Unknown");

        assertTrue(result.isEmpty());
    }

    @Test
    void updateSpecialty_ShouldModifyExistingData() {
        Specialty newDetails = new Specialty();
        newDetails.setName("Neurology");
        newDetails.setDescription("Brain and nervous system");

        when(specialtyRepository.findById(1L)).thenReturn(Optional.of(specialty));
        when(specialtyRepository.save(any(Specialty.class))).thenAnswer(i -> i.getArguments()[0]);

        Specialty updated = specialtyService.updateSpecialty(1L, newDetails);

        assertEquals("Neurology", updated.getName());
        assertEquals("Brain and nervous system", updated.getDescription());
        verify(specialtyRepository).save(specialty);
    }

    @Test
    void updateSpecialty_ShouldThrowExceptionIfIdDoesNotExist() {
        when(specialtyRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            specialtyService.updateSpecialty(99L, new Specialty());
        });

        assertTrue(exception.getMessage().contains("Specialty not found"));
        verify(specialtyRepository, never()).save(any());
    }

    @Test
    void deleteSpecialty_ShouldInvokeRepositoryDelete() {
        specialtyService.deleteSpecialty(1L);

        verify(specialtyRepository, times(1)).deleteById(1L);
    }

    @Test
    void specialtyExists_ShouldReturnTrueIfNameExists() {
        when(specialtyRepository.existsByName("Cardiology")).thenReturn(true);

        boolean exists = specialtyService.specialtyExists("Cardiology");

        assertTrue(exists);
        verify(specialtyRepository, times(1)).existsByName("Cardiology");
    }

    @Test
    void specialtyExists_ShouldReturnFalseIfNameDoesNotExist() {
        when(specialtyRepository.existsByName("Unknown")).thenReturn(false);

        boolean exists = specialtyService.specialtyExists("Unknown");

        assertFalse(exists);
        verify(specialtyRepository, times(1)).existsByName("Unknown");
    }
}
