package com.bcube.accessservice.service.nuki;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NukiService {
    private final RestClient nukiRestClient;
    private static final DateTimeFormatter NUKI_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    // TEMPORARY until launch: Nuki is intentionally kept deactivated during payment-flow
    // testing (avoids real per-use Nuki costs). Flip nuki.mock-enabled back to false (or
    // remove the property) before going live - defaults to false so this is opt-in only.
    @Value("${nuki.mock-enabled:false}")
    private boolean mockEnabled;

    public void addSmartKeyCode(Long bookingId, int pinCode, Long smartlockId, Instant validfrom, Instant validuntil) {
        if (mockEnabled) {
            log.info("nuki.mock-enabled=true - skipping real Nuki call for booking {} (smartlock {})", bookingId, smartlockId);
            return;
        }

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
