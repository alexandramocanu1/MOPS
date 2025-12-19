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

import com.mops.backend.model.MedicalReport;
import com.mops.backend.model.User;
import com.mops.backend.service.MedicalReportService;
import com.mops.backend.service.UserService;

@RestController
@RequestMapping("/api/medical-reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class MedicalReportController {

    @Autowired
    private MedicalReportService medicalReportService;

    @Autowired
    private UserService userService;

    @GetMapping
    public List<MedicalReport> getAllMedicalReports() {
        return medicalReportService.getAllMedicalReports();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalReport> getMedicalReportById(@PathVariable Long id) {
        Optional<MedicalReport> report = medicalReportService.getMedicalReportById(id);
        return report.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<MedicalReport> getMedicalReportByAppointmentId(@PathVariable Long appointmentId) {
        Optional<MedicalReport> report = medicalReportService.getMedicalReportByAppointmentId(appointmentId);
        return report.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalReport>> getMedicalReportsByPatient(@PathVariable Long patientId) {
        Optional<User> patient = userService.getUserById(patientId);

        if (patient.isPresent()) {
            List<MedicalReport> reports = medicalReportService.getMedicalReportsByPatient(patient.get());
            return ResponseEntity.ok(reports);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalReport>> getMedicalReportsByDoctor(@PathVariable Long doctorId) {
        List<MedicalReport> reports = medicalReportService.getMedicalReportsByDoctorId(doctorId);
        return ResponseEntity.ok(reports);
    }

    @PostMapping
    public ResponseEntity<?> createMedicalReport(@RequestBody MedicalReport medicalReport) {
        try {
            MedicalReport createdReport = medicalReportService.createMedicalReport(medicalReport);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReport);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicalReport(
            @PathVariable Long id,
            @RequestBody MedicalReport reportDetails) {
        try {
            MedicalReport updatedReport = medicalReportService.updateMedicalReport(id, reportDetails);
            return ResponseEntity.ok(updatedReport);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicalReport(@PathVariable Long id) {
        medicalReportService.deleteMedicalReport(id);
        return ResponseEntity.noContent().build();
    }
}
