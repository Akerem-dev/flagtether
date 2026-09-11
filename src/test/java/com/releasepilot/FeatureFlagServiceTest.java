package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FeatureFlagServiceTest {

  private FeatureFlagPostgresRepository repository;
  private AuditLogService auditLogService;
  private FeatureFlagService featureFlagService;

  @BeforeEach
  void setUp() {
    repository = mock(FeatureFlagPostgresRepository.class);
    auditLogService = mock(AuditLogService.class);
    featureFlagService = new FeatureFlagService(repository, auditLogService);
  }

  @Test
  void updateEnabledReturnsNotFoundWhenFlagDisappearsAfterRead() {
    FeatureFlag flag = new FeatureFlag("checkout-v2", "dev", false, 50);
    when(repository.findByNameAndEnvironment("checkout-v2", "dev")).thenReturn(flag);
    when(repository.updateEnabled("checkout-v2", "dev", true)).thenReturn(false);

    assertThatThrownBy(() -> featureFlagService.updateEnabled("checkout-v2", "dev", true))
        .isInstanceOf(FeatureFlagNotFoundException.class);

    verifyNoInteractions(auditLogService);
  }

  @Test
  void updateRolloutReturnsNotFoundWhenFlagDisappearsAfterRead() {
    FeatureFlag flag = new FeatureFlag("checkout-v2", "prod", true, 50);
    when(repository.findByNameAndEnvironment("checkout-v2", "prod")).thenReturn(flag);
    when(repository.updateRollout("checkout-v2", "prod", 75)).thenReturn(false);

    assertThatThrownBy(() -> featureFlagService.updateRollout("checkout-v2", "prod", 75))
        .isInstanceOf(FeatureFlagNotFoundException.class);

    verifyNoInteractions(auditLogService);
  }

  @Test
  void deleteReturnsNotFoundWhenFlagDisappearsAfterRead() {
    FeatureFlag flag = new FeatureFlag("checkout-v2", "staging", true, 50);
    when(repository.findByNameAndEnvironment("checkout-v2", "staging")).thenReturn(flag);
    when(repository.deleteByName("checkout-v2", "staging")).thenReturn(false);

    assertThatThrownBy(() -> featureFlagService.deleteFlag("checkout-v2", "staging"))
        .isInstanceOf(FeatureFlagNotFoundException.class);

    verifyNoInteractions(auditLogService);
  }
}
