package com.mops.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorStatisticsDTO {
    private Long doctorId;
    private String doctorName;
    private String specialty;
    private int totalAppointments;
    private int uniquePatients;
    private int confirmedAppointments;
    private int cancelledAppointments;
    private int completedAppointments;
}
