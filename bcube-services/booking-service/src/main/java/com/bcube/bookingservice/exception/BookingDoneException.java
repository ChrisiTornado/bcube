package com.bcube.bookingservice.exception;

public class BookingDoneException extends RuntimeException {
  public BookingDoneException(String message) {
    super(message);
  }
}
