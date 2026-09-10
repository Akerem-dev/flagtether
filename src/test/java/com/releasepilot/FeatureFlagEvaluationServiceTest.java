package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FeatureFlagEvaluationServiceTest {

  private FeatureFlagService featureFlagService;
  private TargetingRuleService targetingRuleService;
  private FeatureFlagEvaluationService evaluationService;

  @BeforeEach
  void setUp() {
    featureFlagService = mock(FeatureFlagService.class);
    targetingRuleService = mock(TargetingRuleService.class);
    evaluationService =
        new FeatureFlagEvaluationService(featureFlagService, targetingRuleService);
  }

  @Test
  void disabledFlagWinsBeforeTargetingAndRollout() {
    FeatureFlag flag = new FeatureFlag("new_checkout", "prod", false, 100);
    when(featureFlagService.getFlagByName("new_checkout", "prod")).thenReturn(flag);

    FeatureFlagEvaluation result =
        evaluationService.evaluate("new_checkout", "prod", "user-123");

    assertThat(result.isEnabled()).isFalse();
    assertThat(result.getReason()).isEqualTo(EvaluationReason.FLAG_DISABLED);
    assertThat(result.getBucket()).isEqualTo(-1);
    verifyNoInteractions(targetingRuleService);
  }

  @Test
  void targetingRuleOverridesPercentageRollout() {
    FeatureFlag flag = new FeatureFlag("new_checkout", "prod", true, 0);
    TargetingRule rule =
        new TargetingRule(
            42L,
            "new_checkout",
            "prod",
            "country",
            TargetingOperator.EQUALS,
            "TR",
            true,
            10);

    when(featureFlagService.getFlagByName("new_checkout", "prod")).thenReturn(flag);
    when(targetingRuleService.getRules("new_checkout", "prod")).thenReturn(List.of(rule));

    FeatureFlagEvaluation result =
        evaluationService.evaluate("new_checkout", "prod", "user-123", "tr", null, null);

    assertThat(result.isEnabled()).isTrue();
    assertThat(result.getReason()).isEqualTo(EvaluationReason.TARGETING_MATCH);
    assertThat(result.getMatchedRuleId()).isEqualTo(42L);
    assertThat(result.getBucket()).isEqualTo(-1);
  }

  @Test
  void deterministicRolloutKeepsSameUserInSameBucket() {
    FeatureFlag flag = new FeatureFlag("new_checkout", "prod", true, 50);
    when(featureFlagService.getFlagByName("new_checkout", "prod")).thenReturn(flag);
    when(targetingRuleService.getRules("new_checkout", "prod")).thenReturn(List.of());

    FeatureFlagEvaluation first =
        evaluationService.evaluate("new_checkout", "prod", "stable-user");
    FeatureFlagEvaluation second =
        evaluationService.evaluate("new_checkout", "prod", "stable-user");

    assertThat(first.getBucket()).isBetween(0, 99);
    assertThat(second.getBucket()).isEqualTo(first.getBucket());
    assertThat(second.isEnabled()).isEqualTo(first.isEnabled());
    assertThat(second.getReason()).isEqualTo(first.getReason());
  }
}
