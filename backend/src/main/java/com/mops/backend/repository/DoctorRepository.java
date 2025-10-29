package com.mops.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    Optional<Doctor> findByUser(User user);
    
    Optional<Doctor> findByUserId(Long userId);
    
    List<Doctor> findBySpecialty(Specialty specialty);
    
    List<Doctor> findBySpecialtyOrderByPopularityDesc(Specialty specialty);
    
    List<Doctor> findByIsActiveTrue();
    
    List<Doctor> findBySpecialtyAndIsActiveTrueOrderByPopularityDesc(Specialty specialty);
}