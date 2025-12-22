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

import com.mops.backend.model.Availability;
import com.mops.backend.repository.AvailabilityRepository;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {
    
     @Mock
    private AvailabilityRepository availabilityRepository;

    @InjectMocks
    private AvailabilityService availabilityService;

    @Test
    void createAvailability_ShouldToggleStatus() {
        Availability availability = new Availability();
        availability.setId(1L);
        availability.setIsActive(true);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability result = availabilityService.toggleAvailabilityStatus(1L);

        assertFalse(result.getIsActive(), "Status should be toggled to false");

        //act again to toggle back
        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(result));
        Availability resultBack = availabilityService.toggleAvailabilityStatus(1L);

        assertTrue(resultBack.getIsActive(), "Status should be toggled back to true");
    }
    
    @Test
    void updateAvailability_ShouldChangeAllFields() {

        Availability existing = new Availability();
        existing.setId(1L);
        existing.setDayOfWeek("Monday");

        Availability details = new Availability();
        details.setDayOfWeek("Friday");
        details.setStartTime(java.time.LocalTime.of(9, 0));
        details.setEndTime(java.time.LocalTime.of(17, 0));
        details.setIsActive(true);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(availabilityRepository.save(any(Availability.class))).thenAnswer(i -> i.getArguments()[0]);

        Availability updated = availabilityService.updateAvailability(1L, details);

        assertEquals("Friday", updated.getDayOfWeek());
        assertEquals(java.time.LocalTime.of(9, 0), updated.getStartTime());
        assertTrue(updated.getIsActive());
    }

    @Test
    void deleteAvailability_ShouldCallRepository() {

        availabilityService.deleteAvailability(1L);

        verify(availabilityRepository, times(1)).deleteById(1L);
    }
}

