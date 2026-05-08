package com.bcube.studioservice.persistance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "studios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Studio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 50)
    private String street;

    @Column(nullable = false)
    private int plz;

    @Column(nullable = false, length = 50)
    private String city;

    @Column(nullable = false, length = 50)
    private String country;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Lob
    @Column(name = "image_data")
    private byte[] image;

    @Lob
    @Column(name = "image_gallery_json", columnDefinition = "TEXT")
    private String imageGalleryJson;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}
