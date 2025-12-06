package com.bcube.userservice.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class MailService {
    private JavaMailSender mailSender;

    public void sendPasswordResetCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Dein Passwort-Zurücksetzen-Code");
        message.setText("Hallo,\n\n"
                + "Dein Code zum Zurücksetzen des Passworts lautet: " + code + "\n"
                + "Er ist 15 Minuten gültig.\n\n"
                + "Viele Grüße\nDein BCube-Team");
        mailSender.send(message);
    }
}
