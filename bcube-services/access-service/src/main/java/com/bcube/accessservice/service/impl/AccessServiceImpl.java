package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.exception.AccessCodeDoesNotExistException;
import com.bcube.accessservice.exception.BookingDoneException;
import com.bcube.accessservice.exception.EncryptionException;
import com.bcube.accessservice.persistance.entity.AccessPermission;
import com.bcube.accessservice.persistance.repository.AccessRepository;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.request.CheckInRequest;
import com.bcube.accessservice.service.dto.response.AccessCodeResponse;
import com.bcube.accessservice.service.dto.response.CheckInResponse;
import com.bcube.accessservice.service.dto.response.FaceVerificationResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import com.bcube.accessservice.service.nuki.NukiService;
import com.bcube.accessservice.utility.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.Image;
import software.amazon.awssdk.services.rekognition.model.InvalidParameterException;
import software.amazon.awssdk.services.rekognition.model.SearchFacesByImageRequest;
import software.amazon.awssdk.services.rekognition.model.SearchFacesByImageResponse;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {
    private static final SecureRandom secureRandom = new SecureRandom();
    private final NukiService nukiService;
    private final AccessRepository accessRepository;
    private final CryptoUtil cryptoUtil;
    private final RekognitionClient rekognitionClient;
    private final JavaMailSender mailSender;

    @Value("${aws.rekognition.collection-id}")
    private String collectionId;

    @Value("${aws.rekognition.confidence-threshold}")
    private float confidenceThreshold;

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

        if (existingPermissions.size() > 1) {
            accessRepository.deleteAll(existingPermissions.stream().skip(1).toList());
        }

        // Nuki code is NOT pushed here — it is generated after face verification at check-in
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
        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Bild konnte nicht gelesen werden", e);
        }

        SearchFacesByImageRequest request = SearchFacesByImageRequest.builder()
                .collectionId(collectionId)
                .image(Image.builder()
                        .bytes(SdkBytes.fromByteArray(imageBytes))
                        .build())
                .faceMatchThreshold(confidenceThreshold)
                .maxFaces(1)
                .build();

        try {
            log.info("Calling Rekognition searchFacesByImage — collection={}, threshold={}", collectionId, confidenceThreshold);
            SearchFacesByImageResponse response = rekognitionClient.searchFacesByImage(request);
            boolean verified = !response.faceMatches().isEmpty();
            log.info("Rekognition result: {} match(es) found — verified={}", response.faceMatches().size(), verified);
            if (verified) {
                log.info("Matched FaceId={}, confidence={}",
                        response.faceMatches().get(0).face().faceId(),
                        response.faceMatches().get(0).face().confidence());
            }
            return new FaceVerificationResponse(verified);
        } catch (InvalidParameterException e) {
            log.warn("Rekognition: kein Gesicht im Bild erkannt — {}", e.getMessage());
            return new FaceVerificationResponse(false);
        } catch (Exception e) {
            log.error("Rekognition Fehler: {} — {}", e.getClass().getSimpleName(), e.getMessage());
            throw new RuntimeException("Gesichtserkennung fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    @Override
    public AccessCodeResponse generateNukiCode(Long bookingId) {
        AccessPermission permission = accessRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Keine Berechtigung gefunden"));

        if (Instant.now().isAfter(permission.getValidUntil())) {
            throw new BookingDoneException("Buchung ist bereits abgelaufen");
        }

        int nukiPin = generateAccessCode();
        log.info("Nuki-Code generiert: {} für Booking {}", nukiPin, bookingId);

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

        if (permission.getUserEmail() != null) {
            sendNukiCodeByMail(permission.getUserEmail(), nukiPin);
        } else {
            log.warn("Keine E-Mail für Booking {} gespeichert — kein Mail-Versand", bookingId);
        }

        return new AccessCodeResponse(nukiPin);
    }

    private void sendNukiCodeByMail(String to, int nukiPin) {
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

    private int generateAccessCode() {
        int code;
        do {
            code = 0;
            for (int i = 0; i < 6; i++) {
                code = code * 10 + (1 + secureRandom.nextInt(9));
            }
        } while (code / 10000 == 12);
        return code;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }
}
