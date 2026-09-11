export type Environment = "dev" | "staging" | "prod";

export interface FeatureFlag {
  name: string;
  environment: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export interface CreateFeatureFlagRequest {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export type TargetingOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "STARTS_WITH"
  | "ENDS_WITH";

export interface TargetingRule {
  id: number;
  flagName: string;
  environment: string;
  attribute: "userkey" | "country" | "plan" | "email";
  operator: TargetingOperator;
  comparisonValue: string;
  serveEnabled: boolean;
  priority: number;
}

export interface CreateTargetingRuleRequest {
  attribute: TargetingRule["attribute"];
  operator: TargetingOperator;
  comparisonValue: string;
  serveEnabled: boolean;
  priority: number;
}

export type EvaluationReason =
  | "FLAG_DISABLED"
  | "TARGETING_MATCH"
  | "ROLLOUT_ZERO"
  | "ROLLOUT_FULL"
  | "ROLLOUT_MATCH"
  | "ROLLOUT_MISS";

export interface FeatureFlagEvaluation {
  flagName: string;
  environment: string;
  userKey: string;
  enabled: boolean;
  reason: EvaluationReason;
  rolloutPercentage: number;
  bucket: number;
  matchedRuleId: number | null;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  flagName: string;
  environment: string;
  details: string;
  createdAt: string;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
}
