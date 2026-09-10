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
public class FeatureFlagPostgresRepository {

  private final DataSource dataSource;

  public FeatureFlagPostgresRepository(DataSource dataSource) {

    this.dataSource = dataSource;
  }

  private Connection openConnection() throws SQLException {

    return dataSource.getConnection();
  }

  public List<FeatureFlag> findAll() {

    return findAllByEnvironment("dev");
  }

  public List<FeatureFlag> findAllByEnvironment(String environment) {

    String sql =
        "SELECT name, environment, enabled, rollout_percentage "
            + "FROM feature_flags "
            + "WHERE environment = ? "
            + "ORDER BY id";

    List<FeatureFlag> flags = new ArrayList<>();

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, environment);

      try (ResultSet resultSet = statement.executeQuery()) {

        while (resultSet.next()) {

          flags.add(mapRowToFeatureFlag(resultSet));
        }
      }

      return flags;

    } catch (SQLException exception) {

      throw new RuntimeException("Feature flag'ler database'den okunamadi.", exception);
    }
  }

  public FeatureFlag findByName(String name) {

    return findByNameAndEnvironment(name, "dev");
  }

  public FeatureFlag findByNameAndEnvironment(String name, String environment) {

    String sql =
        "SELECT name, environment, enabled, rollout_percentage "
            + "FROM feature_flags "
            + "WHERE name = ? AND environment = ?";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, name);

      statement.setString(2, environment);

      try (ResultSet resultSet = statement.executeQuery()) {

        if (resultSet.next()) {

          return mapRowToFeatureFlag(resultSet);
        }

        return null;
      }

    } catch (SQLException exception) {

      throw new RuntimeException("Feature flag database'den bulunamadi.", exception);
    }
  }

  public void insert(FeatureFlag flag) {

    String sql =
        "INSERT INTO feature_flags "
            + "(name, environment, enabled, rollout_percentage) "
            + "VALUES (?, ?, ?, ?)";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, flag.getName());

      statement.setString(2, flag.getEnvironment());

      statement.setBoolean(3, flag.isEnabled());

      statement.setInt(4, flag.getRolloutPercentage());

      int affectedRows = statement.executeUpdate();

      if (affectedRows != 1) {

        throw new RuntimeException("Feature flag eklenemedi.");
      }

    } catch (SQLException exception) {

      throw new RuntimeException("Feature flag database'e eklenemedi.", exception);
    }
  }

  public void updateEnabled(String name, boolean enabled) {

    updateEnabled(name, "dev", enabled);
  }

  public void updateEnabled(String name, String environment, boolean enabled) {

    String sql =
        "UPDATE feature_flags " + "SET enabled = ? " + "WHERE name = ? AND environment = ?";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setBoolean(1, enabled);

      statement.setString(2, name);

      statement.setString(3, environment);

      int affectedRows = statement.executeUpdate();

      if (affectedRows != 1) {

        throw new RuntimeException("Feature flag durumu guncellenemedi: " + name);
      }

    } catch (SQLException exception) {

      throw new RuntimeException("Feature flag durumu database'de guncellenemedi.", exception);
    }
  }

  public void updateRollout(String name, int rolloutPercentage) {

    updateRollout(name, "dev", rolloutPercentage);
  }

  public void updateRollout(String name, String environment, int rolloutPercentage) {

    String sql =
        "UPDATE feature_flags "
            + "SET rollout_percentage = ? "
            + "WHERE name = ? AND environment = ?";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setInt(1, rolloutPercentage);

      statement.setString(2, name);

      statement.setString(3, environment);

      int affectedRows = statement.executeUpdate();

      if (affectedRows != 1) {

        throw new RuntimeException("Feature flag rollout degeri guncellenemedi: " + name);
      }

    } catch (SQLException exception) {

      throw new RuntimeException(
          "Feature flag rollout degeri database'de guncellenemedi.", exception);
    }
  }

  public void deleteByName(String name) {

    deleteByName(name, "dev");
  }

  public void deleteByName(String name, String environment) {

    String sql = "DELETE FROM feature_flags " + "WHERE name = ? AND environment = ?";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, name);

      statement.setString(2, environment);

      int affectedRows = statement.executeUpdate();

      if (affectedRows != 1) {

        throw new RuntimeException("Feature flag silinemedi: " + name);
      }

    } catch (SQLException exception) {

      throw new RuntimeException("Feature flag database'den silinemedi.", exception);
    }
  }

  private FeatureFlag mapRowToFeatureFlag(ResultSet resultSet) throws SQLException {

    return new FeatureFlag(
        resultSet.getString("name"),
        resultSet.getString("environment"),
        resultSet.getBoolean("enabled"),
        resultSet.getInt("rollout_percentage"));
  }
}
