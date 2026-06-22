import type { CustomerSegment, PlanCategory } from "../types/maintenancePlan";

const categories: PlanCategory[] = ["HVAC", "Plumbing", "HVAC & Plumbing"];
const residentialPropertyTypes = [
  "Single-family home",
  "Condo",
  "Townhome",
  "Multi-family",
];
const commercialPropertyTypes = [
  "Office",
  "Retail",
  "Industrial",
  "Mixed-use",
];

interface WizardStepPlanCategoryProps {
  value: PlanCategory;
  customerSegment: CustomerSegment;
  propertyType: string;
  unitCount: number;
  recommendationLabel: string;
  recommendationReason: string;
  onChange: (value: PlanCategory) => void;
  onCustomerSegmentChange: (value: CustomerSegment) => void;
  onPropertyTypeChange: (value: string) => void;
  onUnitCountChange: (value: number) => void;
}

export function WizardStepPlanCategory({
  value,
  customerSegment,
  propertyType,
  unitCount,
  recommendationLabel,
  recommendationReason,
  onChange,
  onCustomerSegmentChange,
  onPropertyTypeChange,
  onUnitCountChange,
}: WizardStepPlanCategoryProps) {
  return (
    <div className="wizard-step">
      <h2>What kind of plan are you building?</h2>
      <p>Choose the grouped plan category, then set customer profile details.</p>
      <div className="recommendation-callout">
        <strong>{recommendationLabel}</strong>
        <span>{recommendationReason}</span>
      </div>
      <div className="option-grid">
        {categories.map((category) => (
          <button
            className={`option-card ${value === category ? "selected" : ""}`}
            key={category}
            type="button"
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="profile-grid">
        <label className="wizard-field">
          Customer segment
          <select
            value={customerSegment}
            onChange={(event) => onCustomerSegmentChange(event.target.value as CustomerSegment)}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
          </select>
        </label>

        <label className="wizard-field">
          Property type
          <select
            value={propertyType}
            onChange={(event) => onPropertyTypeChange(event.target.value)}
          >
            {(customerSegment === "Residential" ? residentialPropertyTypes : commercialPropertyTypes).map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="wizard-field">
          Unit count
          <input
            type="number"
            min={1}
            value={unitCount}
            onChange={(event) => {
              const count = Number(event.target.value);
              onUnitCountChange(Number.isFinite(count) && count > 0 ? count : 1);
            }}
          />
        </label>
      </div>
    </div>
  );
}
