import type { ReactNode } from "react";
import type { Environment } from "../types";
import { SelectMenu, type SelectMenuOption } from "./SelectMenu";

const ENVIRONMENT_OPTIONS: SelectMenuOption[] = [
  { value: "dev", label: "Development", description: "Local and development traffic", dotClass: "dev" },
  { value: "staging", label: "Staging", description: "Pre-production validation", dotClass: "staging" },
  { value: "prod", label: "Production", description: "Live production traffic", dotClass: "prod" },
];

export function EnvironmentSelect({
  value,
  onChange,
}: {
  value: Environment;
  onChange: (value: Environment) => void;
}) {
  return (
    <SelectMenu
      value={value}
      onChange={(nextValue) => onChange(nextValue as Environment)}
      options={ENVIRONMENT_OPTIONS}
      ariaLabel="Environment"
      className="environment-menu"
    />
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
