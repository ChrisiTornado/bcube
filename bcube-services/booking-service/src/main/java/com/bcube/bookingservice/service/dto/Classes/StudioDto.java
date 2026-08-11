package com.bcube.bookingservice.service.dto.Classes;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class StudioDto {
    private int id;
    private String name;
    private String description;
    private String street;
    private int plz;
    private String city;
    private String country;
    private Double latitude;
    private Double longitude;
    private String imageBase64;
    // Without this, Jackson's bean-property naming strips the "is" prefix, so it looks for
    // an "active" key while studio-service (once fixed the same way) now sends "isActive" -
    // matches the same fix already applied to isAdmin elsewhere in this codebase.
    @JsonProperty("isActive")
    private boolean isActive;
    private Instant createdAt;
    private Integer hourlyRateCents;
}
