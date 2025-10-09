package com.bcube.studioservice.exception;

import com.bcube.studioservice.service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(GeocodingException.class)
    public ResponseEntity<ApiResponse<Void>> handleStudioNotFound(GeocodingException ex) {
        return new ResponseEntity<>(
                new ApiResponse<>(ex.getMessage(), null),
                HttpStatus.NOT_FOUND
        );
    }
}
