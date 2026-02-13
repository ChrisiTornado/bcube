package com.bcube.accessservice.exception;

public class AccessCodeDoesNotExistException extends RuntimeException {
    public AccessCodeDoesNotExistException(String message) {
        super(message);
    }
}
