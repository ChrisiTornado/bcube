package com.bcube.studioservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UpdateStudioRequest {
    private Long smartlockId;
    @NotBlank(message = "Straße ist erforderlich")
    @Size(max = 50, message = "Straße darf höchstens 50 Zeichen lang sein")
    private String street;
    private int plz;
    @NotBlank(message = "Stadt ist erforderlich")
    @Size(max = 50, message = "Stadt darf höchstens 50 Zeichen lang sein")
    private String city;
    @NotBlank(message = "Land ist erforderlich")
    @Size(max = 50, message = "Land darf höchstens 50 Zeichen lang sein")
    private String country;
    private byte[] image;
    @Size(min = 5, max = 5, message = "Es müssen genau 5 Cubebilder hochgeladen werden")
    private List<byte[]> images;
    @NotBlank(message = "Name ist erforderlich")
    @Size(max = 50, message = "Name darf höchstens 50 Zeichen lang sein")
    private String name;
    @NotBlank(message = "Beschreibung ist erforderlich")
    @Size(max = 1000, message = "Beschreibung darf höchstens 1000 Zeichen lang sein")
    private String description;
    private String location;
    @NotNull(message = "Stundensatz ist erforderlich")
    @Positive(message = "Stundensatz muss positiv sein")
    private Integer hourlyRateCents;
}
