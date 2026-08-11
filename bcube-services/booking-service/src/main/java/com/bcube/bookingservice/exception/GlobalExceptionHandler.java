package com.bcube.bookingservice.exception;

import com.bcube.bookingservice.service.dto.response.AccessCodeResponse;
import com.bcube.bookingservice.service.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /** Covers RequestingUser's ownership checks (401/403) and the internal-key check in
     * BookingController - without this, both fell through to Spring Boot's default error body
     * instead of this API's normal ApiResponse envelope. */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> responseStatusException(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String message = ex.getReason() != null ? ex.getReason() : "Ein Fehler ist aufgetreten";
        return new ResponseEntity<>(new ApiResponse<>(message, null), status);
    }

    /** MethodArgumentNotValidException (@Valid @RequestBody) extends BindException, so this also
     * covers the @Valid query-param binding on AdminBookingQueryRequest/UserBookingQueryRequest -
     * without it, a validation failure (e.g. an oversized page size) fell through to the generic
     * 500 handler below instead of a proper 400 naming the actual problem. */
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
        log.error("Unbehandelte Exception", ex);
        return new ResponseEntity<>(new ApiResponse<>("Ein unerwarteter Fehler ist aufgetreten", null), HttpStatus.INTERNAL_SERVER_ERROR);
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

    @ExceptionHandler(BookingNotFoundException.class)
    public ResponseEntity<ApiResponse<BookingNotFoundException>> bookingNotFoundException(BookingNotFoundException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> illegalArgumentException(IllegalArgumentException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IpBannedException.class)
    public ResponseEntity<ApiResponse<Void>> ipBannedException(IpBannedException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.FORBIDDEN);
    }
}
