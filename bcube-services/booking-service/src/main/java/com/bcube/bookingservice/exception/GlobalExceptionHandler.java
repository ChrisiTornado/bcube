package com.bcube.bookingservice.exception;

import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
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

    @ExceptionHandler(AccessCodeNotReceivedException.class)
    public ResponseEntity<ApiResponse<AccessCodeResponse>> accessCodeNotReceivedException(AccessCodeNotReceivedException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<UserNotFoundException>> userNotFoundException(UserNotFoundException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(StudioNotFoundException.class)
    public ResponseEntity<ApiResponse<StudioNotFoundException>> studioNotFoundException(StudioNotFoundException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }
}
