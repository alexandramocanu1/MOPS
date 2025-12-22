package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
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
        report.setPrescriptions(new ArrayList<>());
        report.getPrescriptions().add(prescription);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(false);
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport created = medicalReportService.createMedicalReport(report);

        assertNotNull(created.getCreatedDate());
        assertEquals(created, prescription.getMedicalReport(), "The bidirectional relationship should be set");
        verify(medicalReportRepository, times(1)).save(report);
    }

    @Test
    void createMedicalReport_ShouldThrowExceptionWhenReportAlreadyExists() {

        Appointment appointment = new Appointment();
        appointment.setId(1L);
        MedicalReport report = new MedicalReport();
        report.setAppointment(appointment);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            medicalReportService.createMedicalReport(report);
        });

        assertTrue(exception.getMessage().contains("already exists"));
    }

    @Test
    void getMedicalReportByAppointmentId_ShouldThrowExceptionWhenAppointmentNotFound() {

        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            medicalReportService.getMedicalReportByAppointmentId(99L);
        });
    }
}