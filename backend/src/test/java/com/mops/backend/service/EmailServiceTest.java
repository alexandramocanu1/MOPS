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
    private User patient;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@clinic.com");
        ReflectionTestUtils.setField(emailService, "clinicName", "Mops Clinic");

        patient = new User();
        patient.setFirstName("Ion");
        patient.setLastName("Popescu");
        patient.setEmail("ion.popescu@example.com");

        User doctorUser = new User();
        doctorUser.setFirstName("Andrei");
        doctorUser.setLastName("Ionescu");

        Specialty specialty = new Specialty();
        specialty.setName("Cardiology");

        doctor = new Doctor();
        doctor.setUser(doctorUser);
        doctor.setSpecialty(specialty);

        appointment = new Appointment();
        appointment.setId(1L);
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
    void sendAppointmentConfirmation_ShouldNotSendWhenPatientEmailIsNull() {
        patient.setEmail(null);

        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
        verify(mailSender, never()).createMimeMessage();
    }

    @Test
    void sendAppointmentConfirmation_ShouldNotSendWhenPatientEmailIsEmpty() {
        patient.setEmail("");

        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentConfirmation_ShouldNotSendWhenPatientIsNull() {
        appointment.setPatient(null);

        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
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
    void sendAppointmentCancellation_ShouldNotSendWhenPatientEmailIsNull() {
        patient.setEmail(null);

        emailService.sendAppointmentCancellation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentCancellation_ShouldNotSendWhenPatientEmailIsEmpty() {
        patient.setEmail("");

        emailService.sendAppointmentCancellation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentCancellation_ShouldNotSendWhenPatientIsNull() {
        appointment.setPatient(null);

        emailService.sendAppointmentCancellation(appointment);

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentConfirmation_ShouldHandleMailException() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-confirmation"), any(Context.class)))
                .thenReturn("<html>Email Content</html>");
        doThrow(new RuntimeException("Mail server unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw exception - the service catches and logs errors
        emailService.sendAppointmentConfirmation(appointment);

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void sendAppointmentCancellation_ShouldHandleMailException() {
        appointment.setUpdatedAt(LocalDateTime.now());
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-cancellation"), any(Context.class)))
                .thenReturn("<html>Cancelled</html>");
        doThrow(new RuntimeException("Mail server unavailable")).when(mailSender).send(any(MimeMessage.class));

        // Should not throw exception - the service catches and logs errors
        emailService.sendAppointmentCancellation(appointment);

        verify(mailSender, times(1)).send(mimeMessage);
    }

    @Test
    void sendAppointmentConfirmation_ShouldCallTemplateEngine() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-confirmation"), any(Context.class)))
                .thenReturn("<html>Email Content</html>");

        emailService.sendAppointmentConfirmation(appointment);

        verify(templateEngine, times(1)).process(eq("appointment-confirmation"), any(Context.class));
    }

    @Test
    void sendAppointmentCancellation_ShouldCallTemplateEngine() {
        appointment.setUpdatedAt(LocalDateTime.now());
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("appointment-cancellation"), any(Context.class)))
                .thenReturn("<html>Cancelled</html>");

        emailService.sendAppointmentCancellation(appointment);

        verify(templateEngine, times(1)).process(eq("appointment-cancellation"), any(Context.class));
    }
}
