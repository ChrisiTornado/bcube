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
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.Image;
import software.amazon.awssdk.services.rekognition.model.InvalidParameterException;
import software.amazon.awssdk.services.rekognition.model.SearchFacesByImageRequest;
import software.amazon.awssdk.services.rekognition.model.SearchFacesByImageResponse;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Service
@ConditionalOnProperty(name = "fa.level", havingValue = "2")
public class Access2FAServiceImpl extends AbstractAccessService {

    protected final RekognitionClient rekognitionClient;

    @Value("${aws.rekognition.collection-id}")
    protected String collectionId;

    @Value("${aws.rekognition.confidence-threshold}")
    protected float confidenceThreshold;

    public Access2FAServiceImpl(
            NukiService nukiService,
            AccessRepository accessRepository,
            CryptoUtil cryptoUtil,
            JavaMailSender mailSender,
            RekognitionClient rekognitionClient) {
        super(nukiService, accessRepository, cryptoUtil, mailSender);
        this.rekognitionClient = rekognitionClient;
    }

    @PostConstruct
    public void logActiveMode() {
        log.info("╔══════════════════════════════════════════════════╗");
        log.info("║  Auth Mode: 2FA — Buchungscode + Face Scan       ║");
        log.info("╚══════════════════════════════════════════════════╝");
    }

    @Override
    public CheckInResponse checkIn(CheckInRequest request) {
        String hash = sha256(request.getAuthCode());
        AccessPermission permission = accessRepository.findByAuthCodeHash(hash)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Code ungültig oder nicht gefunden"));
        if (Instant.now().isAfter(permission.getValidUntil())) {
            throw new BookingDoneException("Buchung ist bereits abgelaufen");
        }
        permission.setCheckInCompleted(true);
        accessRepository.save(permission);
        return new CheckInResponse(
                permission.getBookingId(),
                permission.getSmartLockId(),
                permission.getValidFrom(),
                permission.getValidUntil()
        );
    }

    @Override
    public FaceVerificationResponse verifyFace(MultipartFile image, Long bookingId) {
        AccessPermission permission = accessRepository.findFirstByBookingIdOrderByIdDesc(bookingId)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Keine Berechtigung gefunden"));
        if (!permission.isCheckInCompleted()) {
            throw new IllegalStateException("Check-in muss zuerst abgeschlossen werden");
        }
        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Bild konnte nicht gelesen werden", e);
        }
        SearchFacesByImageRequest rekognitionRequest = SearchFacesByImageRequest.builder()
                .collectionId(collectionId)
                .image(Image.builder().bytes(SdkBytes.fromByteArray(imageBytes)).build())
                .faceMatchThreshold(confidenceThreshold)
                .maxFaces(1)
                .build();
        try {
            log.info("Calling Rekognition searchFacesByImage — collection={}, threshold={}", collectionId, confidenceThreshold);
            SearchFacesByImageResponse response = rekognitionClient.searchFacesByImage(rekognitionRequest);
            boolean verified = !response.faceMatches().isEmpty();
            log.info("Rekognition result: {} match(es) found — verified={}", response.faceMatches().size(), verified);
            if (verified) {
                log.info("Matched FaceId={}, confidence={}",
                        response.faceMatches().get(0).face().faceId(),
                        response.faceMatches().get(0).face().confidence());
                permission.setFaceVerified(true);
                accessRepository.save(permission);
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
        if (!permission.isFaceVerified()) {
            throw new IllegalStateException("Face-Verifikation muss zuerst abgeschlossen werden");
        }
        int nukiPin = generateAccessCode();
        log.info("2FA — Nuki-Code generiert: {} für Booking {}", nukiPin, bookingId);
        pushNukiCode(permission, nukiPin);
        return new AccessCodeResponse(nukiPin);
    }
}
