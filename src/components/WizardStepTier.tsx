import { useState } from "react";
import type { CoverageLevel, PlanTier } from "../types/maintenancePlan";

const tiers: PlanTier[] = ["Basic", "Silver", "Gold", "Platinum", "Commercial", "Best recommendation"];
const coverageLevels: CoverageLevel[] = ["Economy", "Standard", "Premium", "Long-term value"];

interface WizardStepTierProps {
  value: PlanTier;
  coverageLevel: CoverageLevel;
  recommendedTier: PlanTier;
  recommendationLabel: string;
  recommendationReason: string;
  onChange: (value: PlanTier) => void;
  onCoverageLevelChange: (value: CoverageLevel) => void;
}

export function WizardStepTier({
  value,
  coverageLevel,
  recommendedTier,
  recommendationLabel,
  recommendationReason,
  onChange,
  onCoverageLevelChange,
}: WizardStepTierProps) {
  const [showTierOptions, setShowTierOptions] = useState(false);

  return (
    <div className="wizard-step">
      <h2>Select a plan tier</h2>
      <p>Pick a known tier or let the assistant choose from successful plan patterns.</p>
      <div className="recommendation-callout">
        <strong>{recommendationLabel}</strong>
        <span>{recommendationReason}</span>
      </div>
      <div className="selected-summary">
        <strong>Selected tier:</strong> {value}
        {value === recommendedTier ? " (recommended)" : ""}
      </div>
      <button type="button" className="secondary-button" onClick={() => setShowTierOptions((s) => !s)}>
        {showTierOptions ? "Hide tier options" : "Change tier"}
      </button>

      {showTierOptions && (
        <div className="option-grid">
          {tiers.map((tier) => (
            <button
              className={`option-card ${value === tier ? "selected" : ""}`}
              key={tier}
              type="button"
              onClick={() => onChange(tier)}
            >
              {tier}
            </button>
          ))}
        </div>
      )}

      <div className="radio-list">
        <h3>Desired coverage level</h3>
        {coverageLevels.map((level) => (
          <label className="radio-card" key={level}>
            <input
              type="radio"
              name="coverageLevel"
              checked={coverageLevel === level}
              onChange={() => onCoverageLevelChange(level)}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
