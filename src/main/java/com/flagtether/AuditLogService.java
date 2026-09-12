package com.flagtether;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

  private final AuditLogRepository repository;

  public AuditLogService(AuditLogRepository repository) {

    this.repository = repository;
  }

  public void record(AuditAction action, String flagName, String environment, String details) {

    repository.insert(action, flagName, environment, details);
  }

  public List<AuditLogEntry> getRecent(int limit) {

    if (limit < 1 || limit > 200) {

      throw new IllegalArgumentException("Audit log limit 1 ile 200 arasinda olmalidir.");
    }

    return repository.findRecent(limit);
  }
}
