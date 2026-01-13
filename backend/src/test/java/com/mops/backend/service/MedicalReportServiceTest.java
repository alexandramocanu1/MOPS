package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.MedicalReport;
import com.mops.backend.model.Prescription;
import com.mops.backend.repository.AppointmentRepository;
import com.mops.backend.repository.MedicalReportRepository;

@ExtendWith(MockitoExtension.class)
class MedicalReportServiceTest {

    @Mock
    private MedicalReportRepository medicalReportRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private MedicalReportService medicalReportService;

    @Test
    void createMedicalReport_ShouldSucceedAndSetDate() {
        Appointment appointment = new Appointment();
        appointment.setId(1L);

        MedicalReport report = new MedicalReport();
        report.setAppointment(appointment);
        
        Prescription prescription = new Prescription();
        List<Prescription> prescriptions = new ArrayList<>();
        prescriptions.add(prescription);
        report.setPrescriptions(prescriptions);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(false);
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport created = medicalReportService.createMedicalReport(report);

        assertNotNull(created.getCreatedDate());
        assertEquals(created, prescription.getMedicalReport(), "The bidirectional link should be set");
        verify(medicalReportRepository, times(1)).save(report);
    }

    @Test
    void updateMedicalReport_ShouldUpdateFieldsAndPrescriptions() {
        MedicalReport existingReport = spy(new MedicalReport());
        existingReport.setId(1L);
        existingReport.setDiagnosis("Diagnostic vechi");
        existingReport.setPrescriptions(new ArrayList<>());

        MedicalReport details = new MedicalReport();
        details.setDiagnosis("Diagnostic nou");
        details.setRecommendations("Odihna");
        
        Prescription newPrescription = new Prescription();
        newPrescription.setMedication("Paracetamol");
        details.setPrescriptions(List.of(newPrescription));

        when(medicalReportRepository.findById(1L)).thenReturn(Optional.of(existingReport));
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport updated = medicalReportService.updateMedicalReport(1L, details);

        assertEquals("Diagnostic nou", updated.getDiagnosis());
        assertEquals("Odihna", updated.getRecommendations());
        assertEquals(1, updated.getPrescriptions().size());
        verify(medicalReportRepository).save(any(MedicalReport.class));
        verify(existingReport).addPrescription(any(Prescription.class));
    }

    @Test
    void createMedicalReport_ShouldThrowExceptionWhenReportAlreadyExists() {
        Appointment appointment = new Appointment();
        appointment.setId(1L);
        MedicalReport report = new MedicalReport();
        report.setAppointment(appointment);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(true);

        assertThrows(RuntimeException.class, () -> medicalReportService.createMedicalReport(report));
    }

    @Test
    void getMedicalReportByAppointmentId_ShouldReturnReport() {
        Appointment appointment = new Appointment();
        appointment.setId(1L);
        MedicalReport report = new MedicalReport();

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.findByAppointment(appointment)).thenReturn(Optional.of(report));

        Optional<MedicalReport> result = medicalReportService.getMedicalReportByAppointmentId(1L);

        assertTrue(result.isPresent());
        verify(medicalReportRepository).findByAppointment(appointment);
    }
}