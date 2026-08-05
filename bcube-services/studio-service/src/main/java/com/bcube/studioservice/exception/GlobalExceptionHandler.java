package com.bcube.studioservice.exception;

import com.bcube.studioservice.service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GeocodingException.class)
    public ResponseEntity<ApiResponse<Void>> handleStudioNotFound(GeocodingException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    /** getStudioById/deleteStudio/updateStudio all throw this directly - Spring already applies
     * the right status code even without this handler, but the response body was Spring Boot's
     * default error shape instead of this API's normal ApiResponse envelope. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> responseStatusException(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String message = ex.getReason() != null ? ex.getReason() : "Ein Fehler ist aufgetreten";
        return new ResponseEntity<>(new ApiResponse<>(message, null), status);
    }

    /** MethodArgumentNotValidException (@Valid @RequestBody in AdminStudioController) extends
     * BindException - without this, a validation failure fell through to the default error body
     * instead of a proper 400 naming the actual problem. */
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
