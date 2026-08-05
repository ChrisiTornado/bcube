package com.bcube.userservice.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;

/**
 * Every method here sends a branded HTML email (Thymeleaf templates under
 * resources/templates/email/). Methods backing a flow the user is actively waiting on
 * (password-reset code) let send failures propagate, since a silently-swallowed failure would
 * leave the user stuck with no way to know the code never arrived. Methods that are best-effort
 * side effects of something else (welcome, deletion, booking, payment notifications) catch and
 * log instead, so a mail outage never blocks the primary operation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetCode(String to, String firstName, String code) {
        sendHtmlEmail(to, "Dein Passwort-Zurücksetzen-Code", "email/password-reset", Map.of(
                "firstName", firstName,
                "code", code
        ));
    }

    public void sendPasswordChangedConfirmation(String to, String firstName) {
        sendHtmlEmailSafely(to, "Dein Passwort wurde geändert", "email/password-changed", Map.of(
                "firstName", firstName
        ));
    }

    public void sendWelcomeEmail(String to, String firstName) {
        sendHtmlEmailSafely(to, "Willkommen bei bcube!", "email/welcome", Map.of(
                "firstName", firstName,
                "appUrl", frontendUrl + "/user-dashboard/studios"
        ));
    }

    public void sendAccountDeletedEmail(String to, String firstName) {
        sendHtmlEmailSafely(to, "Dein bcube-Account wurde gelöscht", "email/account-deleted", Map.of(
                "firstName", firstName
        ));
    }

    public void sendBookingConfirmedEmail(String to, String firstName, String studioName, String date, String time) {
        sendHtmlEmailSafely(to, "Deine Buchung ist bestätigt", "email/booking-confirmed", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "date", date,
                "time", time,
                "appUrl", frontendUrl + "/user-dashboard/bookings"
        ));
    }

    public void sendBookingCancelledEmail(String to, String firstName, String studioName, String date, String time, String refundNote) {
        sendHtmlEmailSafely(to, "Deine Buchung wurde storniert", "email/booking-cancelled", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "date", date,
                "time", time,
                "refundNote", refundNote == null ? "" : refundNote,
                "appUrl", frontendUrl + "/user-dashboard/studios"
        ));
    }

    public void sendBookingReminderEmail(String to, String firstName, String studioName, String date, String time) {
        sendHtmlEmailSafely(to, "Dein Termin steht bald an", "email/booking-reminder", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "date", date,
                "time", time,
                "appUrl", frontendUrl + "/user-dashboard/bookings"
        ));
    }

    public void sendPaymentSucceededEmail(String to, String firstName, String studioName, String date, String amount) {
        sendHtmlEmailSafely(to, "Dein Zahlungsbeleg", "email/payment-succeeded", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "date", date,
                "amount", amount
        ));
    }

    public void sendPaymentFailedEmail(String to, String firstName, String studioName, String date) {
        sendHtmlEmailSafely(to, "Deine Zahlung konnte nicht verarbeitet werden", "email/payment-failed", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "date", date,
                "appUrl", frontendUrl + "/user-dashboard/studios"
        ));
    }

    public void sendRefundProcessedEmail(String to, String firstName, String studioName, String amount) {
        sendHtmlEmailSafely(to, "Deine Rückerstattung wurde veranlasst", "email/refund-processed", Map.of(
                "firstName", firstName,
                "studioName", studioName,
                "amount", amount
        ));
    }

    private void sendHtmlEmailSafely(String to, String subject, String template, Map<String, Object> variables) {
        try {
            sendHtmlEmail(to, subject, template, variables);
        } catch (Exception e) {
            log.error("E-Mail '{}' an {} konnte nicht gesendet werden: {}", template, to, e.getMessage(), e);
        }
    }

    private void sendHtmlEmail(String to, String subject, String template, Map<String, Object> variables) {
        Context context = new Context(Locale.GERMAN);
        context.setVariables(variables);
        String html = templateEngine.process(template, context);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("E-Mail konnte nicht erstellt werden", e);
        }
    }
}
