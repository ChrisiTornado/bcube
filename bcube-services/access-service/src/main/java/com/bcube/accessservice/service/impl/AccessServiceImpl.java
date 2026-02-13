package com.bcube.accessservice.service.impl;

import com.bcube.accessservice.exception.AccessCodeDoesNotExistException;
import com.bcube.accessservice.exception.BookingDoneException;
import com.bcube.accessservice.exception.EncryptionException;
import com.bcube.accessservice.persistance.entity.AccessPermission;
import com.bcube.accessservice.persistance.repository.AccessRepository;
import com.bcube.accessservice.service.AccessService;
import com.bcube.accessservice.service.dto.request.AccessRequest;
import com.bcube.accessservice.service.dto.response.AccessResponse;
import com.bcube.accessservice.service.dto.response.StornoResponse;
import com.bcube.accessservice.utility.CryptoUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {
    private static final SecureRandom secureRandom = new SecureRandom();
    private final AccessRepository accessRepository;
    private final CryptoUtil cryptoUtil;

    @Override
    public AccessResponse createPermission(AccessRequest accessRequest) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy'T'HH:mm:ss"); // z. B. "07.07.2025T13:15:00"

        LocalDateTime start = LocalDateTime.parse(accessRequest.getValidFrom(), formatter);
        LocalDateTime end = LocalDateTime.parse(accessRequest.getValidUntil(), formatter);

        Instant validFrom = start.atZone(ZoneId.of("Europe/Vienna")).toInstant();
        Instant validUntil = end.atZone(ZoneId.of("Europe/Vienna")).toInstant();

        Instant now = Instant.now();

        if (now.isAfter(validFrom)) {
            throw new BookingDoneException("Booking done");
        }

        if (validFrom.isAfter(validUntil)) {
            throw new IllegalArgumentException("Invalid time range");
        }

        String pinCode = generateAccessCode();
        String encryptedPin;
        try {
            encryptedPin = cryptoUtil.encrypt(pinCode);
        } catch (Exception e) {
            throw new EncryptionException("PIN encryption failed");
        }

        AccessPermission accessPermission = AccessPermission.builder()
                .pinCode(encryptedPin)
                .bookingId(accessRequest.getBookingId())
                .validFrom(validFrom)
                .validUntil(validUntil)
                .build();

        accessRepository.save(accessPermission);
        return new AccessResponse(
                pinCode
        );
    }

    @Transactional
    @Override
    public StornoResponse deletePermission(Long bookingId) {
        Optional<AccessPermission> pinCode = accessRepository.findByBookingId(bookingId);
        if (pinCode.isEmpty()) {
            throw new AccessCodeDoesNotExistException("Access code does not exist");
        }
        accessRepository.deleteByBookingId(bookingId);
        return new StornoResponse(true);
    }

    @Override
    public AccessResponse getPinCode(Long bookingId) {
        AccessPermission permission = accessRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AccessCodeDoesNotExistException("Access code does not exist"));

        String encryptedPin;
        try {
            encryptedPin = cryptoUtil.decrypt(permission.getPinCode());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return new AccessResponse(encryptedPin);
    }

    private String generateAccessCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}