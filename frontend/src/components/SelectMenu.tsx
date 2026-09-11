import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

export type SelectMenuOption = {
  value: string;
  label: string;
  description?: string;
  dotClass?: "dev" | "staging" | "prod";
};

export function SelectMenu({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  ariaLabel: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDetailsElement>(null);
  const current = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    function closeWhenClickingOutside(event: PointerEvent) {
      const root = rootRef.current;
      if (root?.open && !root.contains(event.target as Node)) {
        root.open = false;
      }
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      const root = rootRef.current;
      if (event.key === "Escape" && root?.open) {
        root.open = false;
        root.querySelector<HTMLElement>("summary")?.focus();
      }
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function choose(nextValue: string) {
    onChange(nextValue);
    if (rootRef.current) rootRef.current.open = false;
    rootRef.current?.querySelector<HTMLElement>("summary")?.focus();
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button[role='option']"),
    );
    if (buttons.length === 0) return;

    event.preventDefault();
    const activeIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = activeIndex;

    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;
    if (event.key === "ArrowDown") nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % buttons.length;
    if (event.key === "ArrowUp") nextIndex = activeIndex < 0 ? buttons.length - 1 : (activeIndex - 1 + buttons.length) % buttons.length;

    buttons[nextIndex]?.focus();
  }

  return (
    <details ref={rootRef} className={`select-menu ${className}`.trim()}>
      <summary className="select-menu-trigger" aria-label={ariaLabel}>
        {current?.dotClass ? <span className={`environment-dot ${current.dotClass}`} aria-hidden="true" /> : null}
        <span className="select-menu-value">{current?.label ?? "Select"}</span>
        <Icon name="chevron-down" size={14} className="select-menu-chevron" />
      </summary>

      <div className="select-menu-popover" role="listbox" aria-label={ariaLabel} onKeyDown={handleListKeyDown}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              className={`select-menu-option ${selected ? "selected" : ""}`}
              onClick={() => choose(option.value)}
            >
              {option.dotClass ? <span className={`environment-dot ${option.dotClass}`} aria-hidden="true" /> : null}
              <span className="select-menu-option-copy">
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
              </span>
              <Icon name="check" size={15} className="select-menu-check" />
            </button>
          );
        })}
      </div>
    </details>
  );
}
