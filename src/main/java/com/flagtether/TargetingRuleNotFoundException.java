package com.flagtether;

public class TargetingRuleNotFoundException extends RuntimeException {

  public TargetingRuleNotFoundException(long ruleId) {

    super("Targeting rule bulunamadi: " + ruleId);
  }
}
