package com.bcube.bookingservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccessRequest
{
    public Long bookingId;
    public Long smartlockId;
    public String validFrom;
    public String validUntil;
    public String userEmail;
}
