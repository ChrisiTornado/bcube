package com.bcube.studioservice.service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CreateStudioRequest {
    @NotNull(message = "Smartlock-ID ist erforderlich")
    private Long smartlockId;
    private String street;
    private int plz;
    private String city;
    private String country;
    private byte[] image;
    private List<byte[]> images;
    private String name;
    private String description;
    private String location;
}
