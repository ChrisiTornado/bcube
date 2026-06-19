package com.bcube.userservice.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.from:christophe.andunda@gmail.com}")
    private String mailFrom;

    public void sendPasswordResetCode(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject("Dein Passwort-Zurücksetzen-Code");
        message.setText("Hallo,\n\n"
                + "Dein Code zum Zurücksetzen des Passworts lautet: " + code + "\n"
                + "Er ist 15 Minuten gültig.\n\n"
                + "Viele Grüße\nDein BCube-Team");
        mailSender.send(message);
    }
}
