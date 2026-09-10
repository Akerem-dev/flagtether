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
public class AuditLogRepository {

  private final DataSource dataSource;

  public AuditLogRepository(DataSource dataSource) {

    this.dataSource = dataSource;
  }

  private Connection openConnection() throws SQLException {

    return dataSource.getConnection();
  }

  public void insert(AuditAction action, String flagName, String environment, String details) {

    String sql =
        "INSERT INTO audit_log "
            + "(action, flag_name, environment, details) "
            + "VALUES (?, ?, ?, ?)";

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setString(1, action.name());

      statement.setString(2, flagName);

      statement.setString(3, environment);

      statement.setString(4, details);

      int affectedRows = statement.executeUpdate();

      if (affectedRows != 1) {

        throw new RuntimeException("Audit log yazilamadi.");
      }

    } catch (SQLException exception) {

      throw new RuntimeException("Audit log database'e yazilamadi.", exception);
    }
  }

  public List<AuditLogEntry> findRecent(int limit) {

    String sql =
        "SELECT id, action, flag_name, environment, "
            + "details, created_at "
            + "FROM audit_log "
            + "ORDER BY created_at DESC, id DESC "
            + "LIMIT ?";

    List<AuditLogEntry> entries = new ArrayList<>();

    try (Connection connection = openConnection();
        PreparedStatement statement = connection.prepareStatement(sql)) {

      statement.setInt(1, limit);

      try (ResultSet resultSet = statement.executeQuery()) {

        while (resultSet.next()) {

          entries.add(mapRow(resultSet));
        }
      }

      return entries;

    } catch (SQLException exception) {

      throw new RuntimeException("Audit log database'den okunamadi.", exception);
    }
  }

  private AuditLogEntry mapRow(ResultSet resultSet) throws SQLException {

    return new AuditLogEntry(
        resultSet.getLong("id"),
        AuditAction.valueOf(resultSet.getString("action")),
        resultSet.getString("flag_name"),
        resultSet.getString("environment"),
        resultSet.getString("details"),
        resultSet.getTimestamp("created_at").toLocalDateTime());
  }
}
