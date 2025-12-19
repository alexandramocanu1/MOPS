package com.mops.backend.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "medical_reports")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @Column(nullable = false, length = 1000)
    private String diagnosis;

    @Column(length = 2000)
    private String symptoms;

    @Column(length = 2000)
    private String physicalExamination;

    @Column(length = 2000)
    private String investigations;

    @OneToMany(mappedBy = "medicalReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Prescription> prescriptions = new ArrayList<>();

    @Column(length = 2000)
    private String recommendations;

    @Column
    private LocalDate followUpDate;

    @Column(length = 2000)
    private String additionalNotes;

    @Column(nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    // Constructors
    public MedicalReport() {}

    public MedicalReport(Appointment appointment, String diagnosis) {
        this.appointment = appointment;
        this.diagnosis = diagnosis;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getPhysicalExamination() { return physicalExamination; }
    public void setPhysicalExamination(String physicalExamination) {
        this.physicalExamination = physicalExamination;
    }

    public String getInvestigations() { return investigations; }
    public void setInvestigations(String investigations) { this.investigations = investigations; }

    public List<Prescription> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<Prescription> prescriptions) {
        this.prescriptions = prescriptions;
        // Set bidirectional relationship
        if (prescriptions != null) {
            for (Prescription prescription : prescriptions) {
                prescription.setMedicalReport(this);
            }
        }
    }

    public void addPrescription(Prescription prescription) {
        prescriptions.add(prescription);
        prescription.setMedicalReport(this);
    }

    public void removePrescription(Prescription prescription) {
        prescriptions.remove(prescription);
        prescription.setMedicalReport(null);
    }

    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public String getAdditionalNotes() { return additionalNotes; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}
