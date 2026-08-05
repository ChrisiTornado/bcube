package com.bcube.bookingservice.service;

import com.bcube.bookingservice.exception.IpBannedException;
import com.bcube.bookingservice.persistance.entity.IpBan;
import com.bcube.bookingservice.persistance.entity.IpEventType;
import com.bcube.bookingservice.persistance.repository.BookingIpEventRepository;
import com.bcube.bookingservice.persistance.repository.IpBanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class IpAbuseGuardServiceTest {

    private static final String IP = "203.0.113.5";

    private final BookingIpEventRepository bookingIpEventRepository = mock(BookingIpEventRepository.class);
    private final IpBanRepository ipBanRepository = mock(IpBanRepository.class);
    private final AtomicReference<Instant> clockInstant = new AtomicReference<>(Instant.parse("2026-08-05T10:00:00Z"));
    private final Clock clock = new Clock() {
        @Override public ZoneId getZone() { return ZoneId.of("Europe/Vienna"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return clockInstant.get(); }
    };

    private final IpAbuseGuardService guard = new IpAbuseGuardService(bookingIpEventRepository, ipBanRepository, clock);

    // In-memory stand-in for the one ip_bans row this IP would have, so banIp's
    // find-then-save round trip behaves the same way it would against a real repository.
    private final AtomicReference<IpBan> storedBan = new AtomicReference<>();

    @BeforeEach
    void wireBanPersistence() {
        when(ipBanRepository.findByIpAddress(IP)).thenAnswer(inv -> Optional.ofNullable(storedBan.get()));
        when(ipBanRepository.save(any(IpBan.class))).thenAnswer(inv -> {
            IpBan saved = inv.getArgument(0);
            storedBan.set(saved);
            return saved;
        });
    }

    private void stubCounts(long bookCount, long cancelCount) {
        when(bookingIpEventRepository.countByIpAddressAndEventTypeAndCreatedAtAfter(eq(IP), eq(IpEventType.BOOK), any())).thenReturn(bookCount);
        when(bookingIpEventRepository.countByIpAddressAndEventTypeAndCreatedAtAfter(eq(IP), eq(IpEventType.CANCEL), any())).thenReturn(cancelCount);
    }

    @Test
    void doesNotWarnOrBanBelowWarningThreshold() {
        stubCounts(6, 6);

        String result = guard.recordCancellationAndEvaluate(IP);

        assertThat(result).isNull();
        verify(ipBanRepository, never()).save(any());
        assertThatCode(() -> guard.assertNotBanned(IP)).doesNotThrowAnyException();
    }

    @Test
    void warnsFromSeventhCancellationOnward() {
        stubCounts(9, 7);

        String result = guard.recordCancellationAndEvaluate(IP);

        assertThat(result).contains("7").contains("3 weiteren");
        verify(ipBanRepository, never()).save(any());
    }

    @Test
    void warningNarrowsAsCancellationsClimb() {
        stubCounts(9, 9);

        String result = guard.recordCancellationAndEvaluate(IP);

        assertThat(result).contains("9").contains("1 weiteren");
    }

    @Test
    void bansFor24hOnFirstOffenseAtTenAndTen() {
        stubCounts(10, 10);

        String result = guard.recordCancellationAndEvaluate(IP);

        assertThat(result).contains("gesperrt");
        assertThat(storedBan.get()).isNotNull();
        assertThat(storedBan.get().getBannedUntil()).isEqualTo(clockInstant.get().plus(Duration.ofHours(24)));
        assertThatThrownBy(() -> guard.assertNotBanned(IP)).isInstanceOf(IpBannedException.class);
    }

    @Test
    void banExpiresAndNoLongerBlocks() {
        stubCounts(10, 10);
        guard.recordCancellationAndEvaluate(IP);

        clockInstant.set(clockInstant.get().plus(Duration.ofHours(25)));

        assertThatCode(() -> guard.assertNotBanned(IP)).doesNotThrowAnyException();
    }

    @Test
    void escalatesToTwoWeeksOnRepeatOffenseWithinThreeMonths() {
        stubCounts(10, 10);

        guard.recordCancellationAndEvaluate(IP); // first offense -> 24h
        Instant firstBanUntil = storedBan.get().getBannedUntil();

        clockInstant.set(clockInstant.get().plus(Duration.ofDays(30))); // still within 3 months
        guard.recordCancellationAndEvaluate(IP); // second offense -> escalate to 14 days

        assertThat(storedBan.get().getBanCount()).isEqualTo(2);
        assertThat(storedBan.get().getBannedUntil()).isEqualTo(clockInstant.get().plus(Duration.ofDays(14)));
        assertThat(storedBan.get().getBannedUntil()).isAfter(firstBanUntil);
    }

    @Test
    void doesNotEscalateAfterThreeMonthsHavePassed() {
        stubCounts(10, 10);

        guard.recordCancellationAndEvaluate(IP); // first offense -> 24h

        clockInstant.set(clockInstant.get().plus(Duration.ofDays(100))); // more than 3 months later
        guard.recordCancellationAndEvaluate(IP); // treated as a fresh first offense -> 24h again

        assertThat(storedBan.get().getBannedUntil()).isEqualTo(clockInstant.get().plus(Duration.ofHours(24)));
    }
}
