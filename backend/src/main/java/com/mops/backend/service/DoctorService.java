package com.mops.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;
import com.mops.backend.repository.DoctorRepository;

@Service
public class DoctorService {
    
    @Autowired
    private DoctorRepository doctorRepository;
    
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }
    
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }
    
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }
    
    public Optional<Doctor> getDoctorByUser(User user) {
        return doctorRepository.findByUser(user);
    }
    
    public Optional<Doctor> getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }
    
    public List<Doctor> getDoctorsBySpecialty(Specialty specialty) {
        return doctorRepository.findBySpecialty(specialty);
    }
    
    public List<Doctor> getDoctorsBySpecialtyOrderedByPopularity(Specialty specialty) {
        return doctorRepository.findBySpecialtyOrderByPopularityDesc(specialty);
    }
    
    public List<Doctor> getActiveDoctors() {
        return doctorRepository.findByIsActiveTrue();
    }
    
    public List<Doctor> getActiveDoctorsBySpecialtyOrderedByPopularity(Specialty specialty) {
        return doctorRepository.findBySpecialtyAndIsActiveTrueOrderByPopularityDesc(specialty);
    }
    
    public Doctor updateDoctor(Long id, Doctor doctorDetails) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        
        doctor.setSpecialty(doctorDetails.getSpecialty());
        doctor.setDescription(doctorDetails.getDescription());
        doctor.setExperienceYears(doctorDetails.getExperienceYears());
        doctor.setIsActive(doctorDetails.getIsActive());
        
        return doctorRepository.save(doctor);
    }
    
    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
    
    public void incrementPopularity(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
        
        doctor.setPopularity(doctor.getPopularity() + 1);
        doctorRepository.save(doctor);
    }
    
    public Doctor toggleDoctorStatus(Long id) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        
        doctor.setIsActive(!doctor.getIsActive());
        return doctorRepository.save(doctor);
    }
}