package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class ReleasePilotIntegrationTest {

  @Container
  static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>("postgres:18-alpine")
          .withDatabaseName("releasepilot")
          .withUsername("releasepilot_app")
          .withPassword("test-password");

  @DynamicPropertySource
  static void databaseProperties(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
    registry.add("spring.flyway.url", POSTGRES::getJdbcUrl);
    registry.add("spring.flyway.user", POSTGRES::getUsername);
    registry.add("spring.flyway.password", POSTGRES::getPassword);
  }

  @Autowired private FeatureFlagService featureFlagService;

  @Autowired private FeatureFlagEvaluationService evaluationService;

  @Autowired private AuditLogService auditLogService;

  @Test
  void createsAndEvaluatesFlagAgainstRealPostgres() {
    FeatureFlag created = featureFlagService.createFlag("integration_checkout", "prod", true, 100);

    assertThat(created.getName()).isEqualTo("integration_checkout");
    assertThat(created.getEnvironment()).isEqualTo("prod");

    FeatureFlagEvaluation evaluation =
        evaluationService.evaluate("integration_checkout", "prod", "integration-user");

    assertThat(evaluation.isEnabled()).isTrue();
    assertThat(evaluation.getReason()).isEqualTo(EvaluationReason.ROLLOUT_FULL);

    assertThat(auditLogService.getRecent(10))
        .anySatisfy(
            entry -> {
              assertThat(entry.getAction()).isEqualTo(AuditAction.FLAG_CREATED);
              assertThat(entry.getFlagName()).isEqualTo("integration_checkout");
              assertThat(entry.getEnvironment()).isEqualTo("prod");
            });
  }
}
