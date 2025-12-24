package com.mops.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.model.User;
import com.mops.backend.repository.AppointmentRepository;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private EmailService emailService;
    
    public Appointment createAppointment(Appointment appointment) {
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setStatus("PENDING");

        doctorService.incrementPopularity(appointment.getDoctor().getId());

        Appointment savedAppointment = appointmentRepository.save(appointment);

        // Send email notification to patient
        emailService.sendAppointmentConfirmation(savedAppointment);

        return savedAppointment;
    }
    
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
    
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }
    
    public List<Appointment> getAppointmentsByPatient(User patient) {
        return appointmentRepository.findByPatientOrderByAppointmentDateDesc(patient);
    }
    

    public List<Appointment> getAppointmentsByDoctor(Doctor doctor) {
        return appointmentRepository.findByDoctorOrderByAppointmentDateAsc(doctor);
    }
    
    
    public List<Appointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatus(status);
    }
    
    
    public List<Appointment> getAppointmentsByPatientAndStatus(User patient, String status) {
        return appointmentRepository.findByPatientAndStatus(patient, status);
    }
    
    
    public List<Appointment> getAppointmentsByDoctorAndStatus(Doctor doctor, String status) {
        return appointmentRepository.findByDoctorAndStatus(doctor, status);
    }
    
    public Appointment updateAppointmentStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + id));
        
        appointment.setStatus(status);
        appointment.setUpdatedAt(LocalDateTime.now());
        
        return appointmentRepository.save(appointment);
    }
    
    public Appointment confirmAppointment(Long id) {
        return updateAppointmentStatus(id, "CONFIRMED");
    }
    
    public Appointment rejectAppointment(Long id) {
        return updateAppointmentStatus(id, "REJECTED");
    }
    
    public Appointment cancelAppointment(Long id) {
        return updateAppointmentStatus(id, "CANCELLED");
    }
    
    public Appointment completeAppointment(Long id) {
        return updateAppointmentStatus(id, "COMPLETED");
    }

    public Appointment setPendingAppointment(Long id) {
        return updateAppointmentStatus(id, "PENDING");
    }

    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
    
    public List<Appointment> getDoctorAppointmentsBetweenDates(
        Doctor doctor, 
        LocalDateTime start, 
        LocalDateTime end
    ) {
        return appointmentRepository.findByDoctorAndAppointmentDateBetween(doctor, start, end);
    }


    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setDoctor(appointmentDetails.getDoctor());
        appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
        appointment.setNotes(appointmentDetails.getNotes());
        appointment.setStatus(appointmentDetails.getStatus());
        // appointment.setCost(appointmentDetails.getCost());
        
        return appointmentRepository.save(appointment);
    }
}