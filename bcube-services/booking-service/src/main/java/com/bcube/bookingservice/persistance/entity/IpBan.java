package com.bcube.bookingservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** One row per IP that has ever been banned - kept (not deleted) after expiry so banCount/bannedAt can drive the 3-month escalation window. */
@Entity
@Table(name = "ip_bans")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IpBan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", nullable = false, unique = true)
    private String ipAddress;

    @Column(name = "banned_at", nullable = false)
    private Instant bannedAt;

    @Column(name = "banned_until", nullable = false)
    private Instant bannedUntil;

    @Column(name = "ban_count", nullable = false)
    private int banCount;
}
