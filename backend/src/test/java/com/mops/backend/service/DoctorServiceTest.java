package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.repository.DoctorRepository;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorService doctorService;

    @Test
    void createDoctor_ShouldReturnSavedDoctor() {
        Doctor doctor = new Doctor();
        doctor.setDescription("Cardiolog cu experienta");
        
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);

        Doctor saved = doctorService.createDoctor(doctor);

        assertNotNull(saved);
        assertEquals("Cardiolog cu experienta", saved.getDescription());
        verify(doctorRepository, times(1)).save(doctor);
    }

    @Test
    void incrementPopularity_ShouldIncreaseValueByOne() {
        Doctor doctor = new Doctor();
        doctor.setId(1L);
        doctor.setPopularity(10); 

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        doctorService.incrementPopularity(1L);

        assertEquals(11, doctor.getPopularity(), "Popularity should increase from 10 to 11");
        verify(doctorRepository, times(1)).save(doctor);
    }

    @Test
    void toggleDoctorStatus_ShouldToggleActivity() {
        Doctor doctor = new Doctor();
        doctor.setId(1L);
        doctor.setIsActive(true);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        Doctor result = doctorService.toggleDoctorStatus(1L);

        assertFalse(result.getIsActive());
        
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(result));
        Doctor resultTrue = doctorService.toggleDoctorStatus(1L);
        assertTrue(resultTrue.getIsActive());
    }

    @Test
    void updateDoctor_ShouldModifyFieldsCorrectly() {
        Doctor existing = new Doctor();
        existing.setId(1L);
        existing.setExperienceYears(5);

        Specialty newSpecialty = new Specialty();
        newSpecialty.setName("Dermatologie");

        Doctor details = new Doctor();
        details.setSpecialty(newSpecialty);
        details.setDescription("Noua descriere");
        details.setExperienceYears(10);
        details.setIsActive(false);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        Doctor updated = doctorService.updateDoctor(1L, details);

        assertEquals("Noua descriere", updated.getDescription());
        assertEquals(10, updated.getExperienceYears());
        assertEquals("Dermatologie", updated.getSpecialty().getName());
        assertFalse(updated.getIsActive());
    }

    @Test
    void getDoctorsBySpecialty_ShouldReturnList() {
        Specialty specialty = new Specialty();
        specialty.setName("ORL");
        
        List<Doctor> doctors = Arrays.asList(new Doctor(), new Doctor());
        when(doctorRepository.findBySpecialty(specialty)).thenReturn(doctors);

        List<Doctor> result = doctorService.getDoctorsBySpecialty(specialty);

        assertEquals(2, result.size());
        verify(doctorRepository, times(1)).findBySpecialty(specialty);
    }

    @Test
    void updateDoctor_ShouldThrowExceptionIfDoctorDoesNotExist() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            doctorService.updateDoctor(99L, new Doctor());
        });
    }
}