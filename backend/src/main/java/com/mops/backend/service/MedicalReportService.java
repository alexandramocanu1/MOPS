package com.mops.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.MedicalReport;
import com.mops.backend.model.Prescription;
import com.mops.backend.model.User;
import com.mops.backend.repository.AppointmentRepository;
import com.mops.backend.repository.MedicalReportRepository;

@Service
public class MedicalReportService {

    @Autowired
    private MedicalReportRepository medicalReportRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Transactional
    public MedicalReport createMedicalReport(MedicalReport medicalReport) {
        // Verify appointment exists
        Appointment appointment = appointmentRepository.findById(medicalReport.getAppointment().getId())
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check if report already exists for this appointment
        if (medicalReportRepository.existsByAppointment(appointment)) {
            throw new RuntimeException("Medical report already exists for this appointment");
        }

        // Set the complete appointment object
        medicalReport.setAppointment(appointment);

        // Set created date
        medicalReport.setCreatedDate(LocalDateTime.now());

        // Set bidirectional relationship for prescriptions
        if (medicalReport.getPrescriptions() != null) {
            for (Prescription prescription : medicalReport.getPrescriptions()) {
                prescription.setMedicalReport(medicalReport);
            }
        }

        return medicalReportRepository.save(medicalReport);
    }

    public List<MedicalReport> getAllMedicalReports() {
        return medicalReportRepository.findAll();
    }

    public Optional<MedicalReport> getMedicalReportById(Long id) {
        return medicalReportRepository.findById(id);
    }

    public Optional<MedicalReport> getMedicalReportByAppointmentId(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return medicalReportRepository.findByAppointment(appointment);
    }

    public List<MedicalReport> getMedicalReportsByPatient(User patient) {
        return medicalReportRepository.findByAppointmentPatientOrderByCreatedDateDesc(patient);
    }

    public List<MedicalReport> getMedicalReportsByDoctorId(Long doctorId) {
        return medicalReportRepository.findByAppointmentDoctorIdOrderByCreatedDateDesc(doctorId);
    }

    @Transactional
    public MedicalReport updateMedicalReport(Long id, MedicalReport reportDetails) {
        MedicalReport report = medicalReportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Medical report not found"));

        report.setDiagnosis(reportDetails.getDiagnosis());
        report.setSymptoms(reportDetails.getSymptoms());
        report.setPhysicalExamination(reportDetails.getPhysicalExamination());
        report.setInvestigations(reportDetails.getInvestigations());
        report.setRecommendations(reportDetails.getRecommendations());
        report.setFollowUpDate(reportDetails.getFollowUpDate());
        report.setAdditionalNotes(reportDetails.getAdditionalNotes());

        // Update prescriptions
        if (reportDetails.getPrescriptions() != null) {
            report.getPrescriptions().clear();
            for (Prescription prescription : reportDetails.getPrescriptions()) {
                report.addPrescription(prescription);
            }
        }

        return medicalReportRepository.save(report);
    }

    public void deleteMedicalReport(Long id) {
        medicalReportRepository.deleteById(id);
    }
}
