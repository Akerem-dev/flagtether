import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createTargetingRule,
  deleteTargetingRule,
  evaluateFeatureFlag,
  getFeatureFlag,
  getTargetingRules,
} from "../api";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { PageHeader, StatusDot } from "../components/PageChrome";
import { SelectMenu, type SelectMenuOption } from "../components/SelectMenu";
import type {
  CreateTargetingRuleRequest,
  Environment,
  FeatureFlag,
  FeatureFlagEvaluation,
  TargetingOperator,
  TargetingRule,
} from "../types";

const OPERATOR_LABELS: Record<TargetingOperator, string> = {
  EQUALS: "equals",
  NOT_EQUALS: "does not equal",
  CONTAINS: "contains",
  STARTS_WITH: "starts with",
  ENDS_WITH: "ends with",
};

const ATTRIBUTES: Array<TargetingRule["attribute"]> = ["userkey", "country", "plan", "email"];
const OPERATORS: TargetingOperator[] = ["EQUALS", "NOT_EQUALS", "CONTAINS", "STARTS_WITH", "ENDS_WITH"];

const ATTRIBUTE_OPTIONS: SelectMenuOption[] = ATTRIBUTES.map((attribute) => ({
  value: attribute,
  label: attribute === "userkey" ? "userKey" : attribute,
}));

const OPERATOR_OPTIONS: SelectMenuOption[] = OPERATORS.map((operator) => ({
  value: operator,
  label: OPERATOR_LABELS[operator],
}));

function attributeLabel(attribute: TargetingRule["attribute"]) {
  return attribute === "userkey" ? "userKey" : attribute;
}

function reasonLabel(reason: FeatureFlagEvaluation["reason"]) {
  return reason
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function evaluationExplanation(evaluation: FeatureFlagEvaluation, matchedRule: TargetingRule | null) {
  if (evaluation.reason === "FLAG_DISABLED") {
    return "The flag is globally Off, so targeting rules and percentage rollout are skipped.";
  }
  if (evaluation.reason === "TARGETING_MATCH" && matchedRule) {
    return `The first matching rule returned ${evaluation.enabled ? "On" : "Off"}.`;
  }
  if (evaluation.reason === "ROLLOUT_ZERO") {
    return "No targeting rule matched and rollout is 0%, so this user receives Off.";
  }
  if (evaluation.reason === "ROLLOUT_FULL") {
    return "No targeting rule matched and rollout is 100%, so this user receives On.";
  }
  if (evaluation.reason === "ROLLOUT_MATCH") {
    return `No targeting rule matched. Bucket ${evaluation.bucket} falls inside the ${evaluation.rolloutPercentage}% rollout.`;
  }
  return `No targeting rule matched. Bucket ${evaluation.bucket} falls outside the ${evaluation.rolloutPercentage}% rollout.`;
}

export function TargetingPage({
  environment,
  onEnvironmentChange,
}: {
  environment: Environment;
  onEnvironmentChange: (value: Environment) => void;
}) {
  const { name: encodedName } = useParams();
  const name = decodeURIComponent(encodedName ?? "");
  const navigate = useNavigate();
  const evaluationPanelRef = useRef<HTMLElement>(null);
  const userKeyInputRef = useRef<HTMLInputElement>(null);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [rules, setRules] = useState<TargetingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TargetingRule | null>(null);
  const [ruleAttribute, setRuleAttribute] = useState<TargetingRule["attribute"]>("country");
  const [ruleOperator, setRuleOperator] = useState<TargetingOperator>("EQUALS");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleServe, setRuleServe] = useState(true);
  const [rulePriority, setRulePriority] = useState(1);
  const [savingRule, setSavingRule] = useState(false);
  const [userKey, setUserKey] = useState("user-123");
  const [country, setCountry] = useState("TR");
  const [plan, setPlan] = useState("premium");
  const [email, setEmail] = useState("");
  const [evaluation, setEvaluation] = useState<FeatureFlagEvaluation | null>(null);
  const [evaluationMs, setEvaluationMs] = useState<number | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const load = useCallback(async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const [nextFlag, nextRules] = await Promise.all([
        getFeatureFlag(environment, name),
        getTargetingRules(environment, name),
      ]);
      setFlag(nextFlag);
      setRules([...nextRules].sort((a, b) => a.priority - b.priority || a.id - b.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load targeting configuration.");
    } finally {
      setLoading(false);
    }
  }, [environment, name]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetEvaluation() {
    setEvaluation(null);
    setEvaluationMs(null);
  }

  function focusEvaluation() {
    evaluationPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => userKeyInputRef.current?.focus(), 220);
  }

  function openAddRule() {
    setEditingRule(null);
    setRuleAttribute("country");
    setRuleOperator("EQUALS");
    setRuleValue("");
    setRuleServe(true);
    setRulePriority(rules.length + 1);
    setRuleOpen(true);
  }

  function openEditRule(rule: TargetingRule) {
    setEditingRule(rule);
    setRuleAttribute(rule.attribute);
    setRuleOperator(rule.operator);
    setRuleValue(rule.comparisonValue);
    setRuleServe(rule.serveEnabled);
    setRulePriority(rule.priority);
    setRuleOpen(true);
  }

  async function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ruleValue.trim()) return;
    setSavingRule(true);
    setError(null);
    const payload: CreateTargetingRuleRequest = {
      attribute: ruleAttribute,
      operator: ruleOperator,
      comparisonValue: ruleValue.trim(),
      serveEnabled: ruleServe,
      priority: rulePriority,
    };

    try {
      if (editingRule) {
        await deleteTargetingRule(environment, name, editingRule.id);
      }
      await createTargetingRule(environment, name, payload);
      setRuleOpen(false);
      resetEvaluation();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save targeting rule.");
    } finally {
      setSavingRule(false);
    }
  }

  async function removeRule(rule: TargetingRule) {
    if (!window.confirm(`Delete rule #${rule.id}?`)) return;
    setError(null);
    try {
      await deleteTargetingRule(environment, name, rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
      resetEvaluation();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete targeting rule.");
    }
  }

  async function runEvaluation(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!userKey.trim()) {
      setError("Enter a user key before running the evaluation.");
      userKeyInputRef.current?.focus();
      return;
    }

    setEvaluating(true);
    setError(null);
    setEvaluation(null);
    setEvaluationMs(null);
    const started = performance.now();

    try {
      const result = await evaluateFeatureFlag(environment, name, {
        userKey: userKey.trim(),
        country: country.trim() || undefined,
        plan: plan.trim() || undefined,
        email: email.trim() || undefined,
      });
      setEvaluation(result);
      setEvaluationMs(Math.max(1, Math.round(performance.now() - started)));
    } catch (evaluationError) {
      setEvaluation(null);
      setEvaluationMs(null);
      setError(evaluationError instanceof Error ? evaluationError.message : "Could not evaluate feature flag.");
    } finally {
      setEvaluating(false);
    }
  }

  const matchedRule = useMemo(
    () => (evaluation?.matchedRuleId == null ? null : rules.find((rule) => rule.id === evaluation.matchedRuleId) ?? null),
    [evaluation, rules],
  );

  const matchedRuleNumber = useMemo(() => {
    if (!matchedRule) return null;
    const index = rules.findIndex((rule) => rule.id === matchedRule.id);
    return index < 0 ? null : index + 1;
  }, [matchedRule, rules]);

  if (loading && !flag) {
    return <div className="page"><div className="page-loading">Loading targeting rules…</div></div>;
  }

  if (!flag) {
    return <div className="page"><div className="page-loading error-text">{error ?? "Flag not found."}</div></div>;
  }

  return (
    <div className="page targeting-page">
      <PageHeader
        title={<span className="detail-title-row"><span>{flag.name}</span><span className="state-select-button static-state"><StatusDot enabled={flag.enabled} /> {flag.enabled ? "On" : "Off"}</span></span>}
        subtitle={<><code>{flag.name}</code><span className="detail-subtitle-copy">Targeting and evaluation controls.</span></>}
        environment={environment}
        onEnvironmentChange={(value) => {
          onEnvironmentChange(value);
          resetEvaluation();
          navigate(`/flags/${encodeURIComponent(name)}/targeting`);
        }}
      />

      <div className="breadcrumb-line"><Link to="/flags"><Icon name="arrow-left" size={16} /> Feature flags</Link><span>/</span><Link to={`/flags/${encodeURIComponent(name)}`}>{flag.name}</Link></div>

      <nav className="detail-tabs" aria-label="Flag sections">
        <Link to={`/flags/${encodeURIComponent(name)}`}>Overview</Link>
        <Link className="active" to={`/flags/${encodeURIComponent(name)}/targeting`}>Targeting</Link>
        <Link to={`/audit?flag=${encodeURIComponent(name)}&environment=${environment}`}>History</Link>
        <button type="button" disabled>Settings</button>
      </nav>

      {error ? <div className="inline-alert" role="alert">{error}<button type="button" onClick={() => setError(null)} aria-label="Dismiss"><Icon name="close" size={16} /></button></div> : null}

      <div className="targeting-layout">
        <div className="targeting-main">
          <div className="section-heading-row targeting-heading">
            <div><h2>Targeting rules</h2><p>Evaluate rules in order. The first matching rule determines the flag value.</p></div>
            <div className="section-actions"><button className="secondary-button" type="button" onClick={focusEvaluation}><Icon name="evaluation" size={17} /> Test evaluation</button><button className="primary-button" type="button" onClick={openAddRule}><Icon name="plus" size={17} /> Add rule</button></div>
          </div>

          <section className="table-shell rules-shell">
            <div className="table-scroll">
              <table className="data-table rules-table">
                <thead><tr><th>#</th><th>If (attribute)</th><th>Operator</th><th>Value</th><th>Serve</th><th>Actions</th></tr></thead>
                <tbody>
                  {rules.length === 0 ? <tr><td colSpan={6} className="table-state"><strong>No targeting rules.</strong><span>Traffic falls through to the default rollout.</span></td></tr> : rules.map((rule, index) => (
                    <tr key={rule.id}>
                      <td>{index + 1}</td>
                      <td><code className="code-token">{attributeLabel(rule.attribute)}</code></td>
                      <td>{OPERATOR_LABELS[rule.operator]}</td>
                      <td><code className="code-token">{rule.comparisonValue}</code></td>
                      <td><span className="status-inline"><StatusDot enabled={rule.serveEnabled} /> {rule.serveEnabled ? "On" : "Off"}</span></td>
                      <td><div className="rule-actions"><button className="text-button" type="button" onClick={() => openEditRule(rule)}>Edit</button><details className="row-menu"><summary aria-label={`More actions for rule ${index + 1}`}><Icon name="more-horizontal" size={18} /></summary><div className="row-menu-popover"><button className="danger-action" type="button" onClick={() => void removeRule(rule)}>Delete rule</button></div></details></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="default-rollout-section">
            <h2>Default rollout</h2>
            <p>If no rules match, use the following rollout configuration.</p>
            <div className="default-rollout-box"><span><Icon name="targeting" size={20} /> Serve <strong>{flag.enabled ? "On" : "Off"}</strong> to <strong>{flag.rolloutPercentage}%</strong> of users</span><Link to={`/flags/${encodeURIComponent(name)}`}>Edit</Link></div>
          </section>
        </div>

        <aside ref={evaluationPanelRef} className="evaluation-panel">
          <h2>Evaluation preview</h2>
          <p>Test the exact decision path for one user context.</p>
          <p className="evaluation-hint">
            {flag.enabled
              ? "Rules are checked first. Percentage rollout runs only when no rule matches."
              : "This flag is globally Off. Evaluation will return Off before checking targeting rules or rollout."}
          </p>
          <form className="evaluation-form" onSubmit={(event) => void runEvaluation(event)}>
            <label className="field-label">User key<input ref={userKeyInputRef} value={userKey} onChange={(event) => { setUserKey(event.target.value); resetEvaluation(); }} placeholder="user-123" required /></label>
            <label className="field-label">Country<input value={country} onChange={(event) => { setCountry(event.target.value); resetEvaluation(); }} placeholder="TR" /></label>
            <label className="field-label">Plan<input value={plan} onChange={(event) => { setPlan(event.target.value); resetEvaluation(); }} placeholder="premium" /></label>
            <label className="field-label optional-evaluation-field">Email<input value={email} onChange={(event) => { setEmail(event.target.value); resetEvaluation(); }} placeholder="user@example.com" /></label>
            <button className="primary-button full-width" type="submit" disabled={evaluating}>{evaluating ? "Evaluating…" : "Run evaluation"}</button>
          </form>

          <div className="evaluation-result" aria-live="polite">
            <div className="result-heading"><strong>Result</strong>{evaluation ? <span><StatusDot enabled={evaluation.enabled} /> {evaluation.enabled ? "On" : "Off"}</span> : <span className="muted-cell">Not evaluated</span>}</div>
            {evaluation ? (
              <>
                <div className={`match-box ${evaluation.enabled ? "positive" : "neutral"}`}>
                  <strong>{matchedRule && matchedRuleNumber ? `Matched rule #${matchedRuleNumber}` : reasonLabel(evaluation.reason)}</strong>
                  <code>
                    {matchedRule
                      ? `${attributeLabel(matchedRule.attribute)} ${OPERATOR_LABELS[matchedRule.operator]} ${matchedRule.comparisonValue}`
                      : evaluation.bucket >= 0
                        ? `bucket ${evaluation.bucket} · rollout ${evaluation.rolloutPercentage}%`
                        : `rollout ${evaluation.rolloutPercentage}%`}
                  </code>
                </div>
                <p className="evaluation-explanation">{evaluationExplanation(evaluation, matchedRule)}</p>
                <dl className="evaluation-request-summary">
                  <dt>User key</dt><dd><code>{userKey.trim()}</code></dd>
                  <dt>Context</dt><dd>{[country.trim() && `country=${country.trim()}`, plan.trim() && `plan=${plan.trim()}`, email.trim() && `email=${email.trim()}`].filter(Boolean).join(" · ") || "No optional attributes"}</dd>
                  <dt>Reason</dt><dd>{reasonLabel(evaluation.reason)}</dd>
                  <dt>Latency</dt><dd>{evaluationMs ?? 1} ms</dd>
                </dl>
              </>
            ) : null}
          </div>
        </aside>
      </div>

      <Modal open={ruleOpen} title={editingRule ? "Edit targeting rule" : "Add targeting rule"} description="Rules are evaluated in ascending priority order." onClose={() => setRuleOpen(false)}>
        <form className="form-stack" onSubmit={saveRule}>
          <div className="form-grid-2">
            <label className="field-label">
              Attribute
              <SelectMenu value={ruleAttribute} onChange={(value) => setRuleAttribute(value as TargetingRule["attribute"])} options={ATTRIBUTE_OPTIONS} ariaLabel="Targeting attribute" className="field-select" />
            </label>
            <label className="field-label">
              Operator
              <SelectMenu value={ruleOperator} onChange={(value) => setRuleOperator(value as TargetingOperator)} options={OPERATOR_OPTIONS} ariaLabel="Targeting operator" className="field-select" />
            </label>
          </div>
          <label className="field-label">Comparison value<input autoFocus value={ruleValue} onChange={(event) => setRuleValue(event.target.value)} placeholder="Enter comparison value" required /></label>
          <label className="field-label">Priority<input type="number" min={0} value={rulePriority} onChange={(event) => setRulePriority(Number(event.target.value))} /></label>
          <label className="switch-row"><span><strong>Serve enabled</strong><small>Return On when this rule matches.</small></span><input type="checkbox" checked={ruleServe} onChange={(event) => setRuleServe(event.target.checked)} /></label>
          {editingRule ? <p className="form-note">Saving replaces the existing rule because the backend exposes create/delete rule operations.</p> : null}
          <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setRuleOpen(false)}>Cancel</button><button type="submit" className="primary-button" disabled={savingRule}>{savingRule ? "Saving…" : editingRule ? "Save rule" : "Add rule"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
