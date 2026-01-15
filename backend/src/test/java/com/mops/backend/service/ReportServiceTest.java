package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.dto.MonthlyReportDTO;
import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;
import com.mops.backend.repository.AppointmentRepository;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @InjectMocks
    private ReportService reportService;

    private Doctor doctor1;
    private Doctor doctor2;
    private User patient1;
    private User patient2;

    @BeforeEach
    void setUp() {
        User u1 = new User();
        u1.setFirstName("Ana");
        u1.setLastName("Ionescu");
        Specialty s1 = new Specialty();
        s1.setName("Cardiology");
        doctor1 = new Doctor();
        doctor1.setId(1L);
        doctor1.setUser(u1);
        doctor1.setSpecialty(s1);

        User u2 = new User();
        u2.setFirstName("Maria");
        u2.setLastName("Popescu");
        doctor2 = new Doctor();
        doctor2.setId(2L);
        doctor2.setUser(u2);

        patient1 = new User();
        patient1.setId(10L);
        patient2 = new User();
        patient2.setId(11L);
    }

    @Test
    void generateMonthlyReport_ShouldCalculateCorrectStats() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        Appointment app1 = createAppointment(doctor1, patient1, janDate, "CONFIRMED");
        Appointment app2 = createAppointment(doctor1, patient2, janDate, "CANCELLED");
        Appointment app3 = createAppointment(doctor2, patient1, janDate, "COMPLETED");

        Appointment appOld = createAppointment(doctor1, patient1, LocalDateTime.of(2023, 12, 1, 10, 0), "CONFIRMED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1, app2, app3, appOld));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertNotNull(report);
        assertEquals(3, report.getTotalAppointments(), "Should've ignored December appointment");
        assertEquals(1, report.getConfirmedAppointments());
        assertEquals(1, report.getCancelledAppointments());
        assertEquals(1, report.getCompletedAppointments());

        assertEquals(2, report.getDoctorStatistics().size());

        var statsD1 = report.getDoctorStatistics().stream()
                .filter(s -> s.getDoctorId().equals(1L)).findFirst().orElseThrow();
        assertEquals(2, statsD1.getTotalAppointments());
        assertEquals(2, statsD1.getUniquePatients());
    }

    @Test
    void generateMonthlyReport_ShouldReturnEmptyStatsForNoAppointments() {
        when(appointmentRepository.findAll()).thenReturn(Collections.emptyList());

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertNotNull(report);
        assertEquals(0, report.getTotalAppointments());
        assertEquals(0, report.getConfirmedAppointments());
        assertEquals(0, report.getCancelledAppointments());
        assertEquals(0, report.getCompletedAppointments());
        assertEquals(0, report.getPendingAppointments());
        assertEquals(0, report.getRejectedAppointments());
        assertTrue(report.getDoctorStatistics().isEmpty());
    }

    @Test
    void generateMonthlyReport_ShouldCountPendingAppointments() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        Appointment app1 = createAppointment(doctor1, patient1, janDate, "PENDING");
        Appointment app2 = createAppointment(doctor1, patient2, janDate, "PENDING");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1, app2));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertEquals(2, report.getPendingAppointments());
        assertEquals(0, report.getConfirmedAppointments());
    }

    @Test
    void generateMonthlyReport_ShouldCountRejectedAppointments() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        Appointment app1 = createAppointment(doctor1, patient1, janDate, "REJECTED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertEquals(1, report.getRejectedAppointments());
    }

    @Test
    void generateMonthlyReport_ShouldCalculateCorrectYearAndMonth() {
        when(appointmentRepository.findAll()).thenReturn(Collections.emptyList());

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 6);

        assertEquals(2024, report.getYear());
        assertEquals(6, report.getMonth());
    }

    @Test
    void generateMonthlyReport_ShouldHandleDoctorWithNullSpecialty() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        doctor2.setSpecialty(null);
        Appointment app1 = createAppointment(doctor2, patient1, janDate, "CONFIRMED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertNotNull(report);
        assertEquals(1, report.getDoctorStatistics().size());
        assertEquals("N/A", report.getDoctorStatistics().get(0).getSpecialty());
    }

    @Test
    void generateMonthlyReport_ShouldSortDoctorsByTotalAppointmentsDescending() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        Appointment app1 = createAppointment(doctor1, patient1, janDate, "CONFIRMED");
        Appointment app2 = createAppointment(doctor2, patient1, janDate, "CONFIRMED");
        Appointment app3 = createAppointment(doctor2, patient2, janDate, "CONFIRMED");
        Appointment app4 = createAppointment(doctor2, patient1, janDate, "COMPLETED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1, app2, app3, app4));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertEquals(2, report.getDoctorStatistics().size());
        assertEquals(2L, report.getDoctorStatistics().get(0).getDoctorId());
        assertEquals(3, report.getDoctorStatistics().get(0).getTotalAppointments());
        assertEquals(1L, report.getDoctorStatistics().get(1).getDoctorId());
        assertEquals(1, report.getDoctorStatistics().get(1).getTotalAppointments());
    }

    @Test
    void generateMonthlyReport_ShouldCalculateUniquePatients() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);

        Appointment app1 = createAppointment(doctor1, patient1, janDate, "CONFIRMED");
        Appointment app2 = createAppointment(doctor1, patient1, janDate, "COMPLETED");
        Appointment app3 = createAppointment(doctor1, patient2, janDate, "CONFIRMED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(app1, app2, app3));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        var stats = report.getDoctorStatistics().get(0);
        assertEquals(3, stats.getTotalAppointments());
        assertEquals(2, stats.getUniquePatients());
    }

    @Test
    void generateMonthlyReport_ShouldFilterAppointmentsAtMonthBoundaries() {
        // Last day of previous month
        LocalDateTime dec31 = LocalDateTime.of(2023, 12, 31, 23, 59, 59);
        // First day of target month
        LocalDateTime jan1 = LocalDateTime.of(2024, 1, 1, 0, 0, 0);
        // Last day of target month
        LocalDateTime jan31 = LocalDateTime.of(2024, 1, 31, 23, 59, 59);
        // First day of next month
        LocalDateTime feb1 = LocalDateTime.of(2024, 2, 1, 0, 0, 0);

        Appointment appDec = createAppointment(doctor1, patient1, dec31, "CONFIRMED");
        Appointment appJan1 = createAppointment(doctor1, patient1, jan1, "CONFIRMED");
        Appointment appJan31 = createAppointment(doctor1, patient1, jan31, "CONFIRMED");
        Appointment appFeb = createAppointment(doctor1, patient1, feb1, "CONFIRMED");

        when(appointmentRepository.findAll()).thenReturn(Arrays.asList(appDec, appJan1, appJan31, appFeb));

        MonthlyReportDTO report = reportService.generateMonthlyReport(2024, 1);

        assertEquals(2, report.getTotalAppointments());
    }

    private Appointment createAppointment(Doctor doctor, User patient, LocalDateTime date, String status) {
        Appointment app = new Appointment();
        app.setDoctor(doctor);
        app.setPatient(patient);
        app.setAppointmentDate(date);
        app.setStatus(status);
        return app;
    }
}
