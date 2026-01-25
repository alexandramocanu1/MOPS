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
//import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    public MonthlyReportDTO generateReport(int year, int month, boolean isAnnual, int months) {
        LocalDateTime startDate;
        LocalDateTime endDate;

        if (isAnnual) {
            startDate = LocalDateTime.of(year, 1, 1, 0, 0, 0);
            endDate = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        } else if (months > 0) {
            // For multi-month reports (3 or 6 months)
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();

            // Add the specified number of months
            YearMonth endYearMonth = yearMonth.plusMonths(months - 1);
            endDate = endYearMonth.atEndOfMonth().atTime(23, 59, 59);
        } else {
            // For single month reports
            YearMonth yearMonth = YearMonth.of(year, month);
            startDate = yearMonth.atDay(1).atStartOfDay();
            endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        }

        List<Appointment> appointments = appointmentRepository.findByAppointmentDateBetween(startDate, endDate);
        return calculateStatistics(year, isAnnual ? 0 : month, appointments);
    }

    private MonthlyReportDTO calculateStatistics(int year, int month, List<Appointment> appointments) {
        int totalAppointments = appointments.size();
        Map<String, Long> statusCounts = appointments.stream()
                .filter(app -> app.getStatus() != null)
                .collect(Collectors.groupingBy(Appointment::getStatus, Collectors.counting()));

        Map<Doctor, List<Appointment>> appointmentsByDoctor = appointments.stream()
                .filter(app -> app.getDoctor() != null)
                .collect(Collectors.groupingBy(Appointment::getDoctor));

        List<DoctorStatisticsDTO> doctorStatistics = appointmentsByDoctor.entrySet().stream()
                .map(entry -> {
                    Doctor doctor = entry.getKey();
                    List<Appointment> docsApps = entry.getValue();

                    long uniquePatients = docsApps.stream()
                            .map(app -> app.getPatient().getId())
                            .distinct()
                            .count();

                    return new DoctorStatisticsDTO(
                            doctor.getId(),
                            doctor.getUser().getFullName(),
                            doctor.getSpecialty() != null ? doctor.getSpecialty().getName() : "N/A",
                            docsApps.size(),
                            (int) uniquePatients,
                            countStatus(docsApps, "CONFIRMED"),
                            countStatus(docsApps, "CANCELLED"),
                            countStatus(docsApps, "COMPLETED")
                    );
                })
                .sorted((d1, d2) -> Integer.compare(d2.getTotalAppointments(), d1.getTotalAppointments()))
                .collect(Collectors.toList());

        return new MonthlyReportDTO(
                month, // 0 indicates Annual
                year,
                totalAppointments,
                statusCounts.getOrDefault("CONFIRMED", 0L).intValue(),
                statusCounts.getOrDefault("CANCELLED", 0L).intValue(),
                statusCounts.getOrDefault("COMPLETED", 0L).intValue(),
                statusCounts.getOrDefault("PENDING", 0L).intValue(),
                statusCounts.getOrDefault("REJECTED", 0L).intValue(),
                doctorStatistics
        );
    }

    private int countStatus(List<Appointment> list, String status) {
        return (int) list.stream().filter(a -> status.equals(a.getStatus())).count();
    }
}