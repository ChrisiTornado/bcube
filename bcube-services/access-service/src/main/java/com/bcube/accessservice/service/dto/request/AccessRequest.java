package com.bcube.accessservice.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class AccessRequest {
    public Long studioId;
    public Instant fromTime;
    public Instant untilTime;
}
