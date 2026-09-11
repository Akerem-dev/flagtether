package com.releasepilot;

import java.util.List;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeatureFlagService {

  private final FeatureFlagPostgresRepository repository;
  private final AuditLogService auditLogService;

  public FeatureFlagService(
      FeatureFlagPostgresRepository repository, AuditLogService auditLogService) {
    this.repository = repository;
    this.auditLogService = auditLogService;
  }

  @Transactional
  public FeatureFlag createFlag(String name, boolean enabled, int rolloutPercentage) {
    return createFlag(name, "dev", enabled, rolloutPercentage);
  }

  @Transactional
  public FeatureFlag createFlag(
      String name, String environment, boolean enabled, int rolloutPercentage) {
    String normalizedEnvironment = normalizeEnvironment(environment);

    FeatureFlag existingFlag = repository.findByNameAndEnvironment(name, normalizedEnvironment);
    if (existingFlag != null) {
      throw new FeatureFlagAlreadyExistsException(name);
    }

    FeatureFlag flag = new FeatureFlag(name, normalizedEnvironment, enabled, rolloutPercentage);

    try {
      repository.insert(flag);
    } catch (DuplicateKeyException exception) {
      throw new FeatureFlagAlreadyExistsException(name);
    }

    auditLogService.record(
        AuditAction.FLAG_CREATED,
        flag.getName(),
        flag.getEnvironment(),
        "enabled=" + flag.isEnabled() + ", rolloutPercentage=" + flag.getRolloutPercentage());

    return flag;
  }

  public List<FeatureFlag> getAllFlags() {
    return getAllFlags("dev");
  }

  public List<FeatureFlag> getAllFlags(String environment) {
    return repository.findAllByEnvironment(normalizeEnvironment(environment));
  }

  public FeatureFlag findFlagByName(String name) {
    return repository.findByName(name);
  }

  public FeatureFlag getFlagByName(String name) {
    return getFlagByName(name, "dev");
  }

  public FeatureFlag getFlagByName(String name, String environment) {
    return getExistingFlagOrThrow(name, normalizeEnvironment(environment));
  }

  @Transactional
  public FeatureFlag updateEnabled(String name, boolean enabled) {
    return updateEnabled(name, "dev", enabled);
  }

  @Transactional
  public FeatureFlag updateEnabled(String name, String environment, boolean enabled) {
    String normalizedEnvironment = normalizeEnvironment(environment);
    FeatureFlag flag = getExistingFlagOrThrow(name, normalizedEnvironment);

    if (enabled) {
      flag.enable();
    } else {
      flag.disable();
    }

    boolean updated =
        repository.updateEnabled(name, normalizedEnvironment, flag.isEnabled());
    if (!updated) {
      throw new FeatureFlagNotFoundException(name);
    }

    AuditAction action = enabled ? AuditAction.FLAG_ENABLED : AuditAction.FLAG_DISABLED;
    auditLogService.record(
        action, flag.getName(), flag.getEnvironment(), "enabled=" + flag.isEnabled());

    return flag;
  }

  @Transactional
  public FeatureFlag updateRollout(String name, int newPercentage) {
    return updateRollout(name, "dev", newPercentage);
  }

  @Transactional
  public FeatureFlag updateRollout(String name, String environment, int newPercentage) {
    String normalizedEnvironment = normalizeEnvironment(environment);
    FeatureFlag flag = getExistingFlagOrThrow(name, normalizedEnvironment);
    int previousPercentage = flag.getRolloutPercentage();

    flag.updateRolloutPercentage(newPercentage);
    boolean updated =
        repository.updateRollout(name, normalizedEnvironment, flag.getRolloutPercentage());
    if (!updated) {
      throw new FeatureFlagNotFoundException(name);
    }

    auditLogService.record(
        AuditAction.FLAG_ROLLOUT_UPDATED,
        flag.getName(),
        flag.getEnvironment(),
        "from=" + previousPercentage + ", to=" + flag.getRolloutPercentage());

    return flag;
  }

  @Transactional
  public void enableFlag(String name) {
    updateEnabled(name, true);
  }

  @Transactional
  public void disableFlag(String name) {
    updateEnabled(name, false);
  }

  @Transactional
  public void deleteFlag(String name) {
    deleteFlag(name, "dev");
  }

  @Transactional
  public void deleteFlag(String name, String environment) {
    String normalizedEnvironment = normalizeEnvironment(environment);
    FeatureFlag flag = getExistingFlagOrThrow(name, normalizedEnvironment);

    boolean deleted = repository.deleteByName(name, normalizedEnvironment);
    if (!deleted) {
      throw new FeatureFlagNotFoundException(name);
    }

    auditLogService.record(
        AuditAction.FLAG_DELETED, flag.getName(), flag.getEnvironment(), "Feature flag deleted");
  }

  private FeatureFlag getExistingFlagOrThrow(String name, String environment) {
    FeatureFlag flag = repository.findByNameAndEnvironment(name, environment);
    if (flag == null) {
      throw new FeatureFlagNotFoundException(name);
    }
    return flag;
  }

  private String normalizeEnvironment(String environment) {
    if (environment == null || environment.isBlank()) {
      throw new IllegalArgumentException("Environment bos olamaz.");
    }

    String normalized = environment.trim().toLowerCase(Locale.ROOT);
    if (!normalized.equals("dev") && !normalized.equals("staging") && !normalized.equals("prod")) {
      throw new IllegalArgumentException("Environment dev, staging veya prod olmalidir.");
    }

    return normalized;
  }
}
