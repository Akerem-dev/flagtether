package com.releasepilot;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(FeatureFlagNotFoundException.class)
  public ResponseEntity<ApiError> handleNotFound(
      FeatureFlagNotFoundException exception, HttpServletRequest request) {

    return buildError(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(FeatureFlagAlreadyExistsException.class)
  public ResponseEntity<ApiError> handleAlreadyExists(
      FeatureFlagAlreadyExistsException exception, HttpServletRequest request) {

    return buildError(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(
      IllegalArgumentException exception, HttpServletRequest request) {

    return buildError(HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiError> handleInvalidJson(
      HttpMessageNotReadableException exception, HttpServletRequest request) {

    return buildError(
        HttpStatus.BAD_REQUEST, "Gecersiz JSON request body.", request.getRequestURI());
  }

  private ResponseEntity<ApiError> buildError(HttpStatus status, String message, String path) {

    ApiError apiError =
        new ApiError(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, path);

    return ResponseEntity.status(status).body(apiError);
  }

  @ExceptionHandler(TargetingRuleNotFoundException.class)
  public ResponseEntity<ApiError> handleTargetingRuleNotFound(
      TargetingRuleNotFoundException exception, HttpServletRequest request) {

    return buildError(HttpStatus.NOT_FOUND, exception.getMessage(), request.getRequestURI());
  }
}
