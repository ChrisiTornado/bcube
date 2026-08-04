package com.bcube.studioservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
public class StudioResponse {
    private Long id;
    private Long smartlockId;
    private String name;
    private String description;
    private String street;
    private int plz;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private String imageBase64;
    private List<String> imageGalleryBase64;
    private boolean isActive;
    private Instant createdAt;
    private Integer hourlyRateCents;
}
