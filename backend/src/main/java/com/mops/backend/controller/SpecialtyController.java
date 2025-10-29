package com.mops.backend.controller;

import java.util.List;
import java.util.Map;
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

import com.mops.backend.model.Specialty;
import com.mops.backend.service.SpecialtyService;

@RestController
@RequestMapping("/api/specialties")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class SpecialtyController {
    
    @Autowired
    private SpecialtyService specialtyService;
    
    @GetMapping
    public List<Specialty> getAllSpecialties() {
        return specialtyService.getAllSpecialties();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Specialty> getSpecialtyById(@PathVariable Long id) {
        Optional<Specialty> specialty = specialtyService.getSpecialtyById(id);
        return specialty.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/name/{name}")
    public ResponseEntity<Specialty> getSpecialtyByName(@PathVariable String name) {
        Optional<Specialty> specialty = specialtyService.getSpecialtyByName(name);
        return specialty.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createSpecialty(@RequestBody Specialty specialty) {
        if (specialtyService.specialtyExists(specialty.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Specialty already exists"));
        }
        
        Specialty createdSpecialty = specialtyService.createSpecialty(specialty);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSpecialty);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Specialty> updateSpecialty(@PathVariable Long id, @RequestBody Specialty specialty) {
        try {
            Specialty updatedSpecialty = specialtyService.updateSpecialty(id, specialty);
            return ResponseEntity.ok(updatedSpecialty);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        specialtyService.deleteSpecialty(id);
        return ResponseEntity.noContent().build();
    }
}