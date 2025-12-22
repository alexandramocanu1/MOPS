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

import com.mops.backend.model.Specialty;
import com.mops.backend.repository.SpecialtyRepository;

@ExtendWith(MockitoExtension.class)
class SpecialtyServiceTest {

    @Mock
    private SpecialtyRepository specialtyRepository;

    @InjectMocks
    private SpecialtyService specialtyService;

    @Test
    void createSpecialty_ShouldSaveAndReturnSpecialty() {

        Specialty specialty = new Specialty();
        specialty.setName("Cardiologie");
        
        when(specialtyRepository.save(any(Specialty.class))).thenReturn(specialty);


        Specialty created = specialtyService.createSpecialty(specialty);


        assertNotNull(created);
        assertEquals("Cardiologie", created.getName());
        verify(specialtyRepository, times(1)).save(specialty);
    }

    @Test
    void updateSpecialty_ShouldModifyExistingData() {

        Specialty existing = new Specialty();
        existing.setId(1L);
        existing.setName("Vechi");

        Specialty newDetails = new Specialty();
        newDetails.setName("Nou");
        newDetails.setDescription("Descriere noua");

        when(specialtyRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(specialtyRepository.save(any(Specialty.class))).thenAnswer(i -> i.getArguments()[0]);

        Specialty updated = specialtyService.updateSpecialty(1L, newDetails);

        assertEquals("Nou", updated.getName());
        assertEquals("Descriere noua", updated.getDescription());
    }

    @Test
    void updateSpecialty_ShouldThrowExceptionIfIdDoesNotExist() {

        when(specialtyRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            specialtyService.updateSpecialty(99L, new Specialty());
        });
        
        assertTrue(exception.getMessage().contains("Specialty not found"));
    }

    @Test
    void specialtyExists_ShouldReturnTrueIfNameExists() {

        when(specialtyRepository.existsByName("Neurologie")).thenReturn(true);

        boolean exists = specialtyService.specialtyExists("Neurologie");

        assertTrue(exists);
        verify(specialtyRepository, times(1)).existsByName("Neurologie");
    }
}