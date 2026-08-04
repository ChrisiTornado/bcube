package com.bcube.userservice.exception;

public class UserHasOpenBookingsException extends RuntimeException {
    public UserHasOpenBookingsException(String message) {
        super(message);
    }
}
