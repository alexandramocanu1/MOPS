package com.mops.backend.service;

import java.util.List;
import java.util.Optional;

import com.mops.backend.repository.AppointmentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mops.backend.model.Doctor;
import com.mops.backend.model.Specialty;
import com.mops.backend.model.User;
import com.mops.backend.repository.DoctorRepository;

@Service
public class DoctorService {
    
    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }
    
    public List<Doctor> getAllDoctors() {
        recalculatePopularityForAllDoctors();
        return doctorRepository.findAll();
    }
    
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }
    
    public Optional<Doctor> getDoctorByUser(User user) {
        return doctorRepository.findByUser(user);
    }
    
    public Optional<Doctor> getDoctorByUserId(Long userId) {
        return doctorRepository.findByUserId(userId);
    }
    
    public List<Doctor> getDoctorsBySpecialty(Specialty specialty) {
        return doctorRepository.findBySpecialty(specialty);
    }
    
    public List<Doctor> getDoctorsBySpecialtyOrderedByPopularity(Specialty specialty) {
        recalculatePopularityForAllDoctors();
        return doctorRepository.findBySpecialtyOrderByPopularityDesc(specialty);
    }
    
    public List<Doctor> getActiveDoctors() {
        return doctorRepository.findByIsActiveTrue();
    }
    
    public List<Doctor> getActiveDoctorsBySpecialtyOrderedByPopularity(Specialty specialty) {
        recalculatePopularityForAllDoctors();
        return doctorRepository.findBySpecialtyAndIsActiveTrueOrderByPopularityDesc(specialty);
    }
    
    public Doctor updateDoctor(Long id, Doctor doctorDetails) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        
        doctor.setSpecialty(doctorDetails.getSpecialty());
        doctor.setDescription(doctorDetails.getDescription());
        doctor.setExperienceYears(doctorDetails.getExperienceYears());
        doctor.setIsActive(doctorDetails.getIsActive());
        
        return doctorRepository.save(doctor);
    }
    
    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
    
    public void incrementPopularity(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
        
        doctor.setPopularity(doctor.getPopularity() + 1);
        doctorRepository.save(doctor);
    }
    
    public Doctor toggleDoctorStatus(Long id) {
        Doctor doctor = doctorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + id));
        
        doctor.setIsActive(!doctor.getIsActive());
        return doctorRepository.save(doctor);
    }

    @Transactional
    public void recalculatePopularityForAllDoctors()
    {
        List<Doctor> doctors = doctorRepository.findAll();
        if (doctors.isEmpty()) {
            return;
        }
        int maxExperienceYears = 0;
        long maxConsultations = 0L;

        for (Doctor d : doctors) {
            Integer exp = d.getExperienceYears();
            if (exp != null && exp > maxExperienceYears) {
                maxExperienceYears = exp;
            }

            long consultations = appointmentRepository.countByDoctor(d);
            if (consultations > maxConsultations) {
                maxConsultations = consultations;
            }
        }
        if (maxExperienceYears == 0) {
            maxExperienceYears = 1;
        }
        if (maxConsultations == 0) {
            maxConsultations = 1;
        }
        double experienceWeight = 0.6;     // 60% experience
        double consultationsWeight = 0.4;  // 40% consultations
        for (Doctor d : doctors) {
            int expYears = (d.getExperienceYears() != null) ? d.getExperienceYears() : 0;
            long consultCount = appointmentRepository.countByDoctor(d);

            double experienceScore = (double) expYears / maxExperienceYears;        // 0..1
            double consultationsScore = (double) consultCount / maxConsultations;  // 0..1

            double finalScore0to1 =
                    experienceScore * experienceWeight +
                            consultationsScore * consultationsWeight;

            int popularity = (int) Math.round(finalScore0to1 * 100.0); // 0..100
            d.setPopularity(popularity);
        }
        doctorRepository.saveAll(doctors);
    }
}