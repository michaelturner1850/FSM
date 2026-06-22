import { useState } from "react";
import { generatePlanWithAi } from "../lib/ai";
import {
  determineServicesForCategory,
  getPlanPopularityPercent,
  recommendSeedPlans,
} from "../lib/recommendation";
import { recommendationToGeneratedPlan } from "../lib/planGenerator";
import type {
  GeneratedMaintenancePlan,
  MaintenancePlanRecommendation,
  PlanTier,
  PlanGenerationInput,
  PricingPreference,
  ServiceSchedule,
} from "../types/maintenancePlan";
import { GeneratedPlanReview } from "./GeneratedPlanReview";
import { WizardStepInstructions } from "./WizardStepInstructions";
import { WizardStepPlanCategory } from "./WizardStepPlanCategory";
import { WizardStepPricing } from "./WizardStepPricing";
import { WizardStepSchedule } from "./WizardStepSchedule";
import { WizardStepServices } from "./WizardStepServices";
import { WizardStepTier } from "./WizardStepTier";

interface BuildPlanOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (plan: GeneratedMaintenancePlan) => void;
}

const steps = ["Category", "Tier", "Services", "Schedule", "Pricing", "Instructions"];

const initialInput: PlanGenerationInput = {
  planCategory: "HVAC",
  customerSegment: "Residential",
  propertyType: "Single-family home",
  unitCount: 1,
  desiredCoverageLevel: "Standard",
  planTier: "Best recommendation",
  includedServices: determineServicesForCategory("HVAC", "Residential"),
  serviceSchedule: "Best recommendation",
  pricingPreference: "Use recommended price",
  optionalInstructions: "",
};

function getAutoRecommendations(
  planCategory: PlanGenerationInput["planCategory"],
  customerSegment: PlanGenerationInput["customerSegment"],
): {
  tier: PlanTier;
  schedule: ServiceSchedule;
  pricing: PricingPreference;
} {
  if (customerSegment === "Commercial") {
    return {
      tier: "Commercial",
      schedule: "Quarterly",
      pricing: "Use recommended price",
    };
  }

  if (planCategory === "HVAC & Plumbing") {
    return {
      tier: "Silver",
      schedule: "Seasonal",
      pricing: "Use recommended price",
    };
  }

  if (planCategory === "Plumbing") {
    return {
      tier: "Silver",
      schedule: "Once per year",
      pricing: "Use recommended price",
    };
  }

  return {
    tier: "Gold",
    schedule: "Twice per year",
    pricing: "Use recommended price",
  };
}

