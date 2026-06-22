import { generateMaintenanceRecommendation } from "./planGenerator";
import type {
  MaintenancePlanRecommendation,
  MaintenancePlanSeed,
  PlanGenerationInput,
} from "../types/maintenancePlan";

const systemPrompt =
  "You are an expert FSM maintenance plan consultant for HVAC and plumbing businesses. Your job is to generate a practical maintenance plan template based on successful maintenance plan patterns. Do not copy source plans verbatim. Create a clear, editable recommendation. Return valid JSON only.";

export async function generatePlanWithAi(
  input: PlanGenerationInput,
  topSeedPlans: MaintenancePlanSeed[],
): Promise<MaintenancePlanRecommendation> {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  const mockOnly = import.meta.env.VITE_FEATURE_MOCK_ONLY === "true";

  if (!proxyUrl || mockOnly) {
    return generateMaintenanceRecommendation(input, topSeedPlans);
  }

  try {
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt: buildUserPrompt(input, topSeedPlans),
        schema: "MaintenancePlanRecommendation",
      }),
    });

    if (!response.ok) {
      throw new Error(`AI proxy returned ${response.status}`);
    }

    const payload = await response.json();
    const rawPlan = typeof payload === "string" ? JSON.parse(payload) : payload.plan ?? payload;
    return rawPlan as MaintenancePlanRecommendation;
  } catch (error) {
    console.warn("Falling back to mock maintenance plan generation", error);
    return generateMaintenanceRecommendation(input, topSeedPlans);
  }
}

export function buildUserPrompt(input: PlanGenerationInput, topSeedPlans: MaintenancePlanSeed[]) {
  return JSON.stringify(
    {
      instructions: [
        "Act like a maintenance plan expert for HVAC and plumbing contractors.",
        "Use selected options, customer context, and top matching seed plans.",
        "Generate a practical plan a contractor can edit and save.",
        "Avoid copying seed plan text word-for-word.",
        "Keep planDescription under 3,000 characters.",
        "Use plain customer-friendly language.",
        "Do not provide legal advice.",
        "Return JSON only.",
      ],
      selectedPlanCategory: input.planCategory,
      customerSegment: input.customerSegment,
      propertyType: input.propertyType,
      unitCount: input.unitCount,
      desiredCoverageLevel: input.desiredCoverageLevel,
      selectedTier: input.planTier,
      selectedIncludedServices: input.includedServices,
      selectedServiceSchedule: input.serviceSchedule,
      pricingPreference: input.pricingPreference,
      annualPriceOverride: input.annualPriceOverride,
      optionalUserInstructions: input.optionalInstructions,
      // Populated in Phase 2 when Context Data API is wired
      customerAndCompanyContext: input.contextPayload ?? null,
      topMatchingSeedPlans: topSeedPlans,
      requiredShape: {
        recommendation_id: "string",
        plan_type: "string",
        plan_name: "string",
        coverage_level: "Economy | Standard | Premium | Long-term value",
        contract_length_years: "number",
        service_frequency: {
          visits_per_year: "number",
          appointment_duration_minutes: "number",
          service_windows: "array",
        },
        included_services: "string[]",
        excluded_services: "string[]",
        pricing: {
          annual_price: "number",
          computed_annual_total: "number",
          billing_frequency: "annual | monthly",
          collect_tax: "boolean",
        },
        optional_addons: "array",
        terms_and_conditions: "string",
        recommendation_explanation: "string",
        confidence: "number",
        similar_historical_plans: "array",
      },
    },
    null,
    2,
  );
}
