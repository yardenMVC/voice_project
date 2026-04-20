package com.example.voice.exception;

/** Thrown when an uploaded audio file fails validation (wrong type, too large, empty). */
public class AudioValidationException extends RuntimeException {
    public AudioValidationException(String message) {
        super(message);
    }
}
