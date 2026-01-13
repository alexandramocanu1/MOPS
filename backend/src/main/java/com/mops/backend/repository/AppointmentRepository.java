package com.mops.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.model.User;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByPatient(User patient);
    
    List<Appointment> findByDoctor(Doctor doctor);
    
    List<Appointment> findByStatus(String status);
    
    List<Appointment> findByPatientAndStatus(User patient, String status);
    
    List<Appointment> findByDoctorAndStatus(Doctor doctor, String status);
    
    List<Appointment> findByDoctorAndAppointmentDateBetween(
        Doctor doctor, 
        LocalDateTime start, 
        LocalDateTime end
    );
    
    List<Appointment> findByPatientOrderByAppointmentDateDesc(User patient);
    
    List<Appointment> findByDoctorOrderByAppointmentDateAsc(Doctor doctor);

    long countByDoctor(Doctor doctor);
}