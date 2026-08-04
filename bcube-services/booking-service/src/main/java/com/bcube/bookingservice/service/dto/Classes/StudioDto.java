package com.bcube.bookingservice.service.dto.Classes;

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
    private boolean isActive;
    private Instant createdAt;
    private Integer hourlyRateCents;
}
