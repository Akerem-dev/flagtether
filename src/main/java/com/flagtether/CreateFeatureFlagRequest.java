package com.flagtether;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateFeatureFlagRequest {

  @NotBlank(message = "must not be blank")
  @Size(max = 100, message = "must be at most 100 characters")
  private String name;

  @NotNull(message = "is required")
  private Boolean enabled;

  @NotNull(message = "is required")
  @Min(value = 0, message = "must be between 0 and 100")
  @Max(value = 100, message = "must be between 0 and 100")
  private Integer rolloutPercentage;

  public CreateFeatureFlagRequest() {}

  public String getName() {
    return name;
  }

  public Boolean isEnabled() {
    return enabled;
  }

  public Integer getRolloutPercentage() {
    return rolloutPercentage;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setEnabled(Boolean enabled) {
    this.enabled = enabled;
  }

  public void setRolloutPercentage(Integer rolloutPercentage) {
    this.rolloutPercentage = rolloutPercentage;
  }
}
