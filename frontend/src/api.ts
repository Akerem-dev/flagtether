import type {
  ApiErrorBody,
  AuditLogEntry,
  CreateFeatureFlagRequest,
  CreateTargetingRuleRequest,
  Environment,
  FeatureFlag,
  FeatureFlagEvaluation,
  TargetingRule,
} from "./types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      message = body.message ?? body.error ?? message;
    } catch {
      // Keep the HTTP status fallback when the server did not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

function flagBase(environment: Environment) {
  return `/api/environments/${encodeURIComponent(environment)}/flags`;
}

export function getFeatureFlags(environment: Environment) {
  return request<FeatureFlag[]>(flagBase(environment));
}

export function getFeatureFlag(environment: Environment, name: string) {
  return request<FeatureFlag>(`${flagBase(environment)}/${encodeURIComponent(name)}`);
}

export function createFeatureFlag(
  environment: Environment,
  payload: CreateFeatureFlagRequest,
) {
  return request<FeatureFlag>(flagBase(environment), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function setFeatureFlagEnabled(
  environment: Environment,
  name: string,
  enabled: boolean,
) {
  return request<FeatureFlag>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/enabled`,
    {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    },
  );
}

export function setFeatureFlagRollout(
  environment: Environment,
  name: string,
  rolloutPercentage: number,
) {
  return request<FeatureFlag>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/rollout`,
    {
      method: "PATCH",
      body: JSON.stringify({ rolloutPercentage }),
    },
  );
}

export function deleteFeatureFlag(environment: Environment, name: string) {
  return request<void>(`${flagBase(environment)}/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export function getTargetingRules(environment: Environment, name: string) {
  return request<TargetingRule[]>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/rules`,
  );
}

export function createTargetingRule(
  environment: Environment,
  name: string,
  payload: CreateTargetingRuleRequest,
) {
  return request<TargetingRule>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/rules`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTargetingRule(
  environment: Environment,
  name: string,
  ruleId: number,
) {
  return request<void>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/rules/${ruleId}`,
    { method: "DELETE" },
  );
}

export function evaluateFeatureFlag(
  environment: Environment,
  name: string,
  context: {
    userKey: string;
    country?: string;
    plan?: string;
    email?: string;
  },
) {
  const params = new URLSearchParams({ userKey: context.userKey });
  if (context.country) params.set("country", context.country);
  if (context.plan) params.set("plan", context.plan);
  if (context.email) params.set("email", context.email);

  return request<FeatureFlagEvaluation>(
    `${flagBase(environment)}/${encodeURIComponent(name)}/evaluate?${params.toString()}`,
  );
}

export function getAuditLog(limit = 50) {
  return request<AuditLogEntry[]>(`/api/audit?limit=${limit}`);
}

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`, {
    headers: { Accept: "text/plain, application/json" },
  });
  if (!response.ok) throw new Error(`Health check failed (${response.status})`);
  return response.text();
}
