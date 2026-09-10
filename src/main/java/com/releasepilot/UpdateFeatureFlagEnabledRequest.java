package com.releasepilot;

public class UpdateFeatureFlagEnabledRequest {

  private boolean enabled;

  public UpdateFeatureFlagEnabledRequest() {}

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {

    this.enabled = enabled;
  }
}
