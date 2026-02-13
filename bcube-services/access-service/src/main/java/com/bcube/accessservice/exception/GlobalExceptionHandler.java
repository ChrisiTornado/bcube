package com.bcube.accessservice.exception;

import com.bcube.accessservice.service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EncryptionException.class)
    public ResponseEntity<ApiResponse<EncryptionException>> bookingDoneException(EncryptionException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BookingDoneException.class)
    public ResponseEntity<ApiResponse<BookingDoneException>> bookingDoneException(BookingDoneException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessCodeDoesNotExistException.class)
    public ResponseEntity<ApiResponse<AccessCodeDoesNotExistException>> bookingDoneException(AccessCodeDoesNotExistException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<IllegalArgumentException>> bookingDoneException(IllegalArgumentException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }
}
