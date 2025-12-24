package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.repository.AppointmentRepository;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorService doctorService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AppointmentService appointmentService;

    @Test
    void createAppointment_ShouldSetStatusAndIncrementPopularity() {

        Doctor doctor = new Doctor();
        doctor.setId(1L);

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);

        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);
        doNothing().when(emailService).sendAppointmentConfirmation(any(Appointment.class));

        Appointment created = appointmentService.createAppointment(appointment);

        assertEquals("PENDING", created.getStatus());
        assertNotNull(created.getCreatedAt());
        verify(doctorService, times(1)).incrementPopularity(1L);
        verify(emailService, times(1)).sendAppointmentConfirmation(any(Appointment.class));
    }

    @Test
    void confirmAppointment_ShouldChangeStatusToConfirmed() {

        Appointment app = new Appointment();
        app.setId(10L);
        app.setStatus("PENDING");

        when(appointmentRepository.findById(10L)).thenReturn(Optional.of(app));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.confirmAppointment(10L);

        assertEquals("CONFIRMED", result.getStatus());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void updateStatus_ShouldThrowExceptionWhenIdNotFound() {

        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            appointmentService.confirmAppointment(99L);
        });
    }

    @Test
void updateAppointment_ShouldModifyAllSpecifiedFields() {
    Appointment existingApp = new Appointment();
    existingApp.setId(1L);
    existingApp.setStatus("PENDING");
    existingApp.setNotes("Nota veche");

    Doctor newDoctor = new Doctor();
    newDoctor.setId(2L);
    
    Appointment details = new Appointment();
    details.setDoctor(newDoctor);
    details.setAppointmentDate(LocalDateTime.now().plusDays(1));
    details.setNotes("Nota noua");
    details.setStatus("CONFIRMED");

    when(appointmentRepository.findById(1L)).thenReturn(Optional.of(existingApp));
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

    Appointment updated = appointmentService.updateAppointment(1L, details);

    assertNotNull(updated);
    assertEquals("Nota noua", updated.getNotes());
    assertEquals("CONFIRMED", updated.getStatus());
    assertEquals(2L, updated.getDoctor().getId());
    verify(appointmentRepository, times(1)).save(any(Appointment.class));
}
}