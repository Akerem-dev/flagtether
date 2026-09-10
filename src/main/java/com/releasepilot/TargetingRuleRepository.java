package com.releasepilot;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

@Repository
public class TargetingRuleRepository {

  private final DataSource dataSource;

  public TargetingRuleRepository(DataSource dataSource) {

    this.dataSource = dataSource;
  }

  private Connection openConnection() throws SQLException {

    return dataSource.getConnection();
  }

  public TargetingRule insert(TargetingRule rule) {

    String sql =
        "INSERT INTO targeting_rules "
            + "(flag_name, environment, attribute, operator, "
            + "comparison_value, serve_enabled, priority) "
            + "VALUES (?, ?, ?, ?, ?, ?, ?) "
            + "RETURNING id";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, rule.getFlagName());

      statement.setString(2, rule.getEnvironment());

      statement.setString(3, rule.getAttribute());

      statement.setString(4, rule.getOperator().name());

      statement.setString(5, rule.getComparisonValue());

      statement.setBoolean(6, rule.isServeEnabled());

      statement.setInt(7, rule.getPriority());

      try (ResultSet resultSet = statement.executeQuery()) {

        if (!resultSet.next()) {

          throw new RuntimeException("Targeting rule olusturulamadi.");
        }

        long id = resultSet.getLong("id");

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

    } catch (SQLException exception) {

      throw new RuntimeException("Targeting rule database'e eklenemedi.", exception);
    }
  }

  public List<TargetingRule> findAll(String flagName, String environment) {

    String sql =
        "SELECT id, flag_name, environment, attribute, "
            + "operator, comparison_value, serve_enabled, priority "
            + "FROM targeting_rules "
            + "WHERE flag_name = ? AND environment = ? "
            + "ORDER BY priority ASC, id ASC";

    List<TargetingRule> rules = new ArrayList<>();

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, flagName);

      statement.setString(2, environment);

      try (ResultSet resultSet = statement.executeQuery()) {

        while (resultSet.next()) {

          rules.add(mapRow(resultSet));
        }
      }

      return rules;

    } catch (SQLException exception) {

      throw new RuntimeException("Targeting rule'lar database'den okunamadi.", exception);
    }
  }

  public boolean delete(long ruleId, String flagName, String environment) {

    String sql =
        "DELETE FROM targeting_rules "
            + "WHERE id = ? "
            + "AND flag_name = ? "
            + "AND environment = ?";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setLong(1, ruleId);

      statement.setString(2, flagName);

      statement.setString(3, environment);

      int affectedRows = statement.executeUpdate();

      return affectedRows == 1;

    } catch (SQLException exception) {

      throw new RuntimeException("Targeting rule silinemedi.", exception);
    }
  }

  private TargetingRule mapRow(ResultSet resultSet) throws SQLException {

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
