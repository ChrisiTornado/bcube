package com.example.bcube.service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BookStudioRequest {
    private int userID;
    private int studioID;
    private String date;
    private String startTime;
    private String endTime;
}
