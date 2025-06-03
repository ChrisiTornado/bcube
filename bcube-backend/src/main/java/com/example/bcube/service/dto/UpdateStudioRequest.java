package com.example.bcube.service.dto;

import com.example.bcube.persistence.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
public class UpdateStudioRequest {
    private String street;
    private int plz;
    private String city;
    private String country;
    private byte[] image;
    private List<User> users;
    private int id;
    private String name;
    private String description;
    private String location;
}
