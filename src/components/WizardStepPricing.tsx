import { useState } from "react";
import type { PricingPreference } from "../types/maintenancePlan";

const pricingOptions: PricingPreference[] = ["Use recommended price", "Lower-cost plan", "Premium plan"];

interface WizardStepPricingProps {
  pricingPreference: PricingPreference;
  annualPriceOverride?: number;
  recommendationLabel: string;
  recommendationReason: string;
  recommendedPreference: PricingPreference;
  onPreferenceChange: (value: PricingPreference) => void;
  onOverrideChange: (value: number | undefined) => void;
}

export function WizardStepPricing({
  pricingPreference,
  annualPriceOverride,
  recommendationLabel,
  recommendationReason,
  recommendedPreference,
  onPreferenceChange,
  onOverrideChange,
}: WizardStepPricingProps) {
  const [showPricingOptions, setShowPricingOptions] = useState(false);

  return (
    <div className="wizard-step">
      <h2>How should pricing be handled?</h2>
      <p>Use seed-based pricing or enter a specific annual price.</p>
      <div className="recommendation-callout">
        <strong>{recommendationLabel}</strong>
        <span>{recommendationReason}</span>
      </div>
      <div className="selected-summary">
        <strong>Selected pricing mode:</strong> {pricingPreference}
        {pricingPreference === recommendedPreference ? " (recommended)" : ""}
      </div>
      <button type="button" className="secondary-button" onClick={() => setShowPricingOptions((s) => !s)}>
        {showPricingOptions ? "Hide pricing options" : "Change pricing"}
      </button>

      {showPricingOptions && (
        <>
          <div className="radio-list">
            {pricingOptions.map((option) => (
              <label className="radio-card" key={option}>
                <input
                  type="radio"
                  name="pricingPreference"
                  checked={pricingPreference === option}
                  onChange={() => onPreferenceChange(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <label className="wizard-field">
            Optional annual price override
            <input
              type="number"
              min="1"
              value={annualPriceOverride ?? ""}
              onChange={(event) => {
                const value = Number(event.target.value);
                onOverrideChange(value > 0 ? value : undefined);
              }}
              placeholder="Example: 340"
            />
          </label>
        </>
      )}
    </div>
  );
}
