package com.example.bcube.service.dto;

import com.example.bcube.persistence.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
public class CreateStudioRequest {
    private String street;
    private int plz;
    private String city;
    private String country;
    private byte[] image;
    private String name;
    private String description;
    private String location;
}
