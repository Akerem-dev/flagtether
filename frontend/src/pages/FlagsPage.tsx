import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createFeatureFlag,
  deleteFeatureFlag,
  getAuditLog,
  getFeatureFlags,
  getTargetingRules,
  setFeatureFlagEnabled,
} from "../api";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { PageHeader, StatusDot } from "../components/PageChrome";
import type { AuditLogEntry, Environment, FeatureFlag } from "../types";

type StatusFilter = "all" | "on" | "off";
type SortValue = "name" | "state" | "rollout" | "updated";

type FlagMeta = {
  ruleCount: number;
  updatedAt?: string;
};

function formatRelativeDate(value?: string) {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

export function FlagsPage({
  environment,
  onEnvironmentChange,
}: {
  environment: Environment;
  onEnvironmentChange: (value: Environment) => void;
}) {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [meta, setMeta] = useState<Record<string, FlagMeta>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortValue>("name");
  const [showRules, setShowRules] = useState(true);
  const [showUpdated, setShowUpdated] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [rollout, setRollout] = useState(0);
  const [busyName, setBusyName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextFlags, audit] = await Promise.all([
        getFeatureFlags(environment),
        getAuditLog(100).catch(() => [] as AuditLogEntry[]),
      ]);
      setFlags(nextFlags);

      const ruleResults = await Promise.all(
        nextFlags.map(async (flag) => {
          const rules = await getTargetingRules(environment, flag.name).catch(() => []);
          const latest = audit.find(
            (entry) => entry.environment === environment && entry.flagName === flag.name,
          );
          return [flag.name, { ruleCount: rules.length, updatedAt: latest?.createdAt }] as const;
        }),
      );
      setMeta(Object.fromEntries(ruleResults));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load feature flags.");
    } finally {
      setLoading(false);
    }
  }, [environment]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredFlags = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = flags.filter((flag) => {
      const searchMatch = !query || flag.name.toLowerCase().includes(query);
      const stateMatch =
        statusFilter === "all" ||
        (statusFilter === "on" && flag.enabled) ||
        (statusFilter === "off" && !flag.enabled);
      return searchMatch && stateMatch;
    });

    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "state") return Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name);
      if (sort === "rollout") return b.rolloutPercentage - a.rolloutPercentage || a.name.localeCompare(b.name);
      const left = meta[a.name]?.updatedAt ? new Date(meta[a.name].updatedAt!).getTime() : 0;
      const right = meta[b.name]?.updatedAt ? new Date(meta[b.name].updatedAt!).getTime() : 0;
      return right - left;
    });
  }, [flags, meta, search, sort, statusFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      await createFeatureFlag(environment, {
        name: trimmed,
        enabled,
        rolloutPercentage: rollout,
      });
      setCreateOpen(false);
      setName("");
      setEnabled(false);
      setRollout(0);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create flag.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleFlag(flag: FeatureFlag, event: MouseEvent) {
    event.stopPropagation();
    setBusyName(flag.name);
    setError(null);
    try {
      const updated = await setFeatureFlagEnabled(environment, flag.name, !flag.enabled);
      setFlags((current) => current.map((item) => (item.name === updated.name ? updated : item)));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update flag.");
    } finally {
      setBusyName(null);
    }
  }

  async function removeFlag(flag: FeatureFlag, event: MouseEvent) {
    event.stopPropagation();
    if (!window.confirm(`Delete ${flag.name} from ${environment}?`)) return;
    setBusyName(flag.name);
    setError(null);
    try {
      await deleteFeatureFlag(environment, flag.name);
      setFlags((current) => current.filter((item) => item.name !== flag.name));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete flag.");
    } finally {
      setBusyName(null);
    }
  }

  return (
    <div className="page flags-page">
      <PageHeader
        title="Feature flags"
        subtitle="Control feature rollouts, manage targeting rules, and ship with confidence."
        environment={environment}
        onEnvironmentChange={onEnvironmentChange}
      />

      <section className="toolbar flags-toolbar" aria-label="Feature flag controls">
        <label className="search-control">
          <Icon name="search" size={18} />
          <span className="sr-only">Search flags</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or key..." />
        </label>
        <select className="control-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter by status">
          <option value="all">Status</option>
          <option value="on">On</option>
          <option value="off">Off</option>
        </select>
        <select className="control-select" value={sort} onChange={(event) => setSort(event.target.value as SortValue)} aria-label="Sort flags">
          <option value="name">Sort: Name</option>
          <option value="state">Sort: State</option>
          <option value="rollout">Sort: Rollout</option>
          <option value="updated">Sort: Updated</option>
        </select>
        <details className="columns-menu">
          <summary className="secondary-button">Columns <Icon name="chevron-down" size={15} /></summary>
          <div className="columns-popover">
            <label><input type="checkbox" checked={showRules} onChange={(event) => setShowRules(event.target.checked)} /> Rules</label>
            <label><input type="checkbox" checked={showUpdated} onChange={(event) => setShowUpdated(event.target.checked)} /> Updated</label>
          </div>
        </details>
        <button className="primary-button new-flag-button" type="button" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" size={17} /> New flag
        </button>
      </section>

      <div className="count-line">{filteredFlags.length} {filteredFlags.length === 1 ? "flag" : "flags"}</div>

      {error ? <div className="inline-alert" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button></div> : null}

      <section className="table-shell">
        <div className="table-scroll">
          <table className="data-table flags-table">
            <thead>
              <tr>
                <th className="checkbox-col"><input type="checkbox" aria-label="Select all flags" disabled /></th>
                <th>Name / key</th>
                <th>State</th>
                <th>Rollout</th>
                {showRules ? <th className="rules-col">Rules</th> : null}
                {showUpdated ? <th className="updated-col">Updated</th> : null}
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-state">Loading feature flags…</td></tr>
              ) : filteredFlags.length === 0 ? (
                <tr><td colSpan={7} className="table-state"><strong>No feature flags found.</strong><span>Create a flag or change the current filters.</span></td></tr>
              ) : filteredFlags.map((flag) => (
                <tr key={flag.name} className="clickable-row" onClick={() => navigate(`/flags/${encodeURIComponent(flag.name)}`)}>
                  <td className="checkbox-col"><input type="checkbox" aria-label={`Select ${flag.name}`} onClick={(event) => event.stopPropagation()} /></td>
                  <td className="flag-name-cell"><strong>{flag.name}</strong><code>{flag.name}</code></td>
                  <td>
                    <button className="inline-state-button" type="button" disabled={busyName === flag.name} onClick={(event) => void toggleFlag(flag, event)}>
                      <StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"}
                    </button>
                  </td>
                  <td>{flag.rolloutPercentage}%</td>
                  {showRules ? <td className="rules-col muted-cell">{meta[flag.name]?.ruleCount ? `${meta[flag.name].ruleCount} ${meta[flag.name].ruleCount === 1 ? "rule" : "rules"}` : "—"}</td> : null}
                  {showUpdated ? <td className="updated-col muted-cell">{formatRelativeDate(meta[flag.name]?.updatedAt)}</td> : null}
                  <td className="actions-col">
                    <details className="row-menu" onClick={(event) => event.stopPropagation()}>
                      <summary aria-label={`Actions for ${flag.name}`}><Icon name="more-horizontal" size={18} /></summary>
                      <div className="row-menu-popover">
                        <button type="button" onClick={() => navigate(`/flags/${encodeURIComponent(flag.name)}`)}>View details</button>
                        <button className="danger-action" type="button" onClick={(event) => void removeFlag(flag, event)}>Delete</button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={createOpen} title="New feature flag" description={`Create a flag in ${environment}.`} onClose={() => setCreateOpen(false)}>
        <form className="form-stack" onSubmit={handleCreate}>
          <label className="field-label">Name / key<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="checkout-v2" required /></label>
          <label className="field-label">Initial rollout<div className="range-row"><input type="range" min={0} max={100} value={rollout} onChange={(event) => setRollout(Number(event.target.value))} /><output>{rollout}%</output></div></label>
          <label className="switch-row"><span><strong>Enable immediately</strong><small>Serve this flag as soon as it is created.</small></span><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /></label>
          <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={creating}>{creating ? "Creating…" : "Create flag"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
