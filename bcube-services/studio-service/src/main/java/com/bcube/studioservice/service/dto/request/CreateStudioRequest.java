package com.bcube.studioservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

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