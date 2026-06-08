package com.bcube.studioservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class StudioSlimResponse {
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
    private boolean isActive;
    private Instant createdAt;
}
