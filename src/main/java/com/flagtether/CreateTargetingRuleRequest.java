package com.flagtether;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateTargetingRuleRequest {

  @NotBlank(message = "must not be blank")
  @Size(max = 50, message = "must be at most 50 characters")
  private String attribute;

  @NotBlank(message = "must not be blank")
  @Size(max = 30, message = "must be at most 30 characters")
  private String operator;

  @NotBlank(message = "must not be blank")
  @Size(max = 255, message = "must be at most 255 characters")
  private String comparisonValue;

  @NotNull(message = "is required")
  private Boolean serveEnabled;

  @Min(value = 0, message = "must be greater than or equal to 0")
  private Integer priority;

  public CreateTargetingRuleRequest() {}

  public String getAttribute() {
    return attribute;
  }

  public void setAttribute(String attribute) {
    this.attribute = attribute;
  }

  public String getOperator() {
    return operator;
  }

  public void setOperator(String operator) {
    this.operator = operator;
  }

  public String getComparisonValue() {
    return comparisonValue;
  }

  public void setComparisonValue(String comparisonValue) {
    this.comparisonValue = comparisonValue;
  }

  public Boolean isServeEnabled() {
    return serveEnabled;
  }

  public void setServeEnabled(Boolean serveEnabled) {
    this.serveEnabled = serveEnabled;
  }

  public Integer getPriority() {
    return priority;
  }

  public void setPriority(Integer priority) {
    this.priority = priority;
  }
}
