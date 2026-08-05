package com.bcube.bookingservice.exception;

public class IpBannedException extends RuntimeException {
    public IpBannedException(String message) {
        super(message);
    }
}
