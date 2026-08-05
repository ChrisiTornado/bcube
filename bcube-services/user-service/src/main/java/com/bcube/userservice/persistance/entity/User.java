package com.bcube.userservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column
    private String firstName;

    @Column
    private String lastName;

    @Column
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private String resetCode;

    @Column
    private Instant resetCodeExpiresAt;

    @Column
    private Instant resetVerifiedAt;

    /** Failed verify-code attempts against the current resetCode - reset to 0 whenever a fresh
     * code is issued, invalidated once it reaches the lockout threshold (see AuthServiceImpl). */
    @Column
    @Builder.Default
    private int resetCodeAttempts = 0;

    @Enumerated(EnumType.STRING)
    @Column
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column
    private String providerId;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}