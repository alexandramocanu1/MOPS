package com.mops.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mops.backend.model.Availability;
import com.mops.backend.model.Doctor;
import com.mops.backend.repository.AvailabilityRepository;

@Service
public class AvailabilityService {
    
    @Autowired
    private AvailabilityRepository availabilityRepository;
    
    public Availability createAvailability(Availability availability) {
        return availabilityRepository.save(availability);
    }
    
    public List<Availability> getAllAvailabilities() {
        return availabilityRepository.findAll();
    }
    
    public Optional<Availability> getAvailabilityById(Long id) {
        return availabilityRepository.findById(id);
    }
    
    public List<Availability> getAvailabilitiesByDoctor(Doctor doctor) {
        return availabilityRepository.findByDoctor(doctor);
    }
    
    public List<Availability> getActiveAvailabilitiesByDoctor(Doctor doctor) {
        return availabilityRepository.findByDoctorAndIsActiveTrue(doctor);
    }
    
    public List<Availability> getAvailabilitiesByDoctorAndDay(Doctor doctor, String dayOfWeek) {
        return availabilityRepository.findByDoctorAndDayOfWeek(doctor, dayOfWeek);
    }
    
    public List<Availability> getActiveAvailabilitiesByDoctorAndDay(Doctor doctor, String dayOfWeek) {
        return availabilityRepository.findByDoctorAndDayOfWeekAndIsActiveTrue(doctor, dayOfWeek);
    }
    
    public Availability updateAvailability(Long id, Availability availabilityDetails) {
        Availability availability = availabilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Availability not found with id: " + id));
        
        availability.setDayOfWeek(availabilityDetails.getDayOfWeek());
        availability.setStartTime(availabilityDetails.getStartTime());
        availability.setEndTime(availabilityDetails.getEndTime());
        availability.setIsActive(availabilityDetails.getIsActive());
        
        return availabilityRepository.save(availability);
    }
    
    public void deleteAvailability(Long id) {
        availabilityRepository.deleteById(id);
    }
    
    public Availability toggleAvailabilityStatus(Long id) {
        Availability availability = availabilityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Availability not found with id: " + id));
        
        availability.setIsActive(!availability.getIsActive());
        return availabilityRepository.save(availability);
    }
}