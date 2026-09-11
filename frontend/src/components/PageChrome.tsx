import type { ReactNode } from "react";
import type { Environment } from "../types";

export function EnvironmentSelect({
  value,
  onChange,
}: {
  value: Environment;
  onChange: (value: Environment) => void;
}) {
  return (
    <label className="environment-select-wrap">
      <span className={`environment-dot ${value}`} aria-hidden="true" />
      <span className="sr-only">Environment</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Environment)}
        aria-label="Environment"
      >
        <option value="dev">Dev</option>
        <option value="staging">Staging</option>
        <option value="prod">Production</option>
      </select>
    </label>
  );
}

export function PageHeader({
  title,
  subtitle,
  environment,
  onEnvironmentChange,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  environment?: Environment;
  onEnvironmentChange?: (value: Environment) => void;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-title-block">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="page-header-actions">
        {children}
        {environment && onEnvironmentChange ? (
          <EnvironmentSelect value={environment} onChange={onEnvironmentChange} />
        ) : null}
      </div>
    </header>
  );
}

export function StatusDot({ enabled }: { enabled: boolean }) {
  return <span className={`status-dot ${enabled ? "on" : "off"}`} aria-hidden="true" />;
}
