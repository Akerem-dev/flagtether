package com.releasepilot;

public class CreateFeatureFlagRequest {

  private String name;
  private boolean enabled;
  private int rolloutPercentage;

  public CreateFeatureFlagRequest() {}

  public String getName() {
    return name;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public int getRolloutPercentage() {
    return rolloutPercentage;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public void setRolloutPercentage(int rolloutPercentage) {
    this.rolloutPercentage = rolloutPercentage;
  }
}
