package com.bcube.accessservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class AccessRequest {
    public Long bookingId;
    public String validFrom;
    public String validUntil;
}