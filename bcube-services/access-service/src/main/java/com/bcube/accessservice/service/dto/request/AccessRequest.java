package com.bcube.accessservice.service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class AccessRequest {
    @NotNull(message = "Buchungs-ID ist erforderlich")
    public Long bookingId;
    @NotNull(message = "Smartlock-ID ist erforderlich")
    public Long smartlockId;
    @NotBlank(message = "Gültig-ab-Zeitpunkt ist erforderlich")
    public String validFrom;
    @NotBlank(message = "Gültig-bis-Zeitpunkt ist erforderlich")
    public String validUntil;
}