package com.bcube.bookingservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One row per successful booking creation/cancellation, keyed by source IP - feeds IpAbuseGuardService's rolling-window abuse check. */
@Entity
@Table(name = "booking_ip_events")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookingIpEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private IpEventType eventType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
