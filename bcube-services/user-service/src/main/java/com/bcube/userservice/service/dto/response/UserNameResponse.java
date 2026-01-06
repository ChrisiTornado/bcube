package com.bcube.userservice.service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserNameResponse {
    private Long id;
    private String firstName;
    private String lastName;
}
