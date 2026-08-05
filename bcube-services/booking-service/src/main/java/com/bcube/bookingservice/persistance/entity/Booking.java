package com.bcube.bookingservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "bookings")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "studio_id", nullable = false)
    private Long studioId;

    // Nullable at the DB level on purpose: ddl-auto=update would fail booting against the
    // existing non-empty bookings table if this were added NOT NULL. Every new booking sets it.
    @Column(name = "smartlock_id")
    private Long smartlockId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Nullable: null means "no reminder sent yet". Set once BookingReminderService has emailed
    // the user, so the fixed-delay job never double-sends on its next run.
    @Column(name = "reminder_sent_at")
    private Instant reminderSentAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        if (this.status == null) {
            this.status = BookingStatus.CONFIRMED;
        }
    }
}
