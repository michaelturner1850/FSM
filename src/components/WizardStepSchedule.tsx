import { useState } from "react";
import type { ServiceSchedule } from "../types/maintenancePlan";

const schedules: ServiceSchedule[] = [
  "Once per year",
  "Twice per year",
  "Quarterly",
  "Seasonal",
  "Custom",
  "Best recommendation",
];

interface WizardStepScheduleProps {
  value: ServiceSchedule;
  recommendedSchedule: ServiceSchedule;
  recommendationLabel: string;
  recommendationReason: string;
  onChange: (value: ServiceSchedule) => void;
}

export function WizardStepSchedule({
  value,
  recommendedSchedule,
  recommendationLabel,
  recommendationReason,
  onChange,
}: WizardStepScheduleProps) {
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  return (
    <div className="wizard-step">
      <h2>How often should service happen?</h2>
      <p>Pick a cadence for the plan visits and reminders.</p>
      <div className="recommendation-callout">
        <strong>{recommendationLabel}</strong>
        <span>{recommendationReason}</span>
      </div>
      <div className="selected-summary">
        <strong>Selected schedule:</strong> {value}
        {value === recommendedSchedule ? " (recommended)" : ""}
      </div>
      <button type="button" className="secondary-button" onClick={() => setShowScheduleOptions((s) => !s)}>
        {showScheduleOptions ? "Hide schedule options" : "Change schedule"}
      </button>
      {showScheduleOptions && (
        <div className="radio-list">
          {schedules.map((schedule) => (
            <label className="radio-card" key={schedule}>
              <input
                type="radio"
                name="serviceSchedule"
                checked={value === schedule}
                onChange={() => onChange(schedule)}
              />
              <span>{schedule}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
