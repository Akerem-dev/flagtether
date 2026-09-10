package com.releasepilot;

import java.util.Locale;

public class FeatureFlag {

  private String name;

  private String environment;

  private boolean enabled;

  private int rolloutPercentage;

  public FeatureFlag(String name, boolean enabled, int rolloutPercentage) {

    this(name, "dev", enabled, rolloutPercentage);
  }

  public FeatureFlag(String name, String environment, boolean enabled, int rolloutPercentage) {

    validateName(name);

    validateRolloutPercentage(rolloutPercentage);

    this.name = name;

    this.environment = normalizeEnvironment(environment);

    this.enabled = enabled;

    this.rolloutPercentage = rolloutPercentage;
  }

  public String getName() {

    return name;
  }

  public String getEnvironment() {

    return environment;
  }

  public boolean isEnabled() {

    return enabled;
  }

  public int getRolloutPercentage() {

    return rolloutPercentage;
  }

  public void enable() {

    enabled = true;
  }

  public void disable() {

    enabled = false;
  }

  public void updateRolloutPercentage(int newRolloutPercentage) {

    validateRolloutPercentage(newRolloutPercentage);

    rolloutPercentage = newRolloutPercentage;
  }

  private void validateName(String name) {

    if (name == null || name.isBlank()) {

      throw new IllegalArgumentException("Feature flag adi bos olamaz.");
    }
  }

  private void validateRolloutPercentage(int percentage) {

    if (percentage < 0 || percentage > 100) {

      throw new IllegalArgumentException("Rollout yuzdesi 0 ile 100 arasinda olmalidir.");
    }
  }

  private String normalizeEnvironment(String environment) {

    if (environment == null || environment.isBlank()) {

      throw new IllegalArgumentException("Environment bos olamaz.");
    }

    String normalized = environment.trim().toLowerCase(Locale.ROOT);

    if (!normalized.equals("dev") && !normalized.equals("staging") && !normalized.equals("prod")) {

      throw new IllegalArgumentException("Environment dev, staging veya prod olmalidir.");
    }

    return normalized;
  }
}
