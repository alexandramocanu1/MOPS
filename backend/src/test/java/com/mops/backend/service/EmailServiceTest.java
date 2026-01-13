package com.mops.backend.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    private Appointment appointment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@clinic.com");
        ReflectionTestUtils.setField(emailService, "clinicName", "Mops Clinic");
        User patient = new User();
        patient.setFirstName("Ion");
        patient.setLastName("Popescu");
        patient.setEmail("ion.popescu@example.com");

        User doctorUser = new User();
        doctorUser.setFirstName("Andrei");
        doctorUser.setLastName("Ionescu");

        Specialty specialty = new Specialty();
        specialty.setName("Cardiologie");

        Doctor doctor = new Doctor();
        doctor.setUser(doctorUser);
        doctor.setSpecialty(specialty);

        appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(LocalDateTime.now().plusDays(1));
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setStatus("PENDING");
    }

    @Test
    void sendAppointmentConfirmation_ShouldSendEmailWithCorrectContent() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-confirmation"), any(Context.class)))
                .thenReturn("<html>Email Content</html>");

        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, times(1)).send(mimeMessage);
        verify(templateEngine, times(1)).process(eq("appointment-confirmation"), any(Context.class));
    }

    @Test
    void sendAppointmentCancellation_ShouldSendEmailWithCorrectContent() {
        appointment.setUpdatedAt(LocalDateTime.now());
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-cancellation"), any(Context.class)))
                .thenReturn("<html>Cancelled</html>");

        emailService.sendAppointmentCancellation(appointment);

        verify(mailSender, times(1)).send(mimeMessage);
        verify(templateEngine, times(1)).process(eq("appointment-cancellation"), any(Context.class));
    }

    @Test
    void sendEmail_ShouldNotSend_WhenPatientEmailIsNull() {
        appointment.getPatient().setEmail(null);

        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}