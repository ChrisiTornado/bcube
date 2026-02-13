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

    // @Column(name = "nuki_auth_id", nullable = false)
    // private Long nukiAuthId;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "pin_code", nullable = false)
    private String pinCode;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;
}
