package com.bcube.accessservice.exception;

import com.bcube.accessservice.service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EncryptionException.class)
    public ResponseEntity<ApiResponse<Void>> encryptionException(EncryptionException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BookingDoneException.class)
    public ResponseEntity<ApiResponse<Void>> bookingDoneException(BookingDoneException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AccessCodeDoesNotExistException.class)
    public ResponseEntity<ApiResponse<Void>> accessCodeDoesNotExistException(AccessCodeDoesNotExistException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> illegalArgumentException(IllegalArgumentException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    /** Covers the X-Internal-Key check in AccessController (403) - without this it fell through
     * to Spring Boot's default error body instead of this API's normal ApiResponse envelope. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> responseStatusException(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String message = ex.getReason() != null ? ex.getReason() : "Ein Fehler ist aufgetreten";
        return new ResponseEntity<>(new ApiResponse<>(message, null), status);
    }

    /** MethodArgumentNotValidException (@Valid @RequestBody) extends BindException. */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> bindException(BindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("Ungültige Eingabe - bitte überprüfe deine Angaben");
        return new ResponseEntity<>(new ApiResponse<>(message, null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> otherExceptions(Exception ex) {
        return new ResponseEntity<>(new ApiResponse<>("Ein unerwarteter Fehler ist aufgetreten", null), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
