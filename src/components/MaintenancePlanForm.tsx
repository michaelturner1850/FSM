import type { MaintenancePlanFormValues } from "../types/maintenancePlan";

interface MaintenancePlanFormProps {
  values: MaintenancePlanFormValues;
  onChange: (values: MaintenancePlanFormValues) => void;
  onSave: (values: MaintenancePlanFormValues) => void;
}

export function MaintenancePlanForm({ values, onChange, onSave }: MaintenancePlanFormProps) {
  const updateField = <K extends keyof MaintenancePlanFormValues>(
    field: K,
    value: MaintenancePlanFormValues[K],
  ) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <section className="form-card" aria-label="New Maintenance Plan form">
      <div className="form-header">
        <div>
          <p className="eyebrow">Payzer Maintenance Plans</p>
          <h1>New Maintenance Plan</h1>
        </div>
        <span className="draft-badge">Draft</span>
      </div>

      <div className="form-grid">
        <label>
          Plan Name
          <input
            value={values.planName}
            onChange={(event) => updateField("planName", event.target.value)}
            placeholder="Example: Gold Comfort Maintenance Plan"
          />
        </label>

        <label>
          QuickBooks Item Name
          <input
            value={values.quickBooksItemName}
            onChange={(event) => updateField("quickBooksItemName", event.target.value)}
            placeholder="Maintenance Plan"
          />
        </label>

        <label className="full-span">
          Plan Description
          <textarea
            value={values.planDescription}
            maxLength={3000}
            onChange={(event) => updateField("planDescription", event.target.value)}
            placeholder="Describe what's included in the plan."
            rows={6}
          />
          <span className="helper-text">{values.planDescription.length}/3000 characters</span>
        </label>

        <label>
          Color Code
          <div className="color-input-row">
            <input
              value={values.colorCode}
              onChange={(event) => updateField("colorCode", event.target.value)}
              placeholder="#2563eb"
            />
            <span className="color-swatch" style={{ backgroundColor: values.colorCode || "#e2e8f0" }} />
          </div>
        </label>

        <label>
          Contract Length
          <input
            value={values.contractLength}
            onChange={(event) => updateField("contractLength", event.target.value)}
            placeholder="12 Months"
          />
        </label>

        <label>
          Annual Price
          <input
            type="number"
            min="1"
            value={values.annualPrice}
            onChange={(event) => updateField("annualPrice", event.target.value)}
            placeholder="340"
          />
        </label>

        <label>
          Account
          <input
            value={values.account}
            onChange={(event) => updateField("account", event.target.value)}
            placeholder="Maintenance Plan Revenue"
          />
        </label>

        <label>
          Class
          <input
            value={values.className}
            onChange={(event) => updateField("className", event.target.value)}
            placeholder="Residential HVAC"
          />
        </label>

        <label>
          Collect Tax?
          <select
            value={values.collectTax}
            onChange={(event) => updateField("collectTax", event.target.value as "Yes" | "No")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </label>

        <label className="full-span">
          Terms / Editable Terms
          <textarea
            value={values.editableTerms}
            onChange={(event) => updateField("editableTerms", event.target.value)}
            placeholder="Add editable agreement terms."
            rows={5}
          />
        </label>
      </div>

      {values.serviceWindows && (
        <div className="service-window-note">
          <strong>Service Windows:</strong> {values.serviceWindows}
        </div>
      )}

      <div className="form-save-row">
        <button
          type="button"
          className="primary-button"
          disabled={!values.planName.trim()}
          onClick={() => onSave(values)}
        >
          Save Plan
        </button>
        <span className="helper-text">All fields are editable before saving.</span>
      </div>
    </section>
  );
}
