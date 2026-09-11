import type { SVGProps } from "react";

export type IconName =
  | "brand-mark"
  | "flags"
  | "audit-log"
  | "api"
  | "targeting"
  | "evaluation"
  | "settings"
  | "docs"
  | "repository"
  | "external-link"
  | "project"
  | "environment"
  | "search"
  | "filter"
  | "sort"
  | "columns"
  | "plus"
  | "minus"
  | "copy"
  | "more-horizontal"
  | "chevron-down"
  | "chevron-right"
  | "arrow-left"
  | "check"
  | "close"
  | "trash"
  | "edit"
  | "activity"
  | "history"
  | "key"
  | "refresh"
  | "terminal"
  | "code"
  | "warning"
  | "info"
  | "lock"
  | "bolt";

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  title?: string;
};

export function Icon({ name, size = 20, title, className, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      className={className}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <use href={`/icons/flagtether-icons.svg#ft-${name}`} />
    </svg>
  );
}
