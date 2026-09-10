package com.releasepilot;

public enum EvaluationReason {
  FLAG_DISABLED,

  TARGETING_MATCH,

  ROLLOUT_ZERO,

  ROLLOUT_FULL,

  ROLLOUT_MATCH,

  ROLLOUT_MISS
}
