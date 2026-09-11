import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAuditLog } from "../api";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageChrome";
import { SelectMenu, type SelectMenuOption } from "../components/SelectMenu";
import type { AuditLogEntry, Environment } from "../types";

const ENVIRONMENT_LABELS: Record<Environment, string> = {
  dev: "Dev",
  staging: "Staging",
  prod: "Production",
};

const SORT_OPTIONS: SelectMenuOption[] = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

function actionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toISOString().slice(0, 10);
}

function groupLabel(key: string) {
  if (key === "Unknown") return { label: "Unknown", date: "" };
  const date = new Date(`${key}T00:00:00`);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  return {
    label: key === todayKey ? "Today" : key === yesterdayKey ? "Yesterday" : new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date),
    date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date),
  };
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

export function AuditPage({
  environment,
  onEnvironmentChange,
}: {
  environment: Environment;
  onEnvironmentChange: (value: Environment) => void;
}) {
  const [params, setParams] = useSearchParams();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState(params.get("flag") ?? "all");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await getAuditLog(100));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const requestedEnvironment = params.get("environment");
    if (requestedEnvironment === "dev" || requestedEnvironment === "staging" || requestedEnvironment === "prod") {
      onEnvironmentChange(requestedEnvironment);
    }
  }, [onEnvironmentChange, params]);

  const flags = useMemo(() => Array.from(new Set(entries.map((entry) => entry.flagName))).sort(), [entries]);
  const actions = useMemo(() => Array.from(new Set(entries.map((entry) => entry.action))).sort(), [entries]);

  const actionOptions = useMemo<SelectMenuOption[]>(
    () => [{ value: "all", label: "All actions" }, ...actions.map((action) => ({ value: action, label: actionLabel(action) }))],
    [actions],
  );

  const flagOptions = useMemo<SelectMenuOption[]>(
    () => [{ value: "all", label: "All flags" }, ...flags.map((flag) => ({ value: flag, label: flag }))],
    [flags],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = entries.filter((entry) => {
      if (entry.environment !== environment) return false;
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (flagFilter !== "all" && entry.flagName !== flagFilter) return false;
      if (!query) return true;
      return `${entry.flagName} ${entry.action} ${entry.details} ${entry.environment}`.toLowerCase().includes(query);
    });
    return result.sort((a, b) => {
      const difference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortDirection === "desc" ? difference : -difference;
    });
  }, [actionFilter, entries, environment, flagFilter, search, sortDirection]);

  const groups = useMemo(() => {
    const map = new Map<string, AuditLogEntry[]>();
    for (const entry of filtered) {
      const key = dateKey(entry.createdAt);
      const current = map.get(key) ?? [];
      current.push(entry);
      map.set(key, current);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function changeEnvironment(value: Environment) {
    onEnvironmentChange(value);
    const next = new URLSearchParams(params);
    next.set("environment", value);
    setParams(next, { replace: true });
  }

  function changeFlag(value: string) {
    setFlagFilter(value);
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("flag"); else next.set("flag", value);
    setParams(next, { replace: true });
  }

  return (
    <div className="page audit-page">
      <PageHeader
        title="Audit log"
        subtitle="Track configuration changes across environments."
        environment={environment}
        onEnvironmentChange={changeEnvironment}
      />

      <section className="toolbar audit-toolbar" aria-label="Audit filters">
        <label className="search-control">
          <Icon name="search" size={18} />
          <span className="sr-only">Search events</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events..." />
        </label>
        <SelectMenu
          value={actionFilter}
          onChange={setActionFilter}
          options={actionOptions}
          ariaLabel="Filter audit events by action"
          className="audit-filter-menu"
        />
        <SelectMenu
          value={flagFilter}
          onChange={changeFlag}
          options={flagOptions}
          ariaLabel="Filter audit events by flag"
          className="audit-filter-menu"
        />
        <SelectMenu
          value={sortDirection}
          onChange={(value) => setSortDirection(value as "asc" | "desc")}
          options={SORT_OPTIONS}
          ariaLabel="Sort audit events"
          className="audit-filter-menu audit-sort-menu"
        />
      </section>

      {error ? <div className="inline-alert" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button></div> : null}

      <section className="table-shell audit-table-shell">
        <div className="table-scroll">
          <table className="data-table audit-table">
            <thead><tr><th>Time</th><th>Event</th><th>Environment</th><th>Action</th><th className="actions-col">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="table-state">Loading audit log…</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="table-state"><strong>No matching audit events.</strong><span>{ENVIRONMENT_LABELS[environment]} has no events for the current filters.</span></td></tr> : groups.flatMap(([key, group]) => {
                const heading = groupLabel(key);
                return [
                  <tr className="audit-group-row" key={`group-${key}`}><td colSpan={5}><strong>{heading.label}</strong><span>{heading.date}</span></td></tr>,
                  ...group.map((entry) => (
                    <tr key={entry.id}>
                      <td className="muted-cell time-cell">{timeLabel(entry.createdAt)}</td>
                      <td className="audit-event-cell"><strong>{entry.flagName}</strong><span>{entry.details || actionLabel(entry.action)}</span></td>
                      <td><span className="environment-cell"><span className={`environment-dot ${entry.environment as Environment}`} />{ENVIRONMENT_LABELS[entry.environment as Environment] ?? entry.environment}</span></td>
                      <td className="muted-cell">{actionLabel(entry.action)}</td>
                      <td className="actions-col"><button type="button" className="icon-button" onClick={() => void navigator.clipboard.writeText(`${entry.flagName}: ${entry.details}`)} aria-label="Copy audit event"><Icon name="copy" size={16} /></button></td>
                    </tr>
                  )),
                ];
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
