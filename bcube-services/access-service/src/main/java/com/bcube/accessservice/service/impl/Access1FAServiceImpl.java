package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.exception.AccessCodeDoesNotExistException;
import com.bcube.accessservice.exception.BookingDoneException;
import com.bcube.accessservice.persistance.entity.AccessPermission;
import com.bcube.accessservice.persistance.repository.AccessRepository;
import com.bcube.accessservice.service.dto.request.CheckInRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.CheckInResponse;
import com.bcube.accessservice.service.dto.response.FaceVerificationResponse;
import com.bcube.accessservice.service.nuki.NukiService;
import com.bcube.accessservice.utility.CryptoUtil;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;

@Slf4j
@Service
@ConditionalOnProperty(name = "fa.level", havingValue = "1")
public class Access1FAServiceImpl extends AbstractAccessService {

    public Access1FAServiceImpl(
            NukiService nukiService,
            AccessRepository accessRepository,
            CryptoUtil cryptoUtil,
            JavaMailSender mailSender) {
        super(nukiService, accessRepository, cryptoUtil, mailSender);
    }

    @Override
    @Transactional
    public AccessCodeResponse createPermission(AccessRequest accessRequest) {
        AccessCodeResponse response = super.createPermission(accessRequest);
        accessRepository.findFirstByBookingIdOrderByIdDesc(accessRequest.getBookingId())
                .ifPresent(permission -> pushNukiCode(permission, response.getAccessCode()));
        return response;
    }

    @PostConstruct
    public void logActiveMode() {
        log.info("╔══════════════════════════════════════╗");
        log.info("║  Auth Mode: 1FA — Buchungscode only  ║");
        log.info("╚══════════════════════════════════════╝");
    }

    @Override
    public CheckInResponse checkIn(CheckInRequest request) {
        String hash = sha256(request.getAuthCode());
        AccessPermission permission = accessRepository.findByAuthCodeHash(hash)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Code ungültig oder nicht gefunden"));
        if (Instant.now().isAfter(permission.getValidUntil())) {
            throw new BookingDoneException("Buchung ist bereits abgelaufen");
        }
        return new CheckInResponse(
                permission.getBookingId(),
                permission.getSmartLockId(),
                permission.getValidFrom(),
                permission.getValidUntil()
        );
    }

    @Override
    public FaceVerificationResponse verifyFace(MultipartFile image, Long bookingId) {
        throw new UnsupportedOperationException("Face-Verifikation ist im 1FA-Modus nicht verfügbar");
    }

    @Override
    public AccessCodeResponse generateNukiCode(Long bookingId) {
        AccessPermission permission = accessRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Keine Berechtigung gefunden"));
        if (Instant.now().isAfter(permission.getValidUntil())) {
            throw new BookingDoneException("Buchung ist bereits abgelaufen");
        }
        int nukiPin = generateAccessCode();
        log.info("1FA — Nuki-Code generiert: {} für Booking {}", nukiPin, bookingId);
        pushNukiCode(permission, nukiPin);
        if (permission.getUserEmail() != null) {
            sendNukiCodeByMail(permission.getUserEmail(), nukiPin);
        }
        return new AccessCodeResponse(nukiPin);
    }
}
