package com.bcube.userservice.exception;

import com.bcube.userservice.service.dto.response.ApiResponse;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return new ResponseEntity<>(new ApiResponse<>("Die Anmeldedaten sind nicht korrekt", null), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    /**
     * Without this, ResponseStatusException (thrown directly in AdminServiceImpl/UserServiceImpl
     * for e.g. NOT_FOUND/CONFLICT/FORBIDDEN) was silently caught by the generic Exception handler
     * below instead - since it's a RuntimeException and no more specific handler existed for it,
     * every intended status/message got flattened into a plain 500.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatusCode status = ex.getStatusCode();
        String message = ex.getReason() != null ? ex.getReason() : "Ein Fehler ist aufgetreten";
        return new ResponseEntity<>(new ApiResponse<>(message, null), status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String firstErrorMessage = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .map(this::toGermanValidationMessage)
                .orElse("Ungültige Eingabe – bitte überprüfe deine Angaben");
        return new ResponseEntity<>(new ApiResponse<>(firstErrorMessage, null), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOtherExceptions(Exception ex) {
        return new ResponseEntity<>(new ApiResponse<>("Ein unerwarteter Fehler ist aufgetreten", null), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(EmailAlreadyTakenException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailAlreadyTaken(EmailAlreadyTakenException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserHasOpenBookingsException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserHasOpenBookings(UserHasOpenBookingsException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleUserNotFound(UserNotFoundException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PasswordResetTokenExpiredException.class)
    public ResponseEntity<ApiResponse<Void>> handlePasswordResetTokenExpired(PasswordResetTokenExpiredException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.GONE);
    }

    @ExceptionHandler(InvalidResetTokenException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidResetToken(InvalidResetTokenException ex) {
        return new ResponseEntity<>(new ApiResponse<>(ex.getMessage(), null), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private String toGermanValidationMessage(String message) {
        if (message == null || message.isBlank()) {
            return "Ungültige Eingabe – bitte überprüfe deine Angaben";
        }

        return switch (message.trim()) {
            case "must be a well-formed email address" -> "Bitte gib eine gültige E-Mail-Adresse ein";
            case "must not be blank" -> "Dieses Feld ist erforderlich";
            case "must not be null" -> "Dieses Feld ist erforderlich";
            default -> message;
        };
    }
}
