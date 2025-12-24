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

import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.model.User;
import com.mops.backend.service.AppointmentService;
import com.mops.backend.service.DoctorService;
import com.mops.backend.service.UserService;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class AppointmentController {
    
    @Autowired
    private AppointmentService appointmentService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private DoctorService doctorService;
    
    
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }
    
    
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        return appointment.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }
    
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatient(@PathVariable Long patientId) {
        Optional<User> patient = userService.getUserById(patientId);
        
        if (patient.isPresent()) {
            List<Appointment> appointments = appointmentService.getAppointmentsByPatient(patient.get());
            return ResponseEntity.ok(appointments);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        Optional<Doctor> doctor = doctorService.getDoctorById(doctorId);
        
        if (doctor.isPresent()) {
            List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctor.get());
            return ResponseEntity.ok(appointments);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    

    @GetMapping("/status/{status}")
    public List<Appointment> getAppointmentsByStatus(@PathVariable String status) {
        return appointmentService.getAppointmentsByStatus(status);
    }
    
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        // Load full patient and doctor entities from database
        if (appointment.getPatient() != null && appointment.getPatient().getId() != null) {
            Optional<User> patient = userService.getUserById(appointment.getPatient().getId());
            if (patient.isPresent()) {
                appointment.setPatient(patient.get());
            } else {
                return ResponseEntity.badRequest().build();
            }
        }

        if (appointment.getDoctor() != null && appointment.getDoctor().getId() != null) {
            Optional<Doctor> doctor = doctorService.getDoctorById(appointment.getDoctor().getId());
            if (doctor.isPresent()) {
                appointment.setDoctor(doctor.get());
            } else {
                return ResponseEntity.badRequest().build();
            }
        }

        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAppointment);
    }
    
    @PutMapping("/{id}/confirm")
    public ResponseEntity<Appointment> confirmAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.confirmAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/reject")
    public ResponseEntity<Appointment> rejectAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.rejectAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/complete")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.completeAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/pending")
    public ResponseEntity<Appointment> setPendingAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.setPendingAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable Long id,
            @RequestBody Appointment appointmentDetails) {
        try {
            Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
            return ResponseEntity.ok(updatedAppointment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}