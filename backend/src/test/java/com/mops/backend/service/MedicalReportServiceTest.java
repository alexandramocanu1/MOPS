package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.MedicalReport;
import com.mops.backend.model.Prescription;
import com.mops.backend.model.User;
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

    private Appointment appointment;
    private MedicalReport medicalReport;
    private User patient;

    @BeforeEach
    void setUp() {
        patient = new User();
        patient.setId(1L);

        appointment = new Appointment();
        appointment.setId(1L);
        appointment.setPatient(patient);

        medicalReport = new MedicalReport();
        medicalReport.setId(1L);
        medicalReport.setAppointment(appointment);
        medicalReport.setDiagnosis("Test diagnosis");
    }

    @Test
    void createMedicalReport_ShouldSucceedAndSetDate() {
        Prescription prescription = new Prescription();
        List<Prescription> prescriptions = new ArrayList<>();
        prescriptions.add(prescription);
        medicalReport.setPrescriptions(prescriptions);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(false);
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport created = medicalReportService.createMedicalReport(medicalReport);

        assertNotNull(created.getCreatedDate());
        assertEquals(created, prescription.getMedicalReport(), "The bidirectional link should be set");
        verify(medicalReportRepository, times(1)).save(medicalReport);
    }

    @Test
    void createMedicalReport_ShouldThrowExceptionWhenAppointmentNotFound() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> medicalReportService.createMedicalReport(medicalReport));
        verify(medicalReportRepository, never()).save(any());
    }

    @Test
    void createMedicalReport_ShouldThrowExceptionWhenReportAlreadyExists() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(true);

        assertThrows(RuntimeException.class, () -> medicalReportService.createMedicalReport(medicalReport));
        verify(medicalReportRepository, never()).save(any());
    }

    @Test
    void createMedicalReport_ShouldHandleNullPrescriptions() {
        medicalReport.setPrescriptions(null);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.existsByAppointment(appointment)).thenReturn(false);
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport created = medicalReportService.createMedicalReport(medicalReport);

        assertNotNull(created);
        verify(medicalReportRepository, times(1)).save(medicalReport);
    }

    @Test
    void getAllMedicalReports_ShouldReturnAllReports() {
        List<MedicalReport> reports = Arrays.asList(medicalReport, new MedicalReport());
        when(medicalReportRepository.findAll()).thenReturn(reports);

        List<MedicalReport> result = medicalReportService.getAllMedicalReports();

        assertEquals(2, result.size());
        verify(medicalReportRepository, times(1)).findAll();
    }

    @Test
    void getMedicalReportById_ShouldReturnReport() {
        when(medicalReportRepository.findById(1L)).thenReturn(Optional.of(medicalReport));

        Optional<MedicalReport> result = medicalReportService.getMedicalReportById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getMedicalReportById_ShouldReturnEmptyWhenNotFound() {
        when(medicalReportRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<MedicalReport> result = medicalReportService.getMedicalReportById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getMedicalReportByAppointmentId_ShouldReturnReport() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(medicalReportRepository.findByAppointment(appointment)).thenReturn(Optional.of(medicalReport));

        Optional<MedicalReport> result = medicalReportService.getMedicalReportByAppointmentId(1L);

        assertTrue(result.isPresent());
        verify(medicalReportRepository).findByAppointment(appointment);
    }

    @Test
    void getMedicalReportByAppointmentId_ShouldThrowExceptionWhenAppointmentNotFound() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> medicalReportService.getMedicalReportByAppointmentId(99L));
    }

    @Test
    void getMedicalReportsByPatient_ShouldReturnPatientReports() {
        List<MedicalReport> reports = Arrays.asList(medicalReport);
        when(medicalReportRepository.findByAppointmentPatientOrderByCreatedDateDesc(patient)).thenReturn(reports);

        List<MedicalReport> result = medicalReportService.getMedicalReportsByPatient(patient);

        assertEquals(1, result.size());
        verify(medicalReportRepository, times(1)).findByAppointmentPatientOrderByCreatedDateDesc(patient);
    }

    @Test
    void getMedicalReportsByDoctorId_ShouldReturnDoctorReports() {
        List<MedicalReport> reports = Arrays.asList(medicalReport);
        when(medicalReportRepository.findByAppointmentDoctorIdOrderByCreatedDateDesc(1L)).thenReturn(reports);

        List<MedicalReport> result = medicalReportService.getMedicalReportsByDoctorId(1L);

        assertEquals(1, result.size());
        verify(medicalReportRepository, times(1)).findByAppointmentDoctorIdOrderByCreatedDateDesc(1L);
    }

    @Test
    void updateMedicalReport_ShouldUpdateFieldsAndPrescriptions() {
        MedicalReport existingReport = spy(new MedicalReport());
        existingReport.setId(1L);
        existingReport.setDiagnosis("Old diagnosis");
        existingReport.setPrescriptions(new ArrayList<>());

        MedicalReport details = new MedicalReport();
        details.setDiagnosis("New diagnosis");
        details.setSymptoms("Headache, fever");
        details.setPhysicalExamination("Normal");
        details.setInvestigations("Blood test");
        details.setRecommendations("Rest");
        details.setAdditionalNotes("Follow up in 2 weeks");

        Prescription newPrescription = new Prescription();
        newPrescription.setMedication("Paracetamol");
        details.setPrescriptions(List.of(newPrescription));

        when(medicalReportRepository.findById(1L)).thenReturn(Optional.of(existingReport));
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport updated = medicalReportService.updateMedicalReport(1L, details);

        assertEquals("New diagnosis", updated.getDiagnosis());
        assertEquals("Headache, fever", updated.getSymptoms());
        assertEquals("Normal", updated.getPhysicalExamination());
        assertEquals("Blood test", updated.getInvestigations());
        assertEquals("Rest", updated.getRecommendations());
        assertEquals("Follow up in 2 weeks", updated.getAdditionalNotes());
        assertEquals(1, updated.getPrescriptions().size());
        verify(medicalReportRepository).save(any(MedicalReport.class));
        verify(existingReport).addPrescription(any(Prescription.class));
    }

    @Test
    void updateMedicalReport_ShouldThrowExceptionWhenNotFound() {
        when(medicalReportRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> medicalReportService.updateMedicalReport(99L, new MedicalReport()));
    }

    @Test
    void updateMedicalReport_ShouldHandleNullPrescriptions() {
        MedicalReport existingReport = new MedicalReport();
        existingReport.setId(1L);
        existingReport.setDiagnosis("Old diagnosis");
        existingReport.setPrescriptions(new ArrayList<>());

        MedicalReport details = new MedicalReport();
        details.setDiagnosis("New diagnosis");
        details.setPrescriptions(null);

        when(medicalReportRepository.findById(1L)).thenReturn(Optional.of(existingReport));
        when(medicalReportRepository.save(any(MedicalReport.class))).thenAnswer(i -> i.getArguments()[0]);

        MedicalReport updated = medicalReportService.updateMedicalReport(1L, details);

        assertEquals("New diagnosis", updated.getDiagnosis());
        verify(medicalReportRepository).save(any(MedicalReport.class));
    }

    @Test
    void deleteMedicalReport_ShouldCallRepositoryDelete() {
        medicalReportService.deleteMedicalReport(1L);

        verify(medicalReportRepository, times(1)).deleteById(1L);
    }
}
