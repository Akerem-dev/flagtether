package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class TargetingRuleServiceTest {

  private TargetingRuleRepository repository;
  private FeatureFlagService featureFlagService;
  private AuditLogService auditLogService;
  private TargetingRuleService targetingRuleService;

  @BeforeEach
  void setUp() {
    repository = mock(TargetingRuleRepository.class);
    featureFlagService = mock(FeatureFlagService.class);
    auditLogService = mock(AuditLogService.class);
    targetingRuleService =
        new TargetingRuleService(repository, featureFlagService, auditLogService);
  }

  @Test
  void normalizesSupportedAttributeBeforePersisting() {
    FeatureFlag flag = new FeatureFlag("checkout-v2", "prod", true, 50);
    TargetingRule created =
        new TargetingRule(
            7L,
            "checkout-v2",
            "prod",
            "userkey",
            TargetingOperator.EQUALS,
            "User123",
            true,
            10);

    when(featureFlagService.getFlagByName("checkout-v2", "prod")).thenReturn(flag);
    when(repository.insert(any(TargetingRule.class))).thenReturn(created);

    targetingRuleService.create(
        "checkout-v2", "prod", " UserKey ", "equals", "User123", true, 10);

    ArgumentCaptor<TargetingRule> captor = ArgumentCaptor.forClass(TargetingRule.class);
    verify(repository).insert(captor.capture());

    assertThat(captor.getValue().getAttribute()).isEqualTo("userkey");
  }

  @Test
  void rejectsAttributeThatEvaluationEngineCannotRead() {
    FeatureFlag flag = new FeatureFlag("checkout-v2", "prod", true, 50);
    when(featureFlagService.getFlagByName("checkout-v2", "prod")).thenReturn(flag);

    assertThatThrownBy(
            () ->
                targetingRuleService.create(
                    "checkout-v2", "prod", "device", "EQUALS", "mobile", true, 10))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Attribute");

    verifyNoInteractions(repository, auditLogService);
  }
}
