import { useMemo, useState } from "react";
import type { IncludedService, PlanCategory } from "../types/maintenancePlan";

const hvacServices: IncludedService[] = [
  "AC maintenance",
  "Furnace maintenance",
  "Filter changes",
  "Unit cleaning",
  "Safety inspection",
  "CO2 check",
  "Gas leak / gas pressure check",
  "Refrigerant check",
  "Priority service",
  "After-hours discount",
  "Parts and labor discount",
  "No trip charge",
  "No overtime fee",
];

const plumbingServices: IncludedService[] = [
  "Plumbing inspection",
  "Water heater flush",
  "Leak detection",
  "Valve check",
  "Water pressure test",
  "Priority service",
  "After-hours discount",
  "No trip charge",
];

interface WizardStepServicesProps {
  category: PlanCategory;
  value: IncludedService[];
  recommendationLabel: string;
  recommendationReason: string;
  onChange: (value: IncludedService[]) => void;
}

export function WizardStepServices({
  category,
  value,
  recommendationLabel,
  recommendationReason,
  onChange,
}: WizardStepServicesProps) {
  const [showMoreServices, setShowMoreServices] = useState(false);

  const toggleService = (service: IncludedService) => {
    onChange(value.includes(service) ? value.filter((item) => item !== service) : [...value, service]);
  };

  const groupedServices: { heading: string; items: IncludedService[] }[] =
    category === "HVAC"
      ? [{ heading: "HVAC services", items: hvacServices }]
      : category === "Plumbing"
        ? [{ heading: "Plumbing services", items: plumbingServices }]
      : [
          { heading: "HVAC services", items: hvacServices },
          { heading: "Plumbing services", items: plumbingServices },
        ];

  const availableServices = useMemo(
    () =>
      groupedServices
        .flatMap((group) => group.items)
        .filter((service, index, arr) => arr.indexOf(service) === index),
    [groupedServices],
  );
  const selectedServices = value.filter((service) => availableServices.includes(service));
  const remainingServicesByGroup = groupedServices.map((group) => ({
    ...group,
    items: group.items.filter((service) => !selectedServices.includes(service)),
  }));

  return (
    <div className="wizard-step">
      <h2>Which services should be included?</h2>
      <p>
        Services are grouped by your selected category ({category}) and pre-filled with common high-conversion
        options.
      </p>
      <div className="recommendation-callout">
        <strong>{recommendationLabel}</strong>
        <span>{recommendationReason}</span>
      </div>

      <div>
        <h3>Selected services</h3>
        <div className="selected-services-grid">
          {selectedServices.map((service) => (
            <label className="checkbox-card" key={service}>
              <input
                type="checkbox"
                checked={true}
                onChange={() => toggleService(service)}
              />
              <span>{service}</span>
            </label>
          ))}
          {selectedServices.length === 0 && <p className="muted-note">No services selected yet.</p>}
        </div>
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => setShowMoreServices((show) => !show)}
      >
        {showMoreServices ? "Hide additional services" : "Add more services"}
      </button>

      {showMoreServices &&
        remainingServicesByGroup.map((group) =>
          group.items.length > 0 ? (
            <div key={group.heading}>
              <h3>{group.heading}</h3>
              <div className="checkbox-grid">
                {group.items.map((service) => (
                  <label className="checkbox-card" key={service}>
                    <input
                      type="checkbox"
                      checked={value.includes(service)}
                      onChange={() => toggleService(service)}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null,
        )}

    </div>
  );
}
