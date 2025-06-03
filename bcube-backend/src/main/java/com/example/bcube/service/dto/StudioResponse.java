package com.example.bcube.service.dto;

import com.example.bcube.persistence.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
public class StudioResponse {
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
    private List<UserResponse> users;
}
