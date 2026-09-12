package com.flagtether;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TargetingRuleRepository {

  private final JdbcTemplate jdbcTemplate;

  public TargetingRuleRepository(DataSource dataSource) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }

  public TargetingRule insert(TargetingRule rule) {
    String sql =
        "INSERT INTO targeting_rules "
            + "(flag_name, environment, attribute, operator, "
            + "comparison_value, serve_enabled, priority) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?) "
            + "RETURNING id";

    Long id =
        jdbcTemplate.queryForObject(
            sql,
            Long.class,
            rule.getFlagName(),
            rule.getEnvironment(),
            rule.getAttribute(),
            rule.getOperator().name(),
            rule.getComparisonValue(),
            rule.isServeEnabled(),
            rule.getPriority());

    if (id == null) {
      throw new IllegalStateException("Targeting rule olusturulamadi.");
    }

    return new TargetingRule(
        id,
        rule.getFlagName(),
        rule.getEnvironment(),
        rule.getAttribute(),
        rule.getOperator(),
        rule.getComparisonValue(),
        rule.isServeEnabled(),
        rule.getPriority());
  }

  public List<TargetingRule> findAll(String flagName, String environment) {
    String sql =
        "SELECT id, flag_name, environment, attribute, "
            + "operator, comparison_value, serve_enabled, priority "
            + "FROM targeting_rules "
            + "WHERE flag_name = ? AND environment = ? "
            + "ORDER BY priority ASC, id ASC";

    return jdbcTemplate.query(sql, this::mapRow, flagName, environment);
  }

  public boolean delete(long ruleId, String flagName, String environment) {
    String sql =
        "DELETE FROM targeting_rules "
            + "WHERE id = ? "
            + "AND flag_name = ? "
            + "AND environment = ?";

    return jdbcTemplate.update(sql, ruleId, flagName, environment) == 1;
  }

  private TargetingRule mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
    return new TargetingRule(
        resultSet.getLong("id"),
        resultSet.getString("flag_name"),
        resultSet.getString("environment"),
        resultSet.getString("attribute"),
        TargetingOperator.valueOf(resultSet.getString("operator")),
        resultSet.getString("comparison_value"),
        resultSet.getBoolean("serve_enabled"),
        resultSet.getInt("priority"));
  }
}
