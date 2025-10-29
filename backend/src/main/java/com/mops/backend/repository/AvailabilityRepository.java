package com.mops.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mops.backend.model.Availability;
import com.mops.backend.model.Doctor;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    
    List<Availability> findByDoctor(Doctor doctor);
    
    List<Availability> findByDoctorAndIsActiveTrue(Doctor doctor);
    
    List<Availability> findByDoctorAndDayOfWeek(Doctor doctor, String dayOfWeek);
    
    List<Availability> findByDoctorAndDayOfWeekAndIsActiveTrue(Doctor doctor, String dayOfWeek);
}