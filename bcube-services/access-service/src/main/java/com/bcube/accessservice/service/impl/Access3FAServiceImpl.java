package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.persistance.repository.AccessRepository;
import com.bcube.accessservice.service.nuki.NukiService;
import com.bcube.accessservice.utility.CryptoUtil;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.rekognition.RekognitionClient;

// Service logic is identical to 2FA.
// The third factor (Authenticator login via JWT) is enforced by WebSecurityConfig.
@Slf4j
@Service
@ConditionalOnProperty(name = "fa.level", havingValue = "3")
public class Access3FAServiceImpl extends Access2FAServiceImpl {

    public Access3FAServiceImpl(
            NukiService nukiService,
            AccessRepository accessRepository,
            CryptoUtil cryptoUtil,
            JavaMailSender mailSender,
            RekognitionClient rekognitionClient) {
        super(nukiService, accessRepository, cryptoUtil, mailSender, rekognitionClient);
    }

    @Override
    @PostConstruct
    public void logActiveMode() {
        log.info("╔══════════════════════════════════════════════════════════════════╗");
        log.info("║  Auth Mode: 3FA — Authenticator + Buchungscode + Face Scan      ║");
        log.info("╚══════════════════════════════════════════════════════════════════╝");
    }
}
