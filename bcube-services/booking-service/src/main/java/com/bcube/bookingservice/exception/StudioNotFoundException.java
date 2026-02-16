package com.bcube.bookingservice.exception;

public class StudioNotFoundException extends RuntimeException {
    public StudioNotFoundException(String message) {
        super(message);
    }
}
