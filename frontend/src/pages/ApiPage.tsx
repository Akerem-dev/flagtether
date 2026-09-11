import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getHealth } from "../api";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageChrome";
import type { Environment } from "../types";

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  group: "Flags" | "Targeting rules" | "Audit log";
  request?: string;
  response?: string;
};

const endpoints: Endpoint[] = [
  { method: "GET", path: "/environments/{env}/flags", description: "List feature flags", group: "Flags" },
  {
    method: "POST",
    path: "/environments/{env}/flags",
    description: "Create feature flag",
    group: "Flags",
    request: `{
  "name": "new-navbar",
  "enabled": true,
  "rolloutPercentage": 50
}`,
    response: `{
  "name": "new-navbar",
  "environment": "prod",
  "enabled": true,
  "rolloutPercentage": 50
}`,
  },
  { method: "GET", path: "/environments/{env}/flags/{name}", description: "Get flag by name", group: "Flags" },
  { method: "PATCH", path: "/environments/{env}/flags/{name}/enabled", description: "Update flag state", group: "Flags" },
  { method: "PATCH", path: "/environments/{env}/flags/{name}/rollout", description: "Update rollout", group: "Flags" },
  { method: "DELETE", path: "/environments/{env}/flags/{name}", description: "Delete feature flag", group: "Flags" },
  { method: "GET", path: "/environments/{env}/flags/{name}/evaluate", description: "Evaluate for a user", group: "Flags" },
  { method: "GET", path: "/environments/{env}/flags/{name}/rules", description: "List targeting rules", group: "Targeting rules" },
  { method: "POST", path: "/environments/{env}/flags/{name}/rules", description: "Create targeting rule", group: "Targeting rules" },
  { method: "DELETE", path: "/environments/{env}/flags/{name}/rules/{ruleId}", description: "Delete targeting rule", group: "Targeting rules" },
  { method: "GET", path: "/audit?limit=50", description: "List audit events", group: "Audit log" },
];

function methodClass(method: Endpoint["method"]) {
  return `method-badge method-${method.toLowerCase()}`;
}

function resolvePath(path: string, environment: Environment) {
  return path.replace("{env}", environment);
}

