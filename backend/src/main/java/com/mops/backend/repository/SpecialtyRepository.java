package com.mops.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mops.backend.model.Specialty;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    
    Optional<Specialty> findByName(String name);
    
    boolean existsByName(String name);
}