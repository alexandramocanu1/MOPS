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

import com.mops.backend.model.Doctor;
import com.mops.backend.repository.DoctorRepository;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @InjectMocks
    private DoctorService doctorService;

    @Test
    void incrementPopularity_ShouldIncreaseValueByOne() {

        Doctor doctor = new Doctor();
        doctor.setId(1L);
        doctor.setPopularity(10); 

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        doctorService.incrementPopularity(1L);

        assertEquals(11, doctor.getPopularity(), "Popularity should have increased from 10 to 11");
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
        verify(doctorRepository, times(1)).save(any(Doctor.class));
    }

    @Test
    void updateDoctor_ShouldThrowExceptionIfDoctorDoesNotExist() {

        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            doctorService.updateDoctor(99L, new Doctor());
        });
    }
}