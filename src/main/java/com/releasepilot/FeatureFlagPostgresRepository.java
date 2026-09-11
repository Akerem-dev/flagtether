package com.releasepilot;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FeatureFlagPostgresRepository {

  private final JdbcTemplate jdbcTemplate;

  public FeatureFlagPostgresRepository(DataSource dataSource) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }

  public List<FeatureFlag> findAllByEnvironment(String environment) {
    String sql =
        "SELECT name, environment, enabled, rollout_percentage "
            + "FROM feature_flags "
            + "WHERE environment = ? "
            + "ORDER BY id";

    return jdbcTemplate.query(sql, this::mapRowToFeatureFlag, environment);
  }

  public FeatureFlag findByNameAndEnvironment(String name, String environment) {
    String sql =
        "SELECT name, environment, enabled, rollout_percentage "
            + "FROM feature_flags "
            + "WHERE name = ? AND environment = ?";

    List<FeatureFlag> flags = jdbcTemplate.query(sql, this::mapRowToFeatureFlag, name, environment);
    return flags.isEmpty() ? null : flags.getFirst();
  }

  public void insert(FeatureFlag flag) {
    String sql =
        "INSERT INTO feature_flags "
            + "(name, environment, enabled, rollout_percentage) "
            + "VALUES (?, ?, ?, ?)";

    int affectedRows =
        jdbcTemplate.update(
            sql,
            flag.getName(),
            flag.getEnvironment(),
            flag.isEnabled(),
            flag.getRolloutPercentage());

    if (affectedRows != 1) {
      throw new IllegalStateException("Feature flag eklenemedi.");
    }
  }

  public boolean updateEnabled(String name, String environment, boolean enabled) {
    String sql =
        "UPDATE feature_flags " + "SET enabled = ? " + "WHERE name = ? AND environment = ?";

    return jdbcTemplate.update(sql, enabled, name, environment) == 1;
  }

  public boolean updateRollout(String name, String environment, int rolloutPercentage) {
    String sql =
        "UPDATE feature_flags "
            + "SET rollout_percentage = ? "
            + "WHERE name = ? AND environment = ?";

    return jdbcTemplate.update(sql, rolloutPercentage, name, environment) == 1;
  }

  public boolean deleteByName(String name, String environment) {
    String sql = "DELETE FROM feature_flags WHERE name = ? AND environment = ?";

    return jdbcTemplate.update(sql, name, environment) == 1;
  }

  private FeatureFlag mapRowToFeatureFlag(ResultSet resultSet, int rowNumber) throws SQLException {
    return new FeatureFlag(
        resultSet.getString("name"),
        resultSet.getString("environment"),
        resultSet.getBoolean("enabled"),
        resultSet.getInt("rollout_percentage"));
  }
}