export function BuildPlanOverlay({ isOpen, onClose, onApprove }: BuildPlanOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState<PlanGenerationInput>(initialInput);
  const [generatedPlan, setGeneratedPlan] = useState<MaintenancePlanRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const updateInput = (partialInput: Partial<PlanGenerationInput>) => {
    setInput((current) => {
      const next = { ...current, ...partialInput };

      if (partialInput.planCategory || partialInput.customerSegment) {
        if (partialInput.customerSegment === "Residential") {
          next.propertyType = "Single-family home";
        }
        if (partialInput.customerSegment === "Commercial") {
          next.propertyType = "Office";
        }
        next.includedServices = determineServicesForCategory(next.planCategory, next.customerSegment);

        const auto = getAutoRecommendations(next.planCategory, next.customerSegment);
        next.planTier = auto.tier;
        next.serviceSchedule = auto.schedule;
        next.pricingPreference = auto.pricing;
      }
      return next;
    });
  };

  const generatePlan = async () => {
    setError("");
    if (input.annualPriceOverride !== undefined && input.annualPriceOverride <= 0) {
      setError("Annual price override must be greater than 0.");
      return;
    }

    setIsGenerating(true);
    const topSeeds = recommendSeedPlans(input);

    try {
      const plan = await generatePlanWithAi(input, topSeeds);
      setGeneratedPlan(plan);
    } catch {
      setError("Unable to generate a plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const approvePlan = () => {
    if (generatedPlan) {
      onApprove(recommendationToGeneratedPlan(input, generatedPlan));
      onClose();
    }
  };

  const canGoBack = stepIndex > 0;
  const isLastStep = stepIndex === steps.length - 1;
  const previewSeeds = recommendSeedPlans(input);
  const topPreviewSeed = previewSeeds[0];
  const auto = getAutoRecommendations(input.planCategory, input.customerSegment);
  const recommendedTier = auto.tier;
  const recommendedSchedule = auto.schedule;
  const recommendedPricing = auto.pricing;
  const topPatternPercent = topPreviewSeed ? getPlanPopularityPercent(topPreviewSeed, input) : 0;
  const categoryReason =
    input.planCategory === "HVAC"
      ? `Recommended because ${input.customerSegment.toLowerCase()} HVAC plans consistently convert well for this profile.`
      : input.planCategory === "Plumbing"
        ? `Recommended because ${input.customerSegment.toLowerCase()} plumbing plans are a strong fit for inspection-driven maintenance.`
        : `Recommended because combined HVAC + Plumbing plans perform well for whole-home maintenance and upsell coverage.`;
  const tierReason = topPreviewSeed
    ? `Recommended because ${topPreviewSeed.name} appears in about ${topPatternPercent}% of comparable contracts.`
    : "Recommended using profile signals and successful historical plan tiers.";
  const servicesReason =
    input.planCategory === "HVAC"
      ? "Recommended because these are core seasonal HVAC services with strong adoption in recurring plans."
      : input.planCategory === "Plumbing"
        ? "Recommended because these are high-value plumbing inspection and reliability services."
      : "Recommended because these services combine HVAC tune-ups with core plumbing inspection coverage.";
  const scheduleReason =
    input.customerSegment === "Commercial"
      ? "Recommended because commercial maintenance cohorts most often use quarterly or seasonal cadence."
      : input.planCategory === "Plumbing"
        ? "Recommended because annual plumbing inspection cadence is the most common maintenance motion."
      : "Recommended because seasonal visits align with spring cooling and fall heating demand.";

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="Build maintenance plan wizard">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Maintenance Plan Creation Agent</p>
            <h1>Build me a Maintenance Plan</h1>
          </div>
          <button type="button" className="icon-button" aria-label="Close wizard" onClick={onClose}>
            x
          </button>
        </header>

        {generatedPlan ? (
          <GeneratedPlanReview
            plan={generatedPlan}
            isGenerating={isGenerating}
            onRegenerate={generatePlan}
            onEditSelections={() => setGeneratedPlan(null)}
            onApprove={approvePlan}
          />
        ) : (
          <>
            <div className="step-progress" aria-label="Wizard progress">
              {steps.map((step, index) => (
                <span className={index <= stepIndex ? "active" : ""} key={step}>
                  {step}
                </span>
              ))}
            </div>

            {stepIndex === 0 && (
              <WizardStepPlanCategory
                value={input.planCategory}
                customerSegment={input.customerSegment}
                propertyType={input.propertyType}
                unitCount={input.unitCount}
                recommendationLabel={`Recommended plan category: ${input.planCategory}`}
                recommendationReason={categoryReason}
                onChange={(planCategory) => updateInput({ planCategory })}
                onCustomerSegmentChange={(customerSegment) => updateInput({ customerSegment })}
                onPropertyTypeChange={(propertyType) => updateInput({ propertyType })}
                onUnitCountChange={(unitCount) => updateInput({ unitCount })}
              />
            )}
            {stepIndex === 1 && (
              <WizardStepTier
                value={input.planTier}
                coverageLevel={input.desiredCoverageLevel}
                recommendationLabel={`Recommended tier: ${recommendedTier}`}
                recommendationReason={tierReason}
                recommendedTier={recommendedTier}
                onChange={(planTier) => updateInput({ planTier })}
                onCoverageLevelChange={(desiredCoverageLevel) => updateInput({ desiredCoverageLevel })}
              />
            )}
            {stepIndex === 2 && (
              <WizardStepServices
                category={input.planCategory}
                value={input.includedServices}
                recommendationLabel={`Recommended services for ${input.planCategory}`}
                recommendationReason={servicesReason}
                onChange={(includedServices) => updateInput({ includedServices })}
              />
            )}
            {stepIndex === 3 && (
              <WizardStepSchedule
                value={input.serviceSchedule}
                recommendationLabel={`Recommended schedule: ${recommendedSchedule}`}
                recommendationReason={scheduleReason}
                recommendedSchedule={recommendedSchedule}
                onChange={(serviceSchedule) => updateInput({ serviceSchedule })}
              />
            )}
            {stepIndex === 4 && (
              <WizardStepPricing
                pricingPreference={input.pricingPreference}
                annualPriceOverride={input.annualPriceOverride}
                recommendationLabel={`Recommended pricing mode: ${recommendedPricing}`}
                recommendationReason="Recommended because this aligns to historical close rates while keeping pricing editable for your business."
                recommendedPreference={recommendedPricing}
                onPreferenceChange={(pricingPreference) => updateInput({ pricingPreference })}
                onOverrideChange={(annualPriceOverride) => updateInput({ annualPriceOverride })}
              />
            )}
            {stepIndex === 5 && (
              <WizardStepInstructions
                value={input.optionalInstructions || ""}
                onChange={(optionalInstructions) => updateInput({ optionalInstructions })}
              />
            )}

            {error && <div className="error-banner">{error}</div>}

            <footer className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={!canGoBack}
                onClick={() => setStepIndex((current) => current - 1)}
              >
                Back
              </button>
              {isLastStep ? (
                <button type="button" className="primary-button" onClick={generatePlan} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Plan"}
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setStepIndex((current) => current + 1)}
                >
                  Next
                </button>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
