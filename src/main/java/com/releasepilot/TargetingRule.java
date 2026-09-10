package com.releasepilot;

import java.util.Locale;

public class TargetingRule {

  private final long id;

  private final String flagName;

  private final String environment;

  private final String attribute;

  private final TargetingOperator operator;

  private final String comparisonValue;

  private final boolean serveEnabled;

  private final int priority;

  public TargetingRule(
      long id,
      String flagName,
      String environment,
      String attribute,
      TargetingOperator operator,
      String comparisonValue,
      boolean serveEnabled,
      int priority) {

    if (flagName == null || flagName.isBlank()) {

      throw new IllegalArgumentException("Rule flagName bos olamaz.");
    }

    if (environment == null || environment.isBlank()) {

      throw new IllegalArgumentException("Rule environment bos olamaz.");
    }

    if (attribute == null || attribute.isBlank()) {

      throw new IllegalArgumentException("Rule attribute bos olamaz.");
    }

    if (operator == null) {

      throw new IllegalArgumentException("Rule operator bos olamaz.");
    }

    if (comparisonValue == null || comparisonValue.isBlank()) {

      throw new IllegalArgumentException("Rule comparisonValue bos olamaz.");
    }

    if (priority < 0) {

      throw new IllegalArgumentException("Rule priority negatif olamaz.");
    }

    String normalizedAttribute = attribute.trim().toLowerCase(Locale.ROOT);

    if (!normalizedAttribute.equals("userkey")
        && !normalizedAttribute.equals("country")
        && !normalizedAttribute.equals("plan")
        && !normalizedAttribute.equals("email")) {

      throw new IllegalArgumentException("Attribute userKey, country, plan veya email olmalidir.");
    }

    this.id = id;

    this.flagName = flagName;

    this.environment = environment;

    this.attribute = normalizedAttribute;

    this.operator = operator;

    this.comparisonValue = comparisonValue;

    this.serveEnabled = serveEnabled;

    this.priority = priority;
  }

  public long getId() {

    return id;
  }

  public String getFlagName() {

    return flagName;
  }

  public String getEnvironment() {

    return environment;
  }

  public String getAttribute() {

    return attribute;
  }

  public TargetingOperator getOperator() {

    return operator;
  }

  public String getComparisonValue() {

    return comparisonValue;
  }

  public boolean isServeEnabled() {

    return serveEnabled;
  }

  public int getPriority() {

    return priority;
  }
}
