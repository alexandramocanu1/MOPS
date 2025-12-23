package com.mops.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReportDTO {
    private int month;
    private int year;
    private int totalAppointments;
    private int confirmedAppointments;
    private int cancelledAppointments;
    private int completedAppointments;
    private int pendingAppointments;
    private int rejectedAppointments;
    private List<DoctorStatisticsDTO> doctorStatistics;
}
