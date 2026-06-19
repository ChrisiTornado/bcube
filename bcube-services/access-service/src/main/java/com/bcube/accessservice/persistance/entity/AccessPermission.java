package com.bcube.accessservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
        name="access_permissions"
)
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class AccessPermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "smartlock_id")
    private Long smartLockId;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "access_code", nullable = false)
    private String accessCode;

    @Column(name = "auth_code_hash")
    private String authCodeHash;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "check_in_completed")
    private boolean checkInCompleted = false;

    @Column(name = "face_verified")
    private boolean faceVerified = false;
}
