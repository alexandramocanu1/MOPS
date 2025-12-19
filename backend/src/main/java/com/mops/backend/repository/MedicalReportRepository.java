package com.mops.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mops.backend.model.Appointment;
import com.mops.backend.model.MedicalReport;
import com.mops.backend.model.User;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {

    Optional<MedicalReport> findByAppointment(Appointment appointment);

    List<MedicalReport> findByAppointmentPatientOrderByCreatedDateDesc(User patient);

    List<MedicalReport> findByAppointmentDoctorIdOrderByCreatedDateDesc(Long doctorId);

    boolean existsByAppointment(Appointment appointment);
}
