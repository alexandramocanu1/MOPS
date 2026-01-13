package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Availability;
import com.mops.backend.repository.AvailabilityRepository;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {
    
    @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    @Test
    void createAvailability_ShouldReturnSavedAvailability() {
        Availability availability = new Availability();
        availability.setDayOfWeek("Monday");
        
        when(availabilityRepository.save(any(Availability.class))).thenReturn(availability);

        Availability saved = availabilityService.createAvailability(availability);

        assertNotNull(saved);
        assertEquals("Monday", saved.getDayOfWeek());
        verify(availabilityRepository, times(1)).save(availability);
    }

    @Test
    void toggleAvailabilityStatus_ShouldInvertBooleanValue() {
        Availability availability = new Availability();
        availability.setId(1L);
        availability.setIsActive(true);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability result = availabilityService.toggleAvailabilityStatus(1L);

        assertFalse(result.getIsActive(), "Status should go to false");

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(result));
        Availability resultBack = availabilityService.toggleAvailabilityStatus(1L);

        assertTrue(resultBack.getIsActive(), "Status should go back to true");
    }
    
    @Test
    void updateAvailability_ShouldChangeAllFields() {
        Availability existing = new Availability();
        existing.setId(1L);
        existing.setDayOfWeek("Monday");

        Availability details = new Availability();
        details.setDayOfWeek("Friday");
        details.setStartTime(LocalTime.of(9, 0));
        details.setEndTime(LocalTime.of(17, 0));
        details.setIsActive(true);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability updated = availabilityService.updateAvailability(1L, details);

        assertEquals("Friday", updated.getDayOfWeek());
        assertEquals(LocalTime.of(9, 0), updated.getStartTime());
        assertEquals(LocalTime.of(17, 0), updated.getEndTime());
        assertTrue(updated.getIsActive());
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
        Long idToDelete = 1L;
        
        availabilityService.deleteAvailability(idToDelete);

        verify(availabilityRepository, times(1)).deleteById(idToDelete);
    }
}