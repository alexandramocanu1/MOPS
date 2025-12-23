package com.mops.backend.service;

import com.mops.backend.dto.DoctorStatisticsDTO;
import com.mops.backend.dto.MonthlyReportDTO;
import com.mops.backend.model.Appointment;
import com.mops.backend.model.Doctor;
import com.mops.backend.repository.AppointmentRepository;
import com.mops.backend.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    public MonthlyReportDTO generateMonthlyReport(int year, int month) {
        // Calculate start and end of the month
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        // Get all appointments for the month
        List<Appointment> appointments = appointmentRepository.findAll().stream()
                .filter(app -> app.getAppointmentDate().isAfter(startDate.minusSeconds(1))
                        && app.getAppointmentDate().isBefore(endDate.plusSeconds(1)))
                .collect(Collectors.toList());

        // Calculate overall statistics
        int totalAppointments = appointments.size();
        int confirmedAppointments = (int) appointments.stream()
                .filter(app -> "CONFIRMED".equals(app.getStatus()))
                .count();
        int cancelledAppointments = (int) appointments.stream()
                .filter(app -> "CANCELLED".equals(app.getStatus()))
                .count();
        int completedAppointments = (int) appointments.stream()
                .filter(app -> "COMPLETED".equals(app.getStatus()))
                .count();
        int pendingAppointments = (int) appointments.stream()
                .filter(app -> "PENDING".equals(app.getStatus()))
                .count();
        int rejectedAppointments = (int) appointments.stream()
                .filter(app -> "REJECTED".equals(app.getStatus()))
                .count();

        // Group appointments by doctor and calculate statistics
        Map<Doctor, List<Appointment>> appointmentsByDoctor = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getDoctor));

        List<DoctorStatisticsDTO> doctorStatistics = new ArrayList<>();
        for (Map.Entry<Doctor, List<Appointment>> entry : appointmentsByDoctor.entrySet()) {
            Doctor doctor = entry.getKey();
            List<Appointment> doctorAppointments = entry.getValue();

            int doctorTotal = doctorAppointments.size();
            int doctorConfirmed = (int) doctorAppointments.stream()
                    .filter(app -> "CONFIRMED".equals(app.getStatus()))
                    .count();
            int doctorCancelled = (int) doctorAppointments.stream()
                    .filter(app -> "CANCELLED".equals(app.getStatus()))
                    .count();
            int doctorCompleted = (int) doctorAppointments.stream()
                    .filter(app -> "COMPLETED".equals(app.getStatus()))
                    .count();
            long uniquePatients = doctorAppointments.stream()
                    .map(app -> app.getPatient().getId())
                    .distinct()
                    .count();

            String specialtyName = doctor.getSpecialty() != null ?
                    doctor.getSpecialty().getName() : "N/A";

            DoctorStatisticsDTO doctorStats = new DoctorStatisticsDTO(
                    doctor.getId(),
                    doctor.getUser().getFullName(),
                    specialtyName,
                    doctorTotal,
                    (int) uniquePatients,
                    doctorConfirmed,
                    doctorCancelled,
                    doctorCompleted
            );
            doctorStatistics.add(doctorStats);
        }

        // Sort doctor statistics by total appointments (descending)
        doctorStatistics.sort((d1, d2) -> Integer.compare(d2.getTotalAppointments(), d1.getTotalAppointments()));

        return new MonthlyReportDTO(
                month,
                year,
                totalAppointments,
                confirmedAppointments,
                cancelledAppointments,
                completedAppointments,
                pendingAppointments,
                rejectedAppointments,
                doctorStatistics
        );
    }
}
