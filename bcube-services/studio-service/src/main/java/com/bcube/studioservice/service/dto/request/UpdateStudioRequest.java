package com.bcube.studioservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UpdateStudioRequest {
    private String street;
    private int plz;
    private String city;
    private String country;
    private byte[] image;
    private int id;
    private String name;
    private String description;
    private String location;
}