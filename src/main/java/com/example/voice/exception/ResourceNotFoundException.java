package com.example.voice.exception;

/** Thrown when a requested resource (User, Analysis) is not found in DB. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resourceType, Object id) {
        super(resourceType + " not found with id: " + id);
    }
}
