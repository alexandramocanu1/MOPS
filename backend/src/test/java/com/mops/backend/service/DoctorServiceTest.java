package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;
import com.mops.backend.repository.AppointmentRepository;
import com.mops.backend.repository.DoctorRepository;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private DoctorService doctorService;

    private Doctor doctor;
    private User user;
    private Specialty specialty;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setFirstName("John");
        user.setLastName("Doe");

        specialty = new Specialty();
        specialty.setId(1L);
        specialty.setName("Cardiology");

        doctor = new Doctor();
        doctor.setId(1L);
        doctor.setUser(user);
        doctor.setSpecialty(specialty);
        doctor.setExperienceYears(10);
        doctor.setPopularity(50);
        doctor.setIsActive(true);
        doctor.setDescription("Experienced cardiologist");
    }

    @Test
    void createDoctor_ShouldReturnSavedDoctor() {
        when(doctorRepository.save(any(Doctor.class))).thenReturn(doctor);

        Doctor saved = doctorService.createDoctor(doctor);

        assertNotNull(saved);
        assertEquals("Cardiology", saved.getSpecialty().getName());
        assertEquals("Experienced cardiologist", saved.getDescription());
        verify(doctorRepository, times(1)).save(doctor);
    }

    @Test
    void getAllDoctors_ShouldRecalculatePopularityAndReturnAll() {
        List<Doctor> doctors = Arrays.asList(doctor);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(any(Doctor.class))).thenReturn(5L);

        List<Doctor> result = doctorService.getAllDoctors();

        assertEquals(1, result.size());
        verify(doctorRepository, times(2)).findAll();
    }

    @Test
    void getDoctorById_ShouldReturnDoctor() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));

        Optional<Doctor> result = doctorService.getDoctorById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getDoctorById_ShouldReturnEmptyWhenNotFound() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Doctor> result = doctorService.getDoctorById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getDoctorByUser_ShouldReturnDoctor() {
        when(doctorRepository.findByUser(user)).thenReturn(Optional.of(doctor));

        Optional<Doctor> result = doctorService.getDoctorByUser(user);

        assertTrue(result.isPresent());
        assertEquals(user, result.get().getUser());
    }

    @Test
    void getDoctorByUserId_ShouldReturnDoctor() {
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(doctor));

        Optional<Doctor> result = doctorService.getDoctorByUserId(1L);

        assertTrue(result.isPresent());
        verify(doctorRepository, times(1)).findByUserId(1L);
    }

    @Test
    void getDoctorsBySpecialty_ShouldReturnList() {
        List<Doctor> doctors = Arrays.asList(doctor, new Doctor());
        when(doctorRepository.findBySpecialty(specialty)).thenReturn(doctors);

        List<Doctor> result = doctorService.getDoctorsBySpecialty(specialty);

        assertEquals(2, result.size());
        verify(doctorRepository, times(1)).findBySpecialty(specialty);
    }

    @Test
    void getDoctorsBySpecialtyOrderedByPopularity_ShouldRecalculateAndReturn() {
        List<Doctor> doctors = Arrays.asList(doctor);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(any(Doctor.class))).thenReturn(5L);
        when(doctorRepository.findBySpecialtyOrderByPopularityDesc(specialty)).thenReturn(doctors);

        List<Doctor> result = doctorService.getDoctorsBySpecialtyOrderedByPopularity(specialty);

        assertEquals(1, result.size());
        verify(doctorRepository, times(1)).findBySpecialtyOrderByPopularityDesc(specialty);
    }

    @Test
    void getActiveDoctors_ShouldReturnOnlyActiveDoctors() {
        List<Doctor> activeDoctors = Arrays.asList(doctor);
        when(doctorRepository.findByIsActiveTrue()).thenReturn(activeDoctors);

        List<Doctor> result = doctorService.getActiveDoctors();

        assertEquals(1, result.size());
        assertTrue(result.get(0).getIsActive());
    }

    @Test
    void getActiveDoctorsBySpecialtyOrderedByPopularity_ShouldRecalculateAndReturn() {
        List<Doctor> doctors = Arrays.asList(doctor);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(any(Doctor.class))).thenReturn(5L);
        when(doctorRepository.findBySpecialtyAndIsActiveTrueOrderByPopularityDesc(specialty)).thenReturn(doctors);

        List<Doctor> result = doctorService.getActiveDoctorsBySpecialtyOrderedByPopularity(specialty);

        assertEquals(1, result.size());
        verify(doctorRepository, times(1)).findBySpecialtyAndIsActiveTrueOrderByPopularityDesc(specialty);
    }

    @Test
    void updateDoctor_ShouldModifyFieldsCorrectly() {
        Specialty newSpecialty = new Specialty();
        newSpecialty.setName("Dermatology");

        Doctor details = new Doctor();
        details.setSpecialty(newSpecialty);
        details.setDescription("New description");
        details.setExperienceYears(15);
        details.setIsActive(false);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        Doctor updated = doctorService.updateDoctor(1L, details);

        assertEquals("New description", updated.getDescription());
        assertEquals(15, updated.getExperienceYears());
        assertEquals("Dermatology", updated.getSpecialty().getName());
        assertFalse(updated.getIsActive());
    }

    @Test
    void updateDoctor_ShouldThrowExceptionIfDoctorDoesNotExist() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            doctorService.updateDoctor(99L, new Doctor());
        });
    }

    @Test
    void deleteDoctor_ShouldCallRepositoryDelete() {
        doctorService.deleteDoctor(1L);

        verify(doctorRepository, times(1)).deleteById(1L);
    }

    @Test
    void incrementPopularity_ShouldIncreaseValueByOne() {
        doctor.setPopularity(10);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        doctorService.incrementPopularity(1L);

        assertEquals(11, doctor.getPopularity(), "Popularity should increase from 10 to 11");
        verify(doctorRepository, times(1)).save(doctor);
    }

    @Test
    void incrementPopularity_ShouldThrowExceptionWhenDoctorNotFound() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            doctorService.incrementPopularity(99L);
        });
    }

    @Test
    void toggleDoctorStatus_ShouldToggleFromActiveToInactive() {
        doctor.setIsActive(true);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        Doctor result = doctorService.toggleDoctorStatus(1L);

        assertFalse(result.getIsActive());
    }

    @Test
    void toggleDoctorStatus_ShouldToggleFromInactiveToActive() {
        doctor.setIsActive(false);

        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        when(doctorRepository.save(any(Doctor.class))).thenAnswer(i -> i.getArguments()[0]);

        Doctor result = doctorService.toggleDoctorStatus(1L);

        assertTrue(result.getIsActive());
    }

    @Test
    void toggleDoctorStatus_ShouldThrowExceptionWhenDoctorNotFound() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            doctorService.toggleDoctorStatus(99L);
        });
    }

    @Test
    void recalculatePopularityForAllDoctors_ShouldHandleEmptyList() {
        when(doctorRepository.findAll()).thenReturn(Collections.emptyList());

        doctorService.recalculatePopularityForAllDoctors();

        verify(doctorRepository, never()).saveAll(any());
    }

    @Test
    void recalculatePopularityForAllDoctors_ShouldCalculateCorrectly() {
        Doctor doctor2 = new Doctor();
        doctor2.setId(2L);
        doctor2.setExperienceYears(5);
        doctor2.setPopularity(0);

        doctor.setExperienceYears(10);

        List<Doctor> doctors = Arrays.asList(doctor, doctor2);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(doctor)).thenReturn(10L);
        when(appointmentRepository.countByDoctor(doctor2)).thenReturn(5L);

        doctorService.recalculatePopularityForAllDoctors();

        assertEquals(100, doctor.getPopularity());
        assertEquals(50, doctor2.getPopularity());
        verify(doctorRepository, times(1)).saveAll(doctors);
    }

    @Test
    void recalculatePopularityForAllDoctors_ShouldHandleNullExperience() {
        doctor.setExperienceYears(null);

        List<Doctor> doctors = Arrays.asList(doctor);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(doctor)).thenReturn(5L);

        doctorService.recalculatePopularityForAllDoctors();

        assertEquals(40, doctor.getPopularity());
        verify(doctorRepository, times(1)).saveAll(doctors);
    }

    @Test
    void recalculatePopularityForAllDoctors_ShouldHandleZeroConsultations() {
        doctor.setExperienceYears(10);

        List<Doctor> doctors = Arrays.asList(doctor);
        when(doctorRepository.findAll()).thenReturn(doctors);
        when(appointmentRepository.countByDoctor(doctor)).thenReturn(0L);

        doctorService.recalculatePopularityForAllDoctors();

        assertEquals(60, doctor.getPopularity());
        verify(doctorRepository, times(1)).saveAll(doctors);
    }
}
