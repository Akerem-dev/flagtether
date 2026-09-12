package com.flagtether;

import jakarta.validation.constraints.NotNull;

public class UpdateFeatureFlagEnabledRequest {

  @NotNull(message = "is required")
  private Boolean enabled;

  public UpdateFeatureFlagEnabledRequest() {}

  public Boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(Boolean enabled) {
    this.enabled = enabled;
  }
}
