package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
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

  @Autowired private JdbcTemplate jdbcTemplate;

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

  @Test
  void rollsBackFlagCreationWhenAuditInsertFails() {
    String flagName = "rollback_checkout";

    jdbcTemplate.update(
        "DELETE FROM feature_flags WHERE name = ? AND environment = ?", flagName, "prod");
    jdbcTemplate.execute(
        """
        CREATE OR REPLACE FUNCTION fail_transaction_test_audit_insert()
        RETURNS trigger AS $$
        BEGIN
          IF NEW.flag_name = 'rollback_checkout' THEN
            RAISE EXCEPTION 'forced audit failure for transaction test';
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
        """);
    jdbcTemplate.execute(
        """
        CREATE TRIGGER fail_transaction_test_audit_insert
        BEFORE INSERT ON audit_log
        FOR EACH ROW
        EXECUTE FUNCTION fail_transaction_test_audit_insert()
        """);

    try {
      assertThatThrownBy(() -> featureFlagService.createFlag(flagName, "prod", true, 50))
          .isInstanceOf(RuntimeException.class);
    } finally {
      jdbcTemplate.execute(
          "DROP TRIGGER IF EXISTS fail_transaction_test_audit_insert ON audit_log");
      jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_transaction_test_audit_insert()");
    }

    Integer flagCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM feature_flags WHERE name = ? AND environment = ?",
            Integer.class,
            flagName,
            "prod");
    Integer auditCount =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE flag_name = ? AND environment = ?",
            Integer.class,
            flagName,
            "prod");

    assertThat(flagCount).isZero();
    assertThat(auditCount).isZero();
  }

  @Test
  void databaseEnforcesApplicationDomainConstraints() {
    String flagName = "constraint_checkout";

    jdbcTemplate.update(
        "DELETE FROM feature_flags WHERE name = ? AND environment = ?", flagName, "prod");
    featureFlagService.createFlag(flagName, "prod", true, 50);

    try {
      assertThatThrownBy(
              () ->
                  jdbcTemplate.update(
                      """
                      INSERT INTO targeting_rules
                          (flag_name, environment, attribute, operator,
                           comparison_value, serve_enabled, priority)
                      VALUES (?, 'prod', 'device', 'EQUALS', 'mobile', TRUE, 10)
                      """,
                      flagName))
          .isInstanceOf(DataIntegrityViolationException.class);

      assertThatThrownBy(
              () ->
                  jdbcTemplate.update(
                      """
                      INSERT INTO targeting_rules
                          (flag_name, environment, attribute, operator,
                           comparison_value, serve_enabled, priority)
                      VALUES (?, 'prod', 'country', 'EQUALS', '   ', TRUE, 10)
                      """,
                      flagName))
          .isInstanceOf(DataIntegrityViolationException.class);

      assertThatThrownBy(
              () ->
                  jdbcTemplate.update(
                      """
                      INSERT INTO feature_flags
                          (name, environment, enabled, rollout_percentage)
                      VALUES ('   ', 'staging', TRUE, 50)
                      """))
          .isInstanceOf(DataIntegrityViolationException.class);
    } finally {
      jdbcTemplate.update(
          "DELETE FROM feature_flags WHERE name = ? AND environment = ?", flagName, "prod");
      jdbcTemplate.update(
          "DELETE FROM feature_flags WHERE btrim(name) = '' AND environment = 'staging'");
    }
  }
}
