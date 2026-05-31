package com.bcube.accessservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class CheckInResponse {
    private Long bookingId;
    private Long smartlockId;
    private Instant validFrom;
    private Instant validUntil;
}
