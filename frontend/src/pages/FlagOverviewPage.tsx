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
    try {
      const next = await setFeatureFlagEnabled(environment, name, !flag.enabled);
      setFlag(next);
      setEditEnabled(next.enabled);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update flag.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !flag) {
    return <div className="page"><div className="page-loading">Loading flag…</div></div>;
  }

  if (!flag) {
    return <div className="page"><div className="page-loading error-text">{error ?? "Flag not found."}</div></div>;
  }

  return (
    <div className="page detail-page">
      <PageHeader
        title={
          <span className="detail-title-row">
            <span>{flag.name}</span>
            <button className="state-select-button" type="button" onClick={() => void quickToggle()} disabled={saving}>
              <StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"} <Icon name="chevron-down" size={14} />
            </button>
          </span>
        }
        subtitle={<><code>{flag.name}</code><span className="detail-subtitle-copy">Environment-scoped feature flag.</span></>}
        environment={environment}
        onEnvironmentChange={(value) => {
          onEnvironmentChange(value);
          navigate(`/flags/${encodeURIComponent(name)}`);
        }}
      >
        <button className="primary-button" type="button" onClick={() => setEditOpen(true)}><Icon name="edit" size={17} /> Edit flag</button>
        <button className="secondary-button" type="button" onClick={() => navigate(`/flags/${encodeURIComponent(name)}/targeting`)}><Icon name="evaluation" size={17} /> Test evaluation</button>
      </PageHeader>

      <div className="breadcrumb-line"><Link to="/flags"><Icon name="arrow-left" size={16} /> Feature flags</Link><span>/</span><span>{flag.name}</span></div>

      <nav className="detail-tabs" aria-label="Flag sections">
        <Link className="active" to={`/flags/${encodeURIComponent(name)}`}>Overview</Link>
        <Link to={`/flags/${encodeURIComponent(name)}/targeting`}>Targeting</Link>
        <Link to={`/audit?flag=${encodeURIComponent(name)}&environment=${environment}`}>History</Link>
        <button type="button" disabled title="No additional settings for this flag">Settings</button>
      </nav>

      {error ? <div className="inline-alert" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button></div> : null}

      <section className="detail-section">
        <h2>Details</h2>
        <div className="property-grid">
          <dl>
            <div><dt>Key</dt><dd><code>{flag.name}</code> <button className="copy-inline" type="button" onClick={() => void navigator.clipboard.writeText(flag.name)} aria-label="Copy flag key"><Icon name="copy" size={16} /></button></dd></div>
            <div><dt>Environment</dt><dd>{environment === "prod" ? "Production" : environment === "staging" ? "Staging" : "Dev"}</dd></div>
            <div><dt>State</dt><dd><StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"}</dd></div>
          </dl>
          <dl>
            <div><dt>Rollout</dt><dd>{flag.rolloutPercentage}%</dd></div>
            <div><dt>Targeting rules</dt><dd><Link to={`/flags/${encodeURIComponent(name)}/targeting`}>{rules.length} {rules.length === 1 ? "rule" : "rules"}</Link></dd></div>
            <div><dt>Last activity</dt><dd>{relative(lastActivity?.createdAt)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="detail-section">
        <h2>Evaluation</h2>
        <div className="property-grid">
          <dl>
            <div><dt>Strategy</dt><dd>Deterministic</dd></div>
            <div><dt>Rollout</dt><dd>{flag.rolloutPercentage}%</dd></div>
            <div><dt>Targeting</dt><dd>{rules.length} {rules.length === 1 ? "rule" : "rules"}</dd></div>
          </dl>
          <dl>
            <div><dt>Environment</dt><dd>{environment === "prod" ? "Production" : environment === "staging" ? "Staging" : "Dev"}</dd></div>
            <div><dt>Context fields</dt><dd>User + attributes</dd></div>
            <div><dt>Key format</dt><dd><code>{keyFormat}</code></dd></div>
          </dl>
        </div>
      </section>

      <section className="detail-section recent-section">
        <div className="section-heading-row"><h2>Recent activity</h2><Link to={`/audit?flag=${encodeURIComponent(name)}&environment=${environment}`}>View full history <Icon name="chevron-right" size={16} /></Link></div>
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

      <Modal open={editOpen} title={`Edit ${flag.name}`} description={`Update the ${environment} configuration.`} onClose={() => setEditOpen(false)}>
        <div className="form-stack">
          <label className="field-label">Rollout<div className="range-row"><input type="range" min={0} max={100} value={editRollout} onChange={(event) => setEditRollout(Number(event.target.value))} /><output>{editRollout}%</output></div></label>
          <label className="switch-row"><span><strong>Enabled</strong><small>Serve the flag in this environment.</small></span><input type="checkbox" checked={editEnabled} onChange={(event) => setEditEnabled(event.target.checked)} /></label>
          <div className="dialog-actions"><button className="secondary-button" type="button" onClick={() => setEditOpen(false)}>Cancel</button><button className="primary-button" type="button" onClick={() => void saveEdit()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div>
        </div>
      </Modal>
    </div>
  );
}
