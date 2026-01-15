package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Availability;
import com.mops.backend.model.Doctor;
import com.mops.backend.repository.AvailabilityRepository;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    private Availability availability;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        doctor = new Doctor();
        doctor.setId(1L);

        availability = new Availability();
        availability.setId(1L);
        availability.setDoctor(doctor);
        availability.setDayOfWeek("Monday");
        availability.setStartTime(LocalTime.of(9, 0));
        availability.setEndTime(LocalTime.of(17, 0));
        availability.setIsActive(true);
    }

    @Test
    void createAvailability_ShouldReturnSavedAvailability() {
        when(availabilityRepository.save(any(Availability.class))).thenReturn(availability);

        Availability saved = availabilityService.createAvailability(availability);

        assertNotNull(saved);
        assertEquals("Monday", saved.getDayOfWeek());
        verify(availabilityRepository, times(1)).save(availability);
    }

    @Test
    void getAllAvailabilities_ShouldReturnAllAvailabilities() {
        List<Availability> availabilities = Arrays.asList(availability, new Availability());
        when(availabilityRepository.findAll()).thenReturn(availabilities);

        List<Availability> result = availabilityService.getAllAvailabilities();

        assertEquals(2, result.size());
        verify(availabilityRepository, times(1)).findAll();
    }

    @Test
    void getAvailabilityById_ShouldReturnAvailability() {
        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));

        Optional<Availability> result = availabilityService.getAvailabilityById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getAvailabilityById_ShouldReturnEmptyWhenNotFound() {
        when(availabilityRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Availability> result = availabilityService.getAvailabilityById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAvailabilitiesByDoctor_ShouldReturnDoctorAvailabilities() {
        List<Availability> availabilities = Arrays.asList(availability);
        when(availabilityRepository.findByDoctor(doctor)).thenReturn(availabilities);

        List<Availability> result = availabilityService.getAvailabilitiesByDoctor(doctor);

        assertEquals(1, result.size());
        verify(availabilityRepository, times(1)).findByDoctor(doctor);
    }

    @Test
    void getActiveAvailabilitiesByDoctor_ShouldReturnOnlyActiveAvailabilities() {
        List<Availability> activeAvailabilities = Arrays.asList(availability);
        when(availabilityRepository.findByDoctorAndIsActiveTrue(doctor)).thenReturn(activeAvailabilities);

        List<Availability> result = availabilityService.getActiveAvailabilitiesByDoctor(doctor);

        assertEquals(1, result.size());
        assertTrue(result.get(0).getIsActive());
    }

    @Test
    void getAvailabilitiesByDoctorAndDay_ShouldReturnFilteredAvailabilities() {
        List<Availability> availabilities = Arrays.asList(availability);
        when(availabilityRepository.findByDoctorAndDayOfWeek(doctor, "Monday")).thenReturn(availabilities);

        List<Availability> result = availabilityService.getAvailabilitiesByDoctorAndDay(doctor, "Monday");

        assertEquals(1, result.size());
        assertEquals("Monday", result.get(0).getDayOfWeek());
    }

    @Test
    void getActiveAvailabilitiesByDoctorAndDay_ShouldReturnActiveFilteredAvailabilities() {
        List<Availability> availabilities = Arrays.asList(availability);
        when(availabilityRepository.findByDoctorAndDayOfWeekAndIsActiveTrue(doctor, "Monday"))
            .thenReturn(availabilities);

        List<Availability> result = availabilityService.getActiveAvailabilitiesByDoctorAndDay(doctor, "Monday");

        assertEquals(1, result.size());
        assertEquals("Monday", result.get(0).getDayOfWeek());
        assertTrue(result.get(0).getIsActive());
    }

    @Test
    void updateAvailability_ShouldChangeAllFields() {
        Availability details = new Availability();
        details.setDayOfWeek("Friday");
        details.setStartTime(LocalTime.of(10, 0));
        details.setEndTime(LocalTime.of(18, 0));
        details.setIsActive(false);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability updated = availabilityService.updateAvailability(1L, details);

        assertEquals("Friday", updated.getDayOfWeek());
        assertEquals(LocalTime.of(10, 0), updated.getStartTime());
        assertEquals(LocalTime.of(18, 0), updated.getEndTime());
        assertFalse(updated.getIsActive());
        verify(availabilityRepository, times(1)).save(any(Availability.class));
    }

    @Test
    void updateAvailability_ShouldThrowException_WhenNotFound() {
        when(availabilityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            availabilityService.updateAvailability(99L, new Availability());
        });
    }

    @Test
    void deleteAvailability_ShouldCallRepository() {
        availabilityService.deleteAvailability(1L);

        verify(availabilityRepository, times(1)).deleteById(1L);
    }

    @Test
    void toggleAvailabilityStatus_ShouldToggleFromActiveToInactive() {
        availability.setIsActive(true);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability result = availabilityService.toggleAvailabilityStatus(1L);

        assertFalse(result.getIsActive());
    }

    @Test
    void toggleAvailabilityStatus_ShouldToggleFromInactiveToActive() {
        availability.setIsActive(false);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability result = availabilityService.toggleAvailabilityStatus(1L);

        assertTrue(result.getIsActive());
    }

    @Test
    void toggleAvailabilityStatus_ShouldThrowExceptionWhenNotFound() {
        when(availabilityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            availabilityService.toggleAvailabilityStatus(99L);
        });
    }
}
