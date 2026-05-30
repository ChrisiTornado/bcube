package com.bcube.accessservice.service.nuki;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NukiService {
    private final RestClient nukiRestClient;
    private static final DateTimeFormatter NUKI_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    public void addSmartKeyCode(Long bookingId, int pinCode, Long smartlockId, Instant validfrom, Instant validuntil) {
        nukiRestClient.put()
                .uri("smartlock/auth")
                .body(Map.of(
                        "name", "Booking " + bookingId,
                        "type", 13,
                        "code", pinCode,
                        "smartlockIds", List.of(String.valueOf(smartlockId)),
                        "allowedFromDate", NUKI_FORMATTER.format(validfrom),
                        "allowedUntilDate", NUKI_FORMATTER.format(validuntil),
                        "allowedWeekDays", 127
                ))
                .retrieve()
                .toBodilessEntity();
    }
}
