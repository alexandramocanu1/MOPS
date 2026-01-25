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

        when(appointmentRepository.findByAppointmentDateBetween(any(), any()))
                .thenReturn(Arrays.asList(app1, app2, app3));

        // isAnnual = false for Monthly
        MonthlyReportDTO report = reportService.generateReport(2024, 1, false);

        assertNotNull(report);
        assertEquals(2024, report.getYear());
        assertEquals(1, report.getMonth());
        assertEquals(3, report.getTotalAppointments());
        assertEquals(1, report.getConfirmedAppointments());
        assertEquals(1, report.getCancelledAppointments());
        assertEquals(1, report.getCompletedAppointments());
    }

    @Test
    void generateAnnualReport_ShouldSetMonthToZeroAndCalculateStats() {
        // Appointments in different months of the same year
        Appointment appJan = createAppointment(doctor1, patient1, LocalDateTime.of(2024, 1, 10, 10, 0), "COMPLETED");
        Appointment appDec = createAppointment(doctor1, patient1, LocalDateTime.of(2024, 12, 20, 15, 0), "CONFIRMED");

        when(appointmentRepository.findByAppointmentDateBetween(any(), any()))
                .thenReturn(Arrays.asList(appJan, appDec));

        // isAnnual = true
        MonthlyReportDTO report = reportService.generateReport(2024, 0, true);

        assertNotNull(report);
        assertEquals(2024, report.getYear());
        assertEquals(0, report.getMonth()); // 0 indicates annual
        assertEquals(2, report.getTotalAppointments());
        verify(appointmentRepository).findByAppointmentDateBetween(
                eq(LocalDateTime.of(2024, 1, 1, 0, 0)), 
                eq(LocalDateTime.of(2024, 12, 31, 23, 59, 59))
        );
    }

    @Test
    void generateReport_ShouldHandleDoctorWithNullSpecialty() {
        LocalDateTime date = LocalDateTime.of(2024, 1, 15, 10, 0);
        doctor2.setSpecialty(null);
        Appointment app1 = createAppointment(doctor2, patient1, date, "CONFIRMED");

        when(appointmentRepository.findByAppointmentDateBetween(any(), any()))
                .thenReturn(Collections.singletonList(app1));

        MonthlyReportDTO report = reportService.generateReport(2024, 1, false);

        assertEquals("N/A", report.getDoctorStatistics().get(0).getSpecialty());
    }

    @Test
    void generateReport_ShouldSortDoctorsByTotalAppointmentsDescending() {
        LocalDateTime date = LocalDateTime.of(2024, 1, 15, 10, 0);
        
        // Doctor 1 has 1 app, Doctor 2 has 2 apps
        Appointment app1 = createAppointment(doctor1, patient1, date, "CONFIRMED");
        Appointment app2 = createAppointment(doctor2, patient1, date, "CONFIRMED");
        Appointment app3 = createAppointment(doctor2, patient2, date, "CONFIRMED");

        when(appointmentRepository.findByAppointmentDateBetween(any(), any()))
                .thenReturn(Arrays.asList(app1, app2, app3));

        MonthlyReportDTO report = reportService.generateReport(2024, 1, false);

        assertEquals(2L, report.getDoctorStatistics().get(0).getDoctorId());
        assertEquals(3, report.getTotalAppointments());
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