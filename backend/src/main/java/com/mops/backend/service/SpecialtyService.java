package com.mops.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mops.backend.model.Specialty;
import com.mops.backend.repository.SpecialtyRepository;

@Service
public class SpecialtyService {
    
    @Autowired
    private SpecialtyRepository specialtyRepository;
    
    public Specialty createSpecialty(Specialty specialty) {
        return specialtyRepository.save(specialty);
    }
    
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }
    
    public Optional<Specialty> getSpecialtyById(Long id) {
        return specialtyRepository.findById(id);
    }
    
    public Optional<Specialty> getSpecialtyByName(String name) {
        return specialtyRepository.findByName(name);
    }
    
    public Specialty updateSpecialty(Long id, Specialty specialtyDetails) {
        Specialty specialty = specialtyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Specialty not found with id: " + id));
        
        specialty.setName(specialtyDetails.getName());
        specialty.setDescription(specialtyDetails.getDescription());
        
        return specialtyRepository.save(specialty);
    }
    
    public void deleteSpecialty(Long id) {
        specialtyRepository.deleteById(id);
    }
    
    public boolean specialtyExists(String name) {
        return specialtyRepository.existsByName(name);
    }
}