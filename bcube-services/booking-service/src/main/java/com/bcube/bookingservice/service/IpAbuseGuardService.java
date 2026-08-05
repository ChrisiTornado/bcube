package com.bcube.bookingservice.service;

import com.bcube.bookingservice.exception.IpBannedException;
import com.bcube.bookingservice.persistance.entity.BookingIpEvent;
import com.bcube.bookingservice.persistance.entity.IpBan;
import com.bcube.bookingservice.persistance.entity.IpEventType;
import com.bcube.bookingservice.persistance.repository.BookingIpEventRepository;
import com.bcube.bookingservice.persistance.repository.IpBanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Blocks a book-then-cancel abuse pattern (e.g. repeatedly grabbing and releasing slots) by
 * tracking every successful booking creation/cancellation per source IP. 10 bookings AND 10
 * cancellations from the same IP within a rolling hour trips a 24h ban; a repeat trip within 3
 * months of the last ban escalates to 2 weeks (and stays at 2 weeks for any further repeat inside
 * that window). From the 7th cancellation in that same rolling hour onward (3 short of the trigger),
 * every further cancellation carries a warning back to the caller naming exactly how many are left.
 *
 * Deliberately keyed on IP rather than user id - a determined abuser can create new accounts far
 * more easily than a new IP, and the pattern itself (rapid book+cancel cycling) is what's being
 * blocked, not any one account. A ban only blocks NEW bookings (see assertNotBanned's call site in
 * bookTimeSlot) - it never blocks cancelling an existing booking, which is harmless.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IpAbuseGuardService {
    private static final int TRIGGER_THRESHOLD = 10;
    private static final int WARNING_BUFFER = 3;
    private static final int WARNING_THRESHOLD = TRIGGER_THRESHOLD - WARNING_BUFFER;
    private static final Duration DETECTION_WINDOW = Duration.ofHours(1);
    private static final Duration FIRST_BAN_DURATION = Duration.ofHours(24);
    private static final Duration ESCALATED_BAN_DURATION = Duration.ofDays(14);
    private static final Duration ESCALATION_WINDOW = Duration.ofDays(90);

    private static final DateTimeFormatter BAN_MESSAGE_FMT = DateTimeFormatter
            .ofPattern("dd.MM.yyyy, HH:mm", Locale.GERMAN)
            .withZone(ZoneId.of("Europe/Vienna"));

    private final BookingIpEventRepository bookingIpEventRepository;
    private final IpBanRepository ipBanRepository;
    private final Clock bookingClock;

    public void assertNotBanned(String ipAddress) {
        Instant now = Instant.now(bookingClock);
        ipBanRepository.findByIpAddress(ipAddress).ifPresent(ban -> {
            if (ban.getBannedUntil().isAfter(now)) {
                throw new IpBannedException(
                        "Aufgrund verdächtiger Aktivität vorübergehend gesperrt bis " + BAN_MESSAGE_FMT.format(ban.getBannedUntil()) + " Uhr."
                );
            }
        });
    }

    @Transactional
    public void recordBooking(String ipAddress) {
        bookingIpEventRepository.save(BookingIpEvent.builder()
                .ipAddress(ipAddress)
                .eventType(IpEventType.BOOK)
                .createdAt(Instant.now(bookingClock))
                .build());
    }

    /**
     * Records the cancellation and returns a user-facing message when relevant - either a warning
     * (7th-9th cancellation this hour) or a just-triggered ban notice. Returns null the rest of the
     * time (the overwhelming majority of normal, non-abusive cancellations).
     */
    @Transactional
    public String recordCancellationAndEvaluate(String ipAddress) {
        Instant now = Instant.now(bookingClock);
        bookingIpEventRepository.save(BookingIpEvent.builder()
                .ipAddress(ipAddress)
                .eventType(IpEventType.CANCEL)
                .createdAt(now)
                .build());

        Instant windowStart = now.minus(DETECTION_WINDOW);
        long bookCount = bookingIpEventRepository.countByIpAddressAndEventTypeAndCreatedAtAfter(ipAddress, IpEventType.BOOK, windowStart);
        long cancelCount = bookingIpEventRepository.countByIpAddressAndEventTypeAndCreatedAtAfter(ipAddress, IpEventType.CANCEL, windowStart);

        if (bookCount >= TRIGGER_THRESHOLD && cancelCount >= TRIGGER_THRESHOLD) {
            Instant bannedUntil = banIp(ipAddress, now);
            return "Du wurdest aufgrund wiederholten Buchens und Stornierens vorübergehend gesperrt bis "
                    + BAN_MESSAGE_FMT.format(bannedUntil) + " Uhr.";
        }

        if (cancelCount >= WARNING_THRESHOLD) {
            long remaining = TRIGGER_THRESHOLD - cancelCount;
            return "Achtung: Du hast bereits " + cancelCount + " Stornierungen in dieser Stunde. Bei "
                    + remaining + " weiteren wirst du vorübergehend gesperrt.";
        }

        return null;
    }

    private Instant banIp(String ipAddress, Instant now) {
        IpBan ban = ipBanRepository.findByIpAddress(ipAddress).orElse(null);

        // Checked before ban's own fields are overwritten below - this is what makes it "was the
        // PREVIOUS ban within the last 3 months", not the one we're about to write.
        boolean escalate = ban != null && ban.getBannedAt().isAfter(now.minus(ESCALATION_WINDOW));
        Duration duration = escalate ? ESCALATED_BAN_DURATION : FIRST_BAN_DURATION;

        if (ban == null) {
            ban = IpBan.builder()
                    .ipAddress(ipAddress)
                    .banCount(0)
                    .build();
        }

        ban.setBannedAt(now);
        ban.setBannedUntil(now.plus(duration));
        ban.setBanCount(ban.getBanCount() + 1);
        ipBanRepository.save(ban);

        log.warn("IP {} banned until {} (escalated={}, banCount={})", ipAddress, ban.getBannedUntil(), escalate, ban.getBanCount());
        return ban.getBannedUntil();
    }
}
