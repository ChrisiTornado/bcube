package com.bcube.accessservice.exception;

public class BookingDoneException extends RuntimeException {
    public BookingDoneException(String message) {
        super(message);
    }
}
