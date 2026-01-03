package com.bcube.bookingservice.exception;

import com.bcube.bookingservice.service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BookingDoneException.class)
    public ResponseEntity<ApiResponse<BookingDoneException>> bookingDoneException(BookingDoneException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }
}
