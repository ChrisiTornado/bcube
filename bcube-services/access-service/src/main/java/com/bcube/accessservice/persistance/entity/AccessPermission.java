package com.bcube.accessservice.persistance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
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
public class AccessPermission {
    @Id
    private Long id;

    @Column(name = "nuki_auth_id", nullable = false)
    private Long nukiAuthId;

    @Column(name = "studio_io", nullable = false)
    private Long studioId;

    @Column(name = "pin_code", nullable = false, length = 10)
    private String pinCode;

    @Column(name = "valid_from", nullable = false)
    private Instant validFrom;

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;
}
