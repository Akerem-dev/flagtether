package com.flagtether;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateFeatureFlagRolloutRequest {

  @NotNull(message = "is required")
  @Min(value = 0, message = "must be between 0 and 100")
  @Max(value = 100, message = "must be between 0 and 100")
  private Integer rolloutPercentage;

  public UpdateFeatureFlagRolloutRequest() {}

  public Integer getRolloutPercentage() {
    return rolloutPercentage;
  }

  public void setRolloutPercentage(Integer rolloutPercentage) {
    this.rolloutPercentage = rolloutPercentage;
  }
}
