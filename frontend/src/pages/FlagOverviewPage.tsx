import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAuditLog,
  getFeatureFlag,
  getTargetingRules,
  setFeatureFlagEnabled,
  setFeatureFlagRollout,
} from "../api";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { PageHeader, StatusDot } from "../components/PageChrome";
import { RolloutControl } from "../components/RolloutControl";
import { useToast } from "../components/Toast";
import type { AuditLogEntry, Environment, FeatureFlag, TargetingRule } from "../types";

function relative(value?: string) {
  if (!value) return "No activity yet";
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function readableAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function environmentLabel(environment: Environment) {
  if (environment === "prod") return "Production";
  if (environment === "staging") return "Staging";
  return "Development";
}

export function FlagOverviewPage({
  environment,
  onEnvironmentChange,
}: {
  environment: Environment;
  onEnvironmentChange: (value: Environment) => void;
}) {
  const { name: encodedName } = useParams();
  const name = decodeURIComponent(encodedName ?? "");
  const navigate = useNavigate();
  const { notify } = useToast();
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [rules, setRules] = useState<TargetingRule[]>([]);
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRollout, setEditRollout] = useState(0);
  const [editEnabled, setEditEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const [nextFlag, nextRules, audit] = await Promise.all([
        getFeatureFlag(environment, name),
        getTargetingRules(environment, name).catch(() => []),
        getAuditLog(100).catch(() => []),
      ]);
      setFlag(nextFlag);
      setRules(nextRules);
      setActivity(
        audit
          .filter((entry) => entry.environment === environment && entry.flagName === name)
          .slice(0, 3),
      );
      setEditRollout(nextFlag.rolloutPercentage);
      setEditEnabled(nextFlag.enabled);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load feature flag.");
    } finally {
      setLoading(false);
    }
  }, [environment, name]);

  useEffect(() => {
    void load();
  }, [load]);

  const lastActivity = activity[0];
  const keyFormat = useMemo(() => (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ? "kebab-case" : "custom"), [name]);
  const environmentName = environmentLabel(environment);

  async function saveEdit() {
    if (!flag) return;
    setSaving(true);
    setError(null);
    try {
      let next = flag;
      if (editEnabled !== flag.enabled) {
        next = await setFeatureFlagEnabled(environment, name, editEnabled);
      }
      if (editRollout !== next.rolloutPercentage) {
        next = await setFeatureFlagRollout(environment, name, editRollout);
      }
      setFlag(next);
      setEditOpen(false);
      notify({
        title: "Changes saved",
        message: `${name} is ${next.enabled ? "On" : "Off"} with ${next.rolloutPercentage}% default rollout.`,
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save flag changes.");
    } finally {
      setSaving(false);
    }
  }

  async function quickToggle() {
    if (!flag) return;
    setSaving(true);
    setError(null);
    try {
      const next = await setFeatureFlagEnabled(environment, name, !flag.enabled);
      setFlag(next);
      setEditEnabled(next.enabled);
      notify({
        title: next.enabled ? "Flag enabled" : "Flag disabled",
        message: `${name} is now ${next.enabled ? "On" : "Off"} in ${environmentName.toLowerCase()}.`,
      });
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update flag.");
    } finally {
      setSaving(false);
    }
  }

  async function copyFlagKey() {
    if (!flag) return;
    try {
      await navigator.clipboard.writeText(flag.name);
      notify({ title: "Copied", message: "Flag key copied to clipboard.", tone: "info", duration: 2200 });
    } catch {
      notify({ title: "Copy failed", message: "Clipboard access is unavailable in this browser.", tone: "error" });
    }
  }

  if (loading && !flag) {
    return <div className="page"><div className="page-loading">Loading flag…</div></div>;
  }

  if (!flag) {
    return <div className="page"><div className="page-loading error-text">{error ?? "Flag not found."}</div></div>;
  }

  return (
    <div className="page detail-page overview-page">
      <PageHeader
        title={
          <span className="detail-title-row">
            <span>{flag.name}</span>
            <button className="state-select-button" type="button" onClick={() => void quickToggle()} disabled={saving} title="Toggle flag state">
              <StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"}
            </button>
          </span>
        }
        subtitle={
          <span className="overview-summary">
            <span>{environmentName}</span>
            <span aria-hidden="true">·</span>
            <span>{flag.rolloutPercentage}% default rollout</span>
            <span aria-hidden="true">·</span>
            <span>{rules.length} {rules.length === 1 ? "targeting rule" : "targeting rules"}</span>
          </span>
        }
        environment={environment}
        onEnvironmentChange={(value) => {
          onEnvironmentChange(value);
          navigate(`/flags/${encodeURIComponent(name)}`);
        }}
      >
        <button className="secondary-button" type="button" onClick={() => setEditOpen(true)}><Icon name="edit" size={16} /> Edit flag</button>
        <button className="secondary-button" type="button" onClick={() => navigate(`/flags/${encodeURIComponent(name)}/targeting`)}><Icon name="evaluation" size={16} /> Evaluate</button>
      </PageHeader>

      <div className="breadcrumb-line"><Link to="/flags"><Icon name="arrow-left" size={16} /> Feature flags</Link><span>/</span><span>{flag.name}</span></div>

      <nav className="detail-tabs" aria-label="Flag sections">
        <Link className="active" to={`/flags/${encodeURIComponent(name)}`}>Overview</Link>
        <Link to={`/flags/${encodeURIComponent(name)}/targeting`}>Targeting</Link>
        <Link to={`/audit?flag=${encodeURIComponent(name)}&environment=${environment}`}>History</Link>
        <button type="button" disabled title="No additional settings for this flag">Settings</button>
      </nav>

      {error ? <div className="inline-alert" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button></div> : null}

      <section className="detail-section overview-section">
        <h2>Configuration</h2>
        <div className="property-grid overview-property-grid">
          <dl>
            <div><dt>Flag key</dt><dd><code>{flag.name}</code> <button className="copy-inline" type="button" onClick={() => void copyFlagKey()} aria-label="Copy flag key"><Icon name="copy" size={15} /></button></dd></div>
            <div><dt>Environment</dt><dd>{environmentName}</dd></div>
            <div><dt>State</dt><dd><StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"}</dd></div>
          </dl>
          <dl>
            <div><dt>Default rollout</dt><dd>{flag.rolloutPercentage}%</dd></div>
            <div><dt>Targeting rules</dt><dd><Link to={`/flags/${encodeURIComponent(name)}/targeting`}>{rules.length} {rules.length === 1 ? "rule" : "rules"}</Link></dd></div>
            <div><dt>Last activity</dt><dd>{relative(lastActivity?.createdAt)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="detail-section overview-section delivery-section">
        <h2>Delivery behavior</h2>
        <p className="section-description">How this flag is evaluated after its global state is checked.</p>
        <div className="behavior-list">
          <div className="behavior-row">
            <span className="behavior-index">1</span>
            <div><strong>Targeting rules</strong><small>Rules are evaluated in priority order. The first matching rule wins.</small></div>
            <span className="behavior-value">{rules.length} configured</span>
          </div>
          <div className="behavior-row">
            <span className="behavior-index">2</span>
            <div><strong>Deterministic rollout</strong><small>Users who do not match a rule are bucketed consistently by user key.</small></div>
            <span className="behavior-value">{flag.rolloutPercentage}% On</span>
          </div>
          <div className="behavior-row">
            <span className="behavior-index">3</span>
            <div><strong>Evaluation context</strong><small>Targeting can use user key and optional attributes such as country, plan, and email.</small></div>
            <span className="behavior-value">User + attributes</span>
          </div>
        </div>
        <div className="key-format-line">
          <span>Key format</span>
          <code>{keyFormat}</code>
          <small>{keyFormat === "kebab-case" ? "lowercase words separated by hyphens, for example checkout-v2" : "custom naming pattern"}</small>
        </div>
      </section>

      <section className="detail-section recent-section overview-section">
        <div className="section-heading-row"><h2>Recent activity</h2><Link to={`/audit?flag=${encodeURIComponent(name)}&environment=${environment}`}>View full history <Icon name="chevron-right" size={15} /></Link></div>
        <div className="table-shell compact-table-shell">
          <div className="table-scroll">
            <table className="data-table compact-table">
              <thead><tr><th>Time</th><th>Event</th><th>Details</th></tr></thead>
              <tbody>
                {activity.length === 0 ? <tr><td colSpan={3} className="table-state">No audit activity for this flag yet.</td></tr> : activity.map((entry) => (
                  <tr key={entry.id}><td className="muted-cell">{relative(entry.createdAt)}</td><td>{readableAction(entry.action)}</td><td className="muted-cell">{entry.details}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal open={editOpen} title={`Edit ${flag.name}`} description={`Update the ${environmentName.toLowerCase()} configuration.`} onClose={() => setEditOpen(false)}>
        <div className="form-stack">
          <RolloutControl
            value={editRollout}
            onChange={setEditRollout}
            label="Default rollout"
            caption="Percentage of users who receive On when no targeting rule matches."
          />
          <label className="checkbox-setting">
            <input type="checkbox" checked={editEnabled} onChange={(event) => setEditEnabled(event.target.checked)} />
            <span><strong>Enabled</strong><small>Serve this flag in {environmentName.toLowerCase()}.</small></span>
          </label>
          <div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setEditOpen(false)}>Cancel</button><button className={`primary-button ${saving ? "busy-button" : ""}`} type="button" onClick={() => void saveEdit()} aria-busy={saving} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
        </div>
      </Modal>
    </div>
  );
}
