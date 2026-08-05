package com.bcube.bookingservice.service;

import com.bcube.bookingservice.client.NotificationClient;
import com.bcube.bookingservice.client.StudioClient;
import com.bcube.bookingservice.client.UserClient;
import com.bcube.bookingservice.persistance.entity.Booking;
import com.bcube.bookingservice.persistance.entity.BookingStatus;
import com.bcube.bookingservice.persistance.repository.BookingRepository;
import com.bcube.bookingservice.security.InternalTokenProvider;
import com.bcube.bookingservice.service.dto.Classes.StudioDto;
import com.bcube.bookingservice.service.dto.Classes.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Emails a reminder for every CONFIRMED booking starting within the next 24h that hasn't been
 * reminded yet. Re-querying the same rolling window on every run is intentional and safe - the
 * reminderSentAt filter is what actually makes this idempotent, not the window's precision.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingReminderService {
    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Europe/Vienna");
    private static final DateTimeFormatter EMAIL_DATE_FMT = DateTimeFormatter
            .ofPattern("dd. MMMM yyyy", Locale.GERMAN)
            .withZone(DISPLAY_ZONE);
    private static final DateTimeFormatter EMAIL_TIME_FMT = DateTimeFormatter
            .ofPattern("HH:mm")
            .withZone(DISPLAY_ZONE);

    private final BookingRepository bookingRepository;
    private final UserClient userClient;
    private final StudioClient studioClient;
    private final NotificationClient notificationClient;
    private final InternalTokenProvider internalTokenProvider;
    private final Clock bookingClock;

    @Transactional
    @Scheduled(fixedDelayString = "${booking.reminder.scheduler.delay-ms:900000}")
    public void sendUpcomingBookingReminders() {
        Instant now = Instant.now(bookingClock);
        Instant in24Hours = now.plusSeconds(24 * 3600);

        List<Booking> candidates = bookingRepository.findAllByStatusAndReminderSentAtIsNullAndStartTimeBetween(
                BookingStatus.CONFIRMED, now, in24Hours
        );

        if (candidates.isEmpty()) {
            return;
        }

        String systemToken = internalTokenProvider.generateSystemToken();
        int sentCount = 0;

        for (Booking booking : candidates) {
            try {
                UserDto user = userClient.getUserById(booking.getUserId(), systemToken);
                StudioDto studio = studioClient.getStudioById(booking.getStudioId());

                notificationClient.sendBookingReminder(
                        user.getEmail(), user.getFirstName(), studio.getName(),
                        EMAIL_DATE_FMT.format(booking.getStartTime()),
                        EMAIL_TIME_FMT.format(booking.getStartTime()) + "–" + EMAIL_TIME_FMT.format(booking.getEndTime()) + " Uhr"
                );

                booking.setReminderSentAt(now);
                bookingRepository.save(booking);
                sentCount++;
            } catch (Exception e) {
                log.error("Erinnerung für Buchung {} konnte nicht gesendet werden: {}", booking.getId(), e.getMessage(), e);
            }
        }

        if (sentCount > 0) {
            log.info("Sent {} booking reminders", sentCount);
        }
    }
}
