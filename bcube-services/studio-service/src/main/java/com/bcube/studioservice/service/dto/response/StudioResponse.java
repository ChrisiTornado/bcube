package com.bcube.studioservice.service.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    // Without this, Jackson's bean-property naming strips the "is" prefix from the isActive()
    // getter and serializes the field as "active" - matches the same fix already applied to
    // isAdmin elsewhere in this codebase (UserResponse/UserDto).
    @JsonProperty("isActive")
    private boolean isActive;
    private Instant createdAt;
    private Integer hourlyRateCents;
}
