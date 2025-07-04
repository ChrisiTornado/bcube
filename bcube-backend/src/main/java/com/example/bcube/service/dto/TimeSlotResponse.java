package com.example.bcube.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class TimeSlotResponse {
    Instant startTime;
    Instant endTime;
}
