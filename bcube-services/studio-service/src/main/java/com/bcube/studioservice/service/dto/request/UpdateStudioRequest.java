package com.bcube.studioservice.service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UpdateStudioRequest {
    private Long smartlockId;
    private String street;
    private int plz;
    private String city;
    private String country;
    private byte[] image;
    private List<byte[]> images;
    private int id;
    private String name;
    private String description;
    private String location;
    @NotNull(message = "Stundensatz ist erforderlich")
    @Positive(message = "Stundensatz muss positiv sein")
    private Integer hourlyRateCents;
}
