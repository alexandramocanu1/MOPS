package com.mops.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
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
import com.mops.backend.model.Doctor;
import com.mops.backend.model.User;
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

    private User patient;
    private Doctor doctor;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        patient = new User();
        patient.setId(1L);
        patient.setEmail("patient@test.com");

        doctor = new Doctor();
        doctor.setId(1L);

        appointment = new Appointment();
        appointment.setId(1L);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStatus("PENDING");
    }

    @Test
    void createAppointment_ShouldSetStatusAndIncrementPopularity() {
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);
        doNothing().when(emailService).sendAppointmentConfirmation(any(Appointment.class));

        Appointment created = appointmentService.createAppointment(appointment);

        assertEquals("PENDING", created.getStatus());
        assertNotNull(created.getCreatedAt());
        verify(doctorService, times(1)).incrementPopularity(1L);
        verify(emailService, times(1)).sendAppointmentConfirmation(any(Appointment.class));
    }

    @Test
    void getAllAppointments_ShouldReturnAllAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment, new Appointment());
        when(appointmentRepository.findAll()).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAllAppointments();

        assertEquals(2, result.size());
        verify(appointmentRepository, times(1)).findAll();
    }

    @Test
    void getAppointmentById_ShouldReturnAppointment() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        Optional<Appointment> result = appointmentService.getAppointmentById(1L);

        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    void getAppointmentById_ShouldReturnEmptyWhenNotFound() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        Optional<Appointment> result = appointmentService.getAppointmentById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void getAppointmentsByPatient_ShouldReturnPatientAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment);
        when(appointmentRepository.findByPatientOrderByAppointmentDateDesc(patient)).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAppointmentsByPatient(patient);

        assertEquals(1, result.size());
        verify(appointmentRepository, times(1)).findByPatientOrderByAppointmentDateDesc(patient);
    }

    @Test
    void getAppointmentsByDoctor_ShouldReturnDoctorAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment);
        when(appointmentRepository.findByDoctorOrderByAppointmentDateAsc(doctor)).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAppointmentsByDoctor(doctor);

        assertEquals(1, result.size());
        verify(appointmentRepository, times(1)).findByDoctorOrderByAppointmentDateAsc(doctor);
    }

    @Test
    void getAppointmentsByStatus_ShouldReturnFilteredAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment);
        when(appointmentRepository.findByStatus("PENDING")).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAppointmentsByStatus("PENDING");

        assertEquals(1, result.size());
        assertEquals("PENDING", result.get(0).getStatus());
    }

    @Test
    void getAppointmentsByPatientAndStatus_ShouldReturnFilteredAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment);
        when(appointmentRepository.findByPatientAndStatus(patient, "PENDING")).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAppointmentsByPatientAndStatus(patient, "PENDING");

        assertEquals(1, result.size());
        verify(appointmentRepository, times(1)).findByPatientAndStatus(patient, "PENDING");
    }

    @Test
    void getAppointmentsByDoctorAndStatus_ShouldReturnFilteredAppointments() {
        List<Appointment> appointments = Arrays.asList(appointment);
        when(appointmentRepository.findByDoctorAndStatus(doctor, "CONFIRMED")).thenReturn(appointments);

        List<Appointment> result = appointmentService.getAppointmentsByDoctorAndStatus(doctor, "CONFIRMED");

        assertEquals(1, result.size());
        verify(appointmentRepository, times(1)).findByDoctorAndStatus(doctor, "CONFIRMED");
    }

    @Test
    void confirmAppointment_ShouldChangeStatusToConfirmed() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.confirmAppointment(1L);

        assertEquals("CONFIRMED", result.getStatus());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void rejectAppointment_ShouldChangeStatusToRejected() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.rejectAppointment(1L);

        assertEquals("REJECTED", result.getStatus());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void cancelAppointment_ShouldChangeStatusAndSendEmail() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.cancelAppointment(1L);

        assertEquals("CANCELLED", result.getStatus());
        verify(emailService, times(1)).sendAppointmentCancellation(result);
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void completeAppointment_ShouldChangeStatusToCompleted() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.completeAppointment(1L);

        assertEquals("COMPLETED", result.getStatus());
        assertNotNull(result.getUpdatedAt());
    }

    @Test
    void setPendingAppointment_ShouldChangeStatusToPending() {
        appointment.setStatus("COMPLETED");
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment result = appointmentService.setPendingAppointment(1L);

        assertEquals("PENDING", result.getStatus());
    }

    @Test
    void updateAppointmentStatus_ShouldThrowExceptionWhenIdNotFound() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            appointmentService.confirmAppointment(99L);
        });
    }

    @Test
    void deleteAppointment_ShouldCallRepositoryDelete() {
        appointmentService.deleteAppointment(1L);

        verify(appointmentRepository, times(1)).deleteById(1L);
    }

    @Test
    void getDoctorAppointmentsBetweenDates_ShouldReturnFilteredAppointments() {
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().plusDays(7);
        List<Appointment> appointments = Arrays.asList(appointment);

        when(appointmentRepository.findByDoctorAndAppointmentDateBetween(doctor, start, end))
            .thenReturn(appointments);

        List<Appointment> result = appointmentService.getDoctorAppointmentsBetweenDates(doctor, start, end);

        assertEquals(1, result.size());
        verify(appointmentRepository, times(1)).findByDoctorAndAppointmentDateBetween(doctor, start, end);
    }

    @Test
    void updateAppointment_ShouldModifyAllSpecifiedFields() {
        Appointment existingApp = new Appointment();
        existingApp.setId(1L);
        existingApp.setStatus("PENDING");
        existingApp.setNotes("Old note");

        Doctor newDoctor = new Doctor();
        newDoctor.setId(2L);

        Appointment details = new Appointment();
        details.setDoctor(newDoctor);
        details.setAppointmentDate(LocalDateTime.now().plusDays(1));
        details.setNotes("New note");
        details.setStatus("CONFIRMED");
        details.setCost(150.0);

        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(existingApp));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        Appointment updated = appointmentService.updateAppointment(1L, details);

        assertNotNull(updated);
        assertEquals("New note", updated.getNotes());
        assertEquals("CONFIRMED", updated.getStatus());
        assertEquals(2L, updated.getDoctor().getId());
        assertEquals(150.0, updated.getCost());
        assertNotNull(updated.getUpdatedAt());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void updateAppointment_ShouldThrowExceptionWhenNotFound() {
        when(appointmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            appointmentService.updateAppointment(99L, new Appointment());
        });
    }
}
