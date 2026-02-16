package com.bcube.bookingservice.exception;

public class AccessCodeNotReceivedException extends RuntimeException {
    public AccessCodeNotReceivedException(String message) {
        super(message);
    }
}
