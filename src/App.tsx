import { useState } from "react";
import { BuildPlanOverlay } from "./components/BuildPlanOverlay";
import { MaintenancePlanForm } from "./components/MaintenancePlanForm";
import type { GeneratedMaintenancePlan, MaintenancePlanFormValues } from "./types/maintenancePlan";

const emptyForm: MaintenancePlanFormValues = {
  planName: "",
  quickBooksItemName: "",
  planDescription: "",
  colorCode: "",
  contractLength: "12 Months",
  annualPrice: "",
  account: "",
  className: "",
  collectTax: "No",
  editableTerms: "",
  serviceWindows: "",
};

function App() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [formValues, setFormValues] = useState<MaintenancePlanFormValues>(emptyForm);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const handleSave = (values: MaintenancePlanFormValues) => {
    try {
      const key = "fsm:maintenancePlans";
      const current = localStorage.getItem(key);
      const savedPlans = current ? (JSON.parse(current) as MaintenancePlanFormValues[]) : [];
      savedPlans.unshift(values);
      localStorage.setItem(key, JSON.stringify(savedPlans.slice(0, 50)));
      setSaveStatus(`Saved locally (${savedPlans.length} total draft plan${savedPlans.length === 1 ? "" : "s"}).`);
    } catch {
      setSaveStatus("Unable to save locally. Verify browser storage access.");
    }
  };

  const populateForm = (plan: GeneratedMaintenancePlan) => {
    setFormValues({
      planName: plan.planName,
      quickBooksItemName: plan.quickBooksItemName,
      planDescription: plan.planDescription,
      colorCode: plan.colorCode,
      contractLength: "12 Months",
      annualPrice: String(plan.annualPrice),
      account: "Maintenance Plan Revenue",
      className: plan.className,
      collectTax: plan.collectTax,
      editableTerms: plan.editableTerms,
      serviceWindows: plan.serviceWindows,
    });
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">WEX FSM / Payzer POC</p>
          <h1>New Maintenance Plan</h1>
          <p>
            Use a guided AI workflow to draft plan details from successful maintenance plan patterns,
            then approve the recommendation to populate the editable form.
          </p>
        </div>
        <button className="primary-button hero-button" type="button" onClick={() => setIsOverlayOpen(true)}>
          Build me a Maintenance Plan
        </button>
      </section>

      <MaintenancePlanForm values={formValues} onChange={setFormValues} onSave={handleSave} />
      {saveStatus && (
        <div className="service-window-note">
          <strong>Save status:</strong> {saveStatus}
        </div>
      )}

      <BuildPlanOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        onApprove={populateForm}
      />
    </main>
  );
}

export default App;
