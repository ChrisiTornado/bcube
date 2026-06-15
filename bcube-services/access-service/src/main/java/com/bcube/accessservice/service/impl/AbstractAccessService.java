package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.exception.AccessCodeDoesNotExistException;
import com.bcube.accessservice.exception.BookingDoneException;
import com.bcube.accessservice.exception.EncryptionException;
import com.bcube.accessservice.persistance.entity.AccessPermission;
import com.bcube.accessservice.persistance.repository.AccessRepository;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import com.bcube.accessservice.service.nuki.NukiService;
import com.bcube.accessservice.utility.CryptoUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Slf4j
public abstract class AbstractAccessService implements AccessService {

    private static final SecureRandom secureRandom = new SecureRandom();

    protected final NukiService nukiService;
    protected final AccessRepository accessRepository;
    protected final CryptoUtil cryptoUtil;
    protected final JavaMailSender mailSender;

    protected AbstractAccessService(
            NukiService nukiService,
            AccessRepository accessRepository,
            CryptoUtil cryptoUtil,
            JavaMailSender mailSender) {
        this.nukiService = nukiService;
        this.accessRepository = accessRepository;
        this.cryptoUtil = cryptoUtil;
        this.mailSender = mailSender;
    }

    @Override
    @Transactional
    public AccessCodeResponse createPermission(AccessRequest accessRequest) {
        Instant validFrom = Instant.parse(accessRequest.getValidFrom());
        Instant validUntil = Instant.parse(accessRequest.getValidUntil());

        if (validFrom.isAfter(validUntil)) {
            throw new IllegalArgumentException("Invalid time range");
        }

        int pinCode = generateAccessCode();
        String encryptedPin;
        try {
            encryptedPin = cryptoUtil.encrypt(Integer.toString(pinCode));
        } catch (Exception e) {
            throw new EncryptionException("PIN encryption failed");
        }

        String authCodeHash = sha256(Integer.toString(pinCode));

        List<AccessPermission> existingPermissions = accessRepository
                .findAllByBookingIdOrderByIdDesc(accessRequest.getBookingId());

        AccessPermission accessPermission = existingPermissions.stream()
                .findFirst()
                .orElseGet(AccessPermission::new);

        accessPermission.setBookingId(accessRequest.getBookingId());
        accessPermission.setSmartLockId(accessRequest.smartlockId);
        accessPermission.setAccessCode(encryptedPin);
        accessPermission.setAuthCodeHash(authCodeHash);
        accessPermission.setValidFrom(validFrom);
        accessPermission.setValidUntil(validUntil);
        accessPermission.setUserEmail(accessRequest.getUserEmail());
        accessPermission.setCheckInCompleted(false);
        accessPermission.setFaceVerified(false);

        if (existingPermissions.size() > 1) {
            accessRepository.deleteAll(existingPermissions.stream().skip(1).toList());
        }

        pushNukiCode(accessPermission, pinCode);
        accessRepository.save(accessPermission);
        return new AccessCodeResponse(pinCode);
    }

    @Override
    @Transactional
    public StornoResponse deletePermission(Long bookingId) {
        List<AccessPermission> existingPermissions = accessRepository.findAllByBookingIdOrderByIdDesc(bookingId);
        if (existingPermissions.isEmpty()) {
            throw new AccessCodeDoesNotExistException("Access code does not exist");
        }
        accessRepository.deleteAll(existingPermissions);
        return new StornoResponse(true);
    }

    @Override
    public AccessCodeResponse getAccessCode(Long bookingId) {
        AccessPermission permission = accessRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Access code does not exist"));
        String decryptedPin;
        try {
            decryptedPin = cryptoUtil.decrypt(permission.getAccessCode());
        } catch (Exception e) {
            throw new EncryptionException("Zutrittscode konnte nicht gelesen werden");
        }
        return new AccessCodeResponse(Integer.parseInt(decryptedPin));
    }

    protected void pushNukiCode(AccessPermission permission, int nukiPin) {
        try {
            nukiService.addSmartKeyCode(
                    permission.getBookingId(),
                    nukiPin,
                    permission.getSmartLockId(),
                    permission.getValidFrom(),
                    permission.getValidUntil()
            );
            log.info("Nuki API: Code erfolgreich registriert");
        } catch (Exception e) {
            log.error("Nuki API Fehler (nicht-fatal): {}", e.getMessage());
        }
    }

    protected void sendNukiCodeByMail(String to, int nukiPin) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Dein bcube Keypad-Code");
            message.setText("Dein Keypad-Code lautet: " + nukiPin + "\n\nGib diesen Code am Nuki-Keypad ein, um Zugang zu erhalten.");
            mailSender.send(message);
            log.info("Nuki-Code per E-Mail gesendet an {}", to);
        } catch (Exception e) {
            log.error("E-Mail konnte nicht gesendet werden an {}: {}", to, e.getMessage());
        }
    }

    protected int generateAccessCode() {
        int code;
        do {
            code = 0;
            for (int i = 0; i < 6; i++) {
                code = code * 10 + (1 + secureRandom.nextInt(9));
            }
        } while (code / 10000 == 12);
        return code;
    }

    protected String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }
}
