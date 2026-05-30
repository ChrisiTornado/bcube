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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {
    private static final SecureRandom secureRandom = new SecureRandom();
    private final NukiService nukiService;
    private final AccessRepository accessRepository;
    private final CryptoUtil cryptoUtil;

    @Override
    @Transactional
    public AccessCodeResponse createPermission(AccessRequest accessRequest) {
        Instant validFrom = Instant.parse(accessRequest.getValidFrom());
        Instant validUntil = Instant.parse(accessRequest.getValidUntil());

        Instant now = Instant.now();

        if (now.isAfter(validFrom)) {
            throw new BookingDoneException("Booking done");
        }

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

        List<AccessPermission> existingPermissions = accessRepository
                .findAllByBookingIdOrderByIdDesc(accessRequest.getBookingId());

        AccessPermission accessPermission = existingPermissions.stream()
                .findFirst()
                .orElseGet(AccessPermission::new);

        accessPermission.setBookingId(accessRequest.getBookingId());
        accessPermission.setSmartLockId(accessRequest.smartlockId);
        accessPermission.setAccessCode(encryptedPin);
        accessPermission.setValidFrom(validFrom);
        accessPermission.setValidUntil(validUntil);

        if (existingPermissions.size() > 1) {
            accessRepository.deleteAll(existingPermissions.stream().skip(1).toList());
        }

        nukiService.addSmartKeyCode(accessRequest.getBookingId(), pinCode, accessRequest.smartlockId, validFrom, validUntil);
        accessRepository.save(accessPermission);
        return new AccessCodeResponse(
                pinCode
        );
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

    private int generateAccessCode() {
        int code;
        do {
            code = 0;
            for (int i = 0; i < 6; i++) {
                code = code * 10 + (1 + secureRandom.nextInt(9)); // Ziffern 1-9
            }
        } while (code / 10000 == 12); // erste zwei Ziffern != 12
        return code;
    }
}
