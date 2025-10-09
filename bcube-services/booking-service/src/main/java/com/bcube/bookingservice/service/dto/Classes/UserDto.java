package com.bcube.bookingservice.service.dto.Classes;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserDto {
    private Long id;
    @JsonProperty("isAdmin")
    private boolean isAdmin;
    private String email;
    private String phone;
    private String firstName;
    private String lastName;
}