export function ApiPage({ environment }: { environment: Environment }) {
  const [selected, setSelected] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"endpoints" | "schema" | "examples">("endpoints");
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await getHealth();
        if (!cancelled) setHealthy(true);
      } catch {
        if (!cancelled) setHealthy(false);
      } finally {
        if (!cancelled) setLastChecked(new Date());
      }
    };
    void check();
    const interval = window.setInterval(check, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const visibleEndpoints = useMemo(() => {
    const query = search.trim().toLowerCase();
    return endpoints
      .map((endpoint, index) => ({ endpoint, index }))
      .filter(({ endpoint }) => !query || `${endpoint.method} ${endpoint.path} ${endpoint.description}`.toLowerCase().includes(query));
  }, [search]);

  const current = endpoints[selected] ?? endpoints[0];
  const resolved = resolvePath(current.path, environment);
  const requestUrl = `${API_BASE_URL}/api${resolved.startsWith("/") ? resolved : `/${resolved}`}`;
  const curl = `${current.method === "GET" ? "curl" : `curl -X ${current.method}`} '${requestUrl}'${current.request ? ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${current.request.replace(/\n/g, " ")}'` : ""}`;

  return (
    <div className="page api-page">
      <PageHeader title="API" subtitle="Inspect and test FlagTether endpoints.">
        <div className="base-url-card"><span>Base URL</span><code>{API_BASE_URL}/api</code><button type="button" onClick={() => void navigator.clipboard.writeText(`${API_BASE_URL}/api`)} aria-label="Copy base URL"><Icon name="copy" size={16} /></button></div>
        <div className="api-health"><span className={`status-dot ${healthy ? "on" : healthy === false ? "error" : "off"}`} /><span><strong>{healthy === null ? "Checking API" : healthy ? "API healthy" : "API unavailable"}</strong><small>{lastChecked ? `Checked ${lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</small></span></div>
      </PageHeader>

      <nav className="api-tabs" aria-label="API sections">
        <button className={tab === "endpoints" ? "active" : ""} type="button" onClick={() => setTab("endpoints")}>Endpoints</button>
        <button className={tab === "schema" ? "active" : ""} type="button" onClick={() => setTab("schema")}>Schema</button>
        <button className={tab === "examples" ? "active" : ""} type="button" onClick={() => setTab("examples")}>Examples</button>
      </nav>

      {tab === "endpoints" ? (
        <div className="api-layout">
          <aside className="endpoint-nav">
            <label className="search-control endpoint-search"><Icon name="search" size={18} /><span className="sr-only">Search endpoints</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search endpoints..." /></label>
            {(["Flags", "Targeting rules", "Audit log"] as const).map((group) => {
              const groupItems = visibleEndpoints.filter(({ endpoint }) => endpoint.group === group);
              if (groupItems.length === 0) return null;
              return <div className="endpoint-group" key={group}><h2>{group}</h2>{groupItems.map(({ endpoint, index }) => <button type="button" key={`${endpoint.method}-${endpoint.path}`} className={`endpoint-item ${selected === index ? "active" : ""}`} onClick={() => setSelected(index)}><span className={methodClass(endpoint.method)}>{endpoint.method}</span><span><code>{endpoint.path}</code><small>{endpoint.description}</small></span></button>)}</div>;
            })}
          </aside>

          <section className="endpoint-detail">
            <header className="endpoint-detail-header">
              <div><div className="endpoint-title-line"><span className={methodClass(current.method)}>{current.method}</span><h2><code>{current.path}</code></h2></div><p>{current.description}</p></div>
              <div className="endpoint-actions"><button className="secondary-button" type="button" onClick={() => void navigator.clipboard.writeText(curl)}><Icon name="copy" size={16} /> Copy cURL</button><a className="secondary-button" href={`${API_BASE_URL}/swagger-ui.html`} target="_blank" rel="noreferrer"><Icon name="external-link" size={16} /> Open Swagger</a></div>
            </header>

            <div className="request-response-grid">
              <section><h3>Request</h3><div className="request-url"><code>{current.method}</code><code>{requestUrl}</code></div><p className="code-label">Request body</p><pre className="code-panel">{current.request ?? (current.method === "GET" ? "No request body." : "Select Swagger for the full schema.")}</pre><div className="field-notes"><h3>Field notes</h3><dl><div><dt><code>name</code></dt><dd>Unique feature flag key.</dd></div><div><dt><code>enabled</code></dt><dd>Initial on/off state.</dd></div><div><dt><code>rolloutPercentage</code></dt><dd>Percentage of users to serve (0–100).</dd></div></dl></div></section>
              <section><div className="response-heading"><h3>Response</h3><span><span className="status-dot on" /> {current.method === "POST" ? "201 Created" : "200 OK"}</span></div><pre className="code-panel response-panel">{current.response ?? `{
  "status": "See Swagger for the endpoint schema"
}`}</pre><p className="response-note">Environment-scoped resource returned by FlagTether.</p></section>
            </div>
          </section>
        </div>
      ) : tab === "schema" ? (
        <section className="api-static-section"><h2>Core schema</h2><p>FlagTether keeps the public model compact and environment-scoped.</p><div className="schema-grid"><div><h3>FeatureFlag</h3><pre className="code-panel">{`{
  name: string
  environment: string
  enabled: boolean
  rolloutPercentage: number
}`}</pre></div><div><h3>TargetingRule</h3><pre className="code-panel">{`{
  id: number
  attribute: userkey | country | plan | email
  operator: EQUALS | NOT_EQUALS | CONTAINS |
            STARTS_WITH | ENDS_WITH
  comparisonValue: string
  serveEnabled: boolean
  priority: number
}`}</pre></div></div></section>
      ) : (
        <section className="api-static-section"><h2>Examples</h2><p>Copy a request and replace the flag key or environment as needed.</p><pre className="code-panel large-example">{`# List production flags
curl '${API_BASE_URL}/api/environments/prod/flags'

# Evaluate checkout-v2 for a user
curl '${API_BASE_URL}/api/environments/prod/flags/checkout-v2/evaluate?userKey=user_123&country=TR&plan=premium'

# Read the latest audit events
curl '${API_BASE_URL}/api/audit?limit=50'`}</pre></section>
      )}
    </div>
  );
}
