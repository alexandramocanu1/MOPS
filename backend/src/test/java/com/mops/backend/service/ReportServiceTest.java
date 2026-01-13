package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Arrays;

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
    }

    @Test
    void generateMonthlyReport_ShouldCalculateCorrectStats() {
        LocalDateTime janDate = LocalDateTime.of(2024, 1, 15, 10, 0);
        
        User patient1 = new User(); patient1.setId(10L);
        User patient2 = new User(); patient2.setId(11L);

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

    private Appointment createAppointment(Doctor doctor, User patient, LocalDateTime date, String status) {
        Appointment app = new Appointment();
        app.setDoctor(doctor);
        app.setPatient(patient);
        app.setAppointmentDate(date);
        app.setStatus(status);
        return app;
    }
}