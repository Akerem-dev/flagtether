package com.releasepilot;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuditLogRepository {

  private final JdbcTemplate jdbcTemplate;

  public AuditLogRepository(DataSource dataSource) {
    this.jdbcTemplate = new JdbcTemplate(dataSource);
  }

  public void insert(AuditAction action, String flagName, String environment, String details) {
    String sql =
        "INSERT INTO audit_log "
            + "(action, flag_name, environment, details) "
            + "VALUES (?, ?, ?, ?)";

    int affectedRows = jdbcTemplate.update(sql, action.name(), flagName, environment, details);

    if (affectedRows != 1) {
      throw new IllegalStateException("Audit log yazilamadi.");
    }
  }

  public List<AuditLogEntry> findRecent(int limit) {
    String sql =
        "SELECT id, action, flag_name, environment, "
            + "details, created_at "
            + "FROM audit_log "
            + "ORDER BY created_at DESC, id DESC "
            + "LIMIT ?";

    return jdbcTemplate.query(sql, this::mapRow, limit);
  }

  private AuditLogEntry mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
    return new AuditLogEntry(
        resultSet.getLong("id"),
        AuditAction.valueOf(resultSet.getString("action")),
        resultSet.getString("flag_name"),
        resultSet.getString("environment"),
        resultSet.getString("details"),
        resultSet.getTimestamp("created_at").toLocalDateTime());
  }
}
