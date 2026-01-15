package com.mops.backend.service;

import com.mops.backend.model.Appointment;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.clinic-name}")
    private String clinicName;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendAppointmentConfirmation(Appointment appointment) {
        // Validate that patient and email exist
        if (appointment.getPatient() == null || appointment.getPatient().getEmail() == null || appointment.getPatient().getEmail().isEmpty()) {
            System.err.println("Cannot send email: Patient or patient email is null or empty");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getPatient().getEmail());
            helper.setSubject("Appointment Confirmation - " + clinicName);

            String htmlContent = buildAppointmentEmail(appointment);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);

            System.out.println("Appointment confirmation email sent to: " + appointment.getPatient().getEmail());
        } catch (MessagingException e) {
            System.err.println("Failed to send appointment confirmation email: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("Unexpected error sending email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildAppointmentEmail(Appointment appointment) {
        Context context = new Context();

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a");
        DateTimeFormatter timestampFormatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm:ss a");

        context.setVariable("clinicName", clinicName);
        context.setVariable("patientName", appointment.getPatient().getFirstName() + " " + appointment.getPatient().getLastName());
        context.setVariable("appointmentDate", appointment.getAppointmentDate().format(dateFormatter));
        context.setVariable("doctorName", "Dr. " + appointment.getDoctor().getUser().getFirstName() + " " + appointment.getDoctor().getUser().getLastName());
        context.setVariable("doctorSpecialty", appointment.getDoctor().getSpecialty().getName());
        context.setVariable("status", appointment.getStatus());
        context.setVariable("notes", appointment.getNotes() != null ? appointment.getNotes() : "No additional notes");
        context.setVariable("createdAt", appointment.getCreatedAt().format(timestampFormatter));
        context.setVariable("updatedAt", appointment.getUpdatedAt() != null ? appointment.getUpdatedAt().format(timestampFormatter) : "N/A");

        return templateEngine.process("appointment-confirmation", context);
    }

    public void sendAppointmentCancellation(Appointment appointment) {
        // Validate that patient and email exist
        if (appointment.getPatient() == null || appointment.getPatient().getEmail() == null || appointment.getPatient().getEmail().isEmpty()) {
            System.err.println("Cannot send cancellation email: Patient or patient email is null or empty");
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(appointment.getPatient().getEmail());
            helper.setSubject("Appointment Cancelled - " + clinicName);

            String htmlContent = buildCancellationEmail(appointment);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);

            System.out.println("Appointment cancellation email sent to: " + appointment.getPatient().getEmail());
        } catch (MessagingException e) {
            System.err.println("Failed to send appointment cancellation email: " + e.getMessage());
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("Unexpected error sending cancellation email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildCancellationEmail(Appointment appointment) {
        Context context = new Context();

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a");
        DateTimeFormatter timestampFormatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm:ss a");

        context.setVariable("clinicName", clinicName);
        context.setVariable("patientName", appointment.getPatient().getFirstName() + " " + appointment.getPatient().getLastName());
        context.setVariable("appointmentDate", appointment.getAppointmentDate().format(dateFormatter));
        context.setVariable("doctorName", "Dr. " + appointment.getDoctor().getUser().getFirstName() + " " + appointment.getDoctor().getUser().getLastName());
        context.setVariable("doctorSpecialty", appointment.getDoctor().getSpecialty().getName());
        context.setVariable("notes", appointment.getNotes() != null ? appointment.getNotes() : "No additional notes");
        context.setVariable("createdAt", appointment.getCreatedAt().format(timestampFormatter));
        context.setVariable("cancelledAt", appointment.getUpdatedAt() != null ? appointment.getUpdatedAt().format(timestampFormatter) : "N/A");

        return templateEngine.process("appointment-cancellation", context);
    }
}
