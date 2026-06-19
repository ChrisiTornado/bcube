package com.bcube.bookingservice.exception;

import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAll(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return new ResponseEntity<>(new ApiResponse<>("Ein unerwarteter Fehler ist aufgetreten: " + ex.getMessage(), null), HttpStatus.INTERNAL_SERVER_ERROR);
    }
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

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> illegalArgumentException(IllegalArgumentException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }
}
