package com.bcube.paymentservice.utility;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * SHA-256 of a normalized phone number, used to detect welcome-voucher grants for the same
 * real-world phone under different accounts. Not raw PII: data-minimization in a service that
 * has no other reason to hold it.
 */
public final class PhoneHashUtil {
    private PhoneHashUtil() {}

    public static String hash(String phone) {
        String normalized = phone.replaceAll("[^0-9]", "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 nicht verfügbar", e);
        }
    }
}
