package com.bcube.studioservice.persistance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One gallery image of a studio, stored as two pre-scaled JPEGs (see StudioImageProcessor).
 * The hashes let an unchanged image be recognised when a client sends the gallery back on update
 * (e.g. the thumbnails it received in a list), so the stored full-size image is kept instead of
 * being overwritten by the smaller copy.
 */
@Entity
@Table(name = "studio_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudioImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "studio_id", nullable = false)
    private Long studioId;

    @Column(nullable = false)
    private int position;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "full_data", nullable = false)
    private byte[] fullData;

    @Column(name = "thumb_data", nullable = false)
    private byte[] thumbData;

    @Column(name = "full_sha256", nullable = false, length = 64)
    private String fullSha256;

    @Column(name = "thumb_sha256", nullable = false, length = 64)
    private String thumbSha256;

    @Column(nullable = false, length = 64)
    private String etag;
}
