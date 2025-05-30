package com.example.bcube.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "studios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Studio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 50)
    private String description;

    @Column(nullable = false, length = 50)
    private String location;

    @Column(nullable = false, length = 50)
    private String equipment;

    @Column(name = "is_active", nullable = false, length = 50)
    private boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
