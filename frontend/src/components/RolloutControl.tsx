import type { CSSProperties } from "react";

const PRESETS = [0, 25, 50, 100];

function clampRollout(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function RolloutControl({
  value,
  onChange,
  label = "Rollout",
  caption = "Percentage of users who can receive the flag when no targeting rule matches.",
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  caption?: string;
}) {
  const safeValue = clampRollout(value);
  const displayLabel = label === "Initial rollout" ? "Default rollout" : label;
  const sliderStyle = { "--rollout-value": `${safeValue}%` } as CSSProperties;

  return (
    <div className="rollout-control">
      <div className="rollout-control-header">
        <div>
          <span className="rollout-control-label">{displayLabel}</span>
          <small className="rollout-control-caption">{caption}</small>
        </div>
        <label className="rollout-value-field">
          <span className="sr-only">{displayLabel} percentage</span>
          <input
            type="number"
            min={0}
            max={100}
            value={safeValue}
            onChange={(event) => onChange(clampRollout(Number(event.target.value)))}
          />
          <span aria-hidden="true">%</span>
        </label>
      </div>

      <div className="rollout-slider-wrap">
        <input
          className="rollout-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={safeValue}
          style={sliderStyle}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={`${displayLabel} percentage`}
        />
      </div>

      <div className="rollout-presets" aria-label="Rollout presets">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={safeValue === preset ? "active" : ""}
            onClick={() => onChange(preset)}
          >
            {preset}%
          </button>
        ))}
      </div>
    </div>
  );
}
