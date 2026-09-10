package com.releasepilot;

import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class TargetingRuleService {

  private final TargetingRuleRepository repository;

  private final FeatureFlagService featureFlagService;

  private final AuditLogService auditLogService;

  public TargetingRuleService(
      TargetingRuleRepository repository,
      FeatureFlagService featureFlagService,
      AuditLogService auditLogService) {

    this.repository = repository;

    this.featureFlagService = featureFlagService;

    this.auditLogService = auditLogService;
  }

  public TargetingRule create(
      String flagName,
      String environment,
      String attribute,
      String operator,
      String comparisonValue,
      boolean serveEnabled,
      Integer priority) {

    FeatureFlag flag = featureFlagService.getFlagByName(flagName, environment);

    TargetingOperator parsedOperator = parseOperator(operator);

    int actualPriority = priority == null ? 100 : priority;

    TargetingRule rule =
        new TargetingRule(
            0,
            flag.getName(),
            flag.getEnvironment(),
            attribute,
            parsedOperator,
            comparisonValue,
            serveEnabled,
            actualPriority);

    TargetingRule createdRule = repository.insert(rule);

    auditLogService.record(
        AuditAction.RULE_CREATED,
        flag.getName(),
        flag.getEnvironment(),
        "ruleId="
            + createdRule.getId()
            + ", attribute="
            + createdRule.getAttribute()
            + ", operator="
            + createdRule.getOperator()
            + ", value="
            + createdRule.getComparisonValue()
            + ", serveEnabled="
            + createdRule.isServeEnabled()
            + ", priority="
            + createdRule.getPriority());

    return createdRule;
  }

  public List<TargetingRule> getRules(String flagName, String environment) {

    FeatureFlag flag = featureFlagService.getFlagByName(flagName, environment);

    return repository.findAll(flag.getName(), flag.getEnvironment());
  }

  public void delete(long ruleId, String flagName, String environment) {

    FeatureFlag flag = featureFlagService.getFlagByName(flagName, environment);

    boolean deleted = repository.delete(ruleId, flag.getName(), flag.getEnvironment());

    if (!deleted) {

      throw new TargetingRuleNotFoundException(ruleId);
    }

    auditLogService.record(
        AuditAction.RULE_DELETED, flag.getName(), flag.getEnvironment(), "ruleId=" + ruleId);
  }

  private TargetingOperator parseOperator(String operator) {

    if (operator == null || operator.isBlank()) {

      throw new IllegalArgumentException("Targeting operator bos olamaz.");
    }

    try {

      return TargetingOperator.valueOf(operator.trim().toUpperCase(Locale.ROOT));

    } catch (IllegalArgumentException exception) {

      throw new IllegalArgumentException(
          "Operator EQUALS, NOT_EQUALS, CONTAINS, STARTS_WITH veya ENDS_WITH olmalidir.");
    }
  }
}
