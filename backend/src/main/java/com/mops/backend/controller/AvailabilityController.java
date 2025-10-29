package com.mops.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mops.backend.model.Availability;
import com.mops.backend.model.Doctor;
import com.mops.backend.service.AvailabilityService;
import com.mops.backend.service.DoctorService;

@RestController
@RequestMapping("/api/availability")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class AvailabilityController {
    
    @Autowired
    private AvailabilityService availabilityService;
    
    @Autowired
    private DoctorService doctorService;
    
    @GetMapping
    public List<Availability> getAllAvailabilities() {
        return availabilityService.getAllAvailabilities();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Availability> getAvailabilityById(@PathVariable Long id) {
        Optional<Availability> availability = availabilityService.getAvailabilityById(id);
        return availability.map(ResponseEntity::ok)
                          .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Availability>> getAvailabilitiesByDoctor(@PathVariable Long doctorId) {
        Optional<Doctor> doctor = doctorService.getDoctorById(doctorId);
        
        if (doctor.isPresent()) {
            List<Availability> availabilities = availabilityService.getActiveAvailabilitiesByDoctor(doctor.get());
            return ResponseEntity.ok(availabilities);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/doctor/{doctorId}/day/{dayOfWeek}")
    public ResponseEntity<List<Availability>> getAvailabilitiesByDoctorAndDay(
            @PathVariable Long doctorId, 
            @PathVariable String dayOfWeek) {
        
        Optional<Doctor> doctor = doctorService.getDoctorById(doctorId);
        
        if (doctor.isPresent()) {
            List<Availability> availabilities = availabilityService
                    .getActiveAvailabilitiesByDoctorAndDay(doctor.get(), dayOfWeek);
            return ResponseEntity.ok(availabilities);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping
    public ResponseEntity<Availability> createAvailability(@RequestBody Availability availability) {
        Availability createdAvailability = availabilityService.createAvailability(availability);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAvailability);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Availability> updateAvailability(@PathVariable Long id, @RequestBody Availability availability) {
        try {
            Availability updatedAvailability = availabilityService.updateAvailability(id, availability);
            return ResponseEntity.ok(updatedAvailability);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Availability> toggleAvailabilityStatus(@PathVariable Long id) {
        try {
            Availability availability = availabilityService.toggleAvailabilityStatus(id);
            return ResponseEntity.ok(availability);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable Long id) {
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }
}