import type {
  GeneratedMaintenancePlan,
  IncludedService,
  MaintenancePlanRecommendation,
  MaintenancePlanSeed,
  PlanGenerationInput,
} from "../types/maintenancePlan";
import { determineServicesForCategory, getPlanPopularityPercent } from "./recommendation";

export function generateMaintenanceRecommendation(
  input: PlanGenerationInput,
  topSeedPlans: MaintenancePlanSeed[],
): MaintenancePlanRecommendation {
  const instructions = parseInstructions(input.optionalInstructions);

  let selectedServices = input.includedServices.length
    ? input.includedServices
    : determineServicesForCategory(input.planCategory, input.customerSegment);

  if (instructions.addPriorityService && !selectedServices.includes("Priority service")) {
    selectedServices = [...selectedServices, "Priority service"];
  }
  if (instructions.addPlumbingInspection && !selectedServices.includes("Plumbing inspection")) {
    selectedServices = [...selectedServices, "Plumbing inspection"];
  }

  const seed = topSeedPlans[0];
  const tier = resolveTier(input, seed) as Exclude<PlanGenerationInput["planTier"], "Best recommendation">;
  const coverageLevel = input.desiredCoverageLevel;
  const contractLengthYears = resolveContractLengthYears(input, tier);
  const visitsPerYear = resolveVisitsPerYear(input);
  const totalVisits = contractLengthYears > 1 ? visitsPerYear * contractLengthYears : undefined;

  let basePrice = input.annualPriceOverride || resolvePrice(input, topSeedPlans);
  if (instructions.priceCap !== undefined && basePrice > instructions.priceCap) {
    basePrice = instructions.priceCap;
  } else if (instructions.pricingMultiplier !== undefined) {
    basePrice = Math.round(basePrice * instructions.pricingMultiplier);
  }
  const annualPrice = clampPrice(basePrice * Math.max(1, input.unitCount * 0.55));
  const discountPercent = resolveDiscount(input, selectedServices, tier, seed);
  const serviceWindows = resolveServiceWindows(input, seed, visitsPerYear);
  const planName = buildPlanName(input, tier);
  const excludedServices = resolveExcludedServices(input.planCategory);

  const recommendation: MaintenancePlanRecommendation = {
    recommendation_id: `rec_${input.planCategory === "HVAC" ? "hvac" : input.planCategory === "Plumbing" ? "plumbing" : "combo"}_${input.customerSegment.toLowerCase()}_${Date.now().toString().slice(-4)}`,
    plan_type:
      input.planCategory === "HVAC"
        ? `${input.customerSegment} HVAC`
        : input.planCategory === "Plumbing"
          ? `${input.customerSegment} Plumbing`
        : `${input.customerSegment} HVAC + Plumbing`,
    plan_name: planName,
    coverage_level: coverageLevel,
    contract_length_years: contractLengthYears,
    service_frequency: {
      visits_per_year: visitsPerYear,
      appointment_duration_minutes: input.customerSegment === "Commercial" ? 120 : 90,
      ...(totalVisits ? { total_visits: totalVisits } : {}),
      service_windows: serviceWindows,
    },
    included_services: selectedServices.map(formatServiceText),
    excluded_services: excludedServices,
    pricing:
      input.unitCount > 1 && coverageLevel === "Economy"
        ? {
            annual_price_first_unit: annualPrice,
            annual_price_additional_units: Math.round(annualPrice * 0.85),
            computed_annual_total:
              annualPrice + Math.round(annualPrice * 0.85) * Math.max(0, input.unitCount - 1),
            billing_frequency: "annual",
            collect_tax: input.planCategory !== "HVAC",
            pricing_note: `Tiered multi-unit pricing for ${input.unitCount} units.`,
          }
        : {
            annual_price: annualPrice,
            computed_annual_total: annualPrice,
            billing_frequency: "annual",
            collect_tax: input.planCategory !== "HVAC",
          },
    optional_addons: buildOptionalAddons(input.planCategory),
    terms_and_conditions: buildTerms(contractLengthYears, annualPrice, visitsPerYear),
    recommendation_explanation: buildRecommendationExplanation(input, topSeedPlans),
    confidence: resolveConfidence(input, topSeedPlans),
    similar_historical_plans: topSeedPlans.map((seed) => ({
      plan_name: seed.name,
      popularity_percent: getPlanPopularityPercent(seed, input),
      annual_price: seed.price,
    })),
  };

  return recommendation;
}

export function validateGeneratedPlan(plan: GeneratedMaintenancePlan): GeneratedMaintenancePlan {
  const annualPrice = Number(plan.annualPrice);
  const discountPercent = Number(plan.discountPercent);

  return {
    ...plan,
    planName: plan.planName.trim() || "Recommended Maintenance Plan",
    quickBooksItemName: plan.quickBooksItemName.trim() || "Maintenance Plan",
    planDescription: trimDescription(plan.planDescription),
    contractLength: "12 Months",
    annualPrice: annualPrice > 0 ? annualPrice : 1,
    account: plan.account || "Maintenance Plan Revenue",
    className: plan.className || "Maintenance Plans",
    collectTax: plan.collectTax === "Yes" ? "Yes" : "No",
    discountPercent: Math.min(15, Math.max(0, Number.isFinite(discountPercent) ? discountPercent : 0)),
  };
}

function resolveTier(input: PlanGenerationInput, seed?: MaintenancePlanSeed) {
  if (input.planTier !== "Best recommendation") {
    return input.planTier;
  }
  if (seed?.tier) {
    return seed.tier;
  }
  return input.customerSegment === "Commercial" ? "Commercial" : "Gold";
}

function resolvePrice(input: PlanGenerationInput, topSeedPlans: MaintenancePlanSeed[]) {
  if (topSeedPlans.length > 0) {
    const average = topSeedPlans.reduce((total, seed) => total + seed.price, 0) / topSeedPlans.length;
    return applyPricingPreference(Math.round(average), input.pricingPreference);
  }

  const category = input.planCategory;
  const tier = input.planTier;
  let price = 250;

  if (category === "HVAC") {
    price = tier === "Platinum" ? 480 : tier === "Gold" ? 340 : tier === "Silver" || tier === "Basic" ? 225 : 340;
    if (input.customerSegment === "Commercial") {
      price = tier === "Commercial" || tier === "Best recommendation" ? 2400 : 2040;
    }
  } else if (category === "Plumbing") {
    price = input.customerSegment === "Commercial"
      ? tier === "Commercial" ? 795 : 595
      : input.includedServices.includes("Water heater flush") ? 195 : 99;
  } else if (category === "HVAC & Plumbing") {
    price = input.customerSegment === "Commercial"
      ? tier === "Commercial" ? 1800 : 1450
      : tier === "Platinum" ? 620 : tier === "Gold" ? 495 : 390;
  } else {
    price = 695;
  }

  return applyPricingPreference(price, input.pricingPreference);
}

function applyPricingPreference(price: number, preference: PlanGenerationInput["pricingPreference"]) {
  if (preference === "Lower-cost plan") {
    return Math.round(price * 0.85);
  }
  if (preference === "Premium plan") {
    return Math.round(price * 1.18);
  }
  return price;
}

function resolveDiscount(
  input: PlanGenerationInput,
  selectedServices: IncludedService[],
  tier: string,
  seed?: MaintenancePlanSeed,
) {
  if (selectedServices.includes("Parts and labor discount") || selectedServices.includes("Priority service")) {
    return tier === "Platinum" ? 15 : tier === "Gold" ? 10 : 10;
  }
  if (input.customerSegment === "Commercial") {
    return seed?.discountPercent || 5;
  }
  return seed?.discountPercent ?? (tier === "Basic" ? 0 : 10);
}

function resolveServiceWindows(input: PlanGenerationInput, seed: MaintenancePlanSeed | undefined, visitsPerYear: number) {
  if (input.serviceSchedule === "Quarterly") {
    return [
      { job_name: "Q1 Maintenance Visit", start_month: 1, end_month: 3 },
      { job_name: "Q2 Maintenance Visit", start_month: 4, end_month: 6 },
      { job_name: "Q3 Maintenance Visit", start_month: 7, end_month: 9 },
      { job_name: "Q4 Maintenance Visit", start_month: 10, end_month: 12 },
    ];
  }

  if (input.planCategory === "HVAC" && visitsPerYear === 2) {
    return [
      { job_name: "Spring AC Check-Up", start_month: 3, end_month: 9 },
      { job_name: "Fall Heating Check-Up", start_month: 10, end_month: 2 },
    ];
  }

  if (input.planCategory === "Plumbing") {
    return [
      {
        job_name: "Annual Plumbing Inspection",
        start_month: 1,
        end_month: 12,
      },
    ];
  }

  if (input.planCategory === "HVAC & Plumbing" && visitsPerYear === 2) {
    return [
      { job_name: "First Maintenance Visit (Spring)", start_month: 3, end_month: 4 },
      { job_name: "Last Maintenance Visit (Fall)", start_month: 9, end_month: 10 },
    ];
  }

  return [
    {
      job_name: visitsPerYear === 1 ? "Annual Tune-Up Visit" : "Planned Maintenance Visit",
      start_month: 1,
      end_month: 12,
      ...(seed ? { scheduling_note: `Patterned after ${seed.name}` } : {}),
    },
  ];
}

function buildPlanName(input: PlanGenerationInput, tier: string) {
  if (input.planCategory === "HVAC" && input.customerSegment === "Residential" && tier === "Gold") {
    return "Gold Comfort Maintenance Plan";
  }
  if (input.planCategory === "Plumbing") {
    return input.customerSegment === "Commercial"
      ? "Commercial Plumbing Maintenance Agreement"
      : "Residential Plumbing Service Agreement";
  }
  if (input.planCategory === "HVAC & Plumbing") {
    return input.unitCount > 1
      ? "Annual Preventative Tune-Up Agreement (Multi-Unit)"
      : "Twice-A-Year Whole-Home Maintenance Contract";
  }
  if (input.customerSegment === "Commercial") {
    return `${tier === "Commercial" ? "Commercial" : tier} Maintenance Agreement`;
  }
  return `${tier} Maintenance Plan`;
}

function resolveColor(tier: string, category: PlanGenerationInput["planCategory"]) {
  if (tier === "Platinum") {
    return "#64748b";
  }
  if (tier === "Gold") {
    return "#d97706";
  }
  if (tier === "Silver") {
    return "#94a3b8";
  }
  if (category === "HVAC & Plumbing") {
    return "#0ea5e9";
  }
  return "#2563eb";
}

function buildTerms(contractLengthYears: number, annualPrice: number, visitsPerYear: number) {
  return `${contractLengthYears}-year agreement billed at $${annualPrice.toLocaleString()} annually. This plan includes ${visitsPerYear} scheduled maintenance visit(s) per year. Customer is responsible for scheduling within the service windows. Repairs identified during visits are quoted separately.`;
}

function buildRecommendationExplanation(input: PlanGenerationInput, topSeedPlans: MaintenancePlanSeed[]) {
  const top = topSeedPlans[0];
  const topPercent = top ? getPlanPopularityPercent(top, input) : 0;
  const cohortLabel =
    input.planCategory === "HVAC"
      ? `${input.customerSegment.toLowerCase()} HVAC`
      : input.planCategory === "Plumbing"
        ? `${input.customerSegment.toLowerCase()} plumbing`
      : `${input.customerSegment.toLowerCase()} HVAC + plumbing`;
  return `This recommendation matches high-performing ${cohortLabel} maintenance patterns in your historical data. ${
    top
      ? `${top.name} aligns closely${topPercent > 0 ? ` and appears in about ${topPercent}% of comparable contracts.` : "."}`
      : "It aligns to the most common accepted structure for this category."
  }`;
}

function trimDescription(description: string, limit = 3000) {
  return description.trim().slice(0, limit);
}

interface ParsedInstructions {
  priceCap?: number;
  pricingMultiplier?: number;
  addPriorityService: boolean;
  addPlumbingInspection: boolean;
  shortenDescription: boolean;
}

function parseInstructions(instructions?: string): ParsedInstructions {
  const text = (instructions ?? "").toLowerCase();
  const result: ParsedInstructions = {
    addPriorityService: false,
    addPlumbingInspection: false,
    shortenDescription: false,
  };

  // Detect "under $X" or "under X" price caps
  const priceCapMatch = text.match(/under\s+\$?([\d,]+)/);
  if (priceCapMatch) {
    const cap = parseInt(priceCapMatch[1].replace(/,/g, ""), 10);
    if (cap > 0) {
      result.priceCap = cap;
    }
  }

  // Detect premium / lower cost multipliers (only if no explicit price cap)
  if (!result.priceCap) {
    if (/\bpremium\b/.test(text)) {
      result.pricingMultiplier = 1.18;
    } else if (/\blower[\s-]cost\b|\bcheap\b|\baffordable\b/.test(text)) {
      result.pricingMultiplier = 0.85;
    }
  }

  if (/priority service/.test(text)) {
    result.addPriorityService = true;
  }

  if (/plumbing inspection/.test(text)) {
    result.addPlumbingInspection = true;
  }

  if (/\bshorter\b|\bconcise\b|\bbrief\b/.test(text)) {
    result.shortenDescription = true;
  }

  return result;
}

function resolveContractLengthYears(
  input: PlanGenerationInput,
  tier: Exclude<PlanGenerationInput["planTier"], "Best recommendation">,
) {
  if (input.desiredCoverageLevel === "Long-term value") {
    return 10;
  }
  if (tier === "Platinum") {
    return 2;
  }
  return 1;
}

function resolveVisitsPerYear(input: PlanGenerationInput) {
  if (input.serviceSchedule === "Once per year") {
    return 1;
  }
  if (input.serviceSchedule === "Quarterly") {
    return 4;
  }
  if (input.serviceSchedule === "Custom") {
    return 1;
  }
  return 2;
}

function formatServiceText(service: IncludedService) {
  const map: Record<IncludedService, string> = {
    "AC maintenance": "1 complete AC check-up in the Spring",
    "Furnace maintenance": "1 complete heating check-up in the Fall",
    "Filter changes": "Planned filter change service",
    "Unit cleaning": "Cleaning of outside condenser unit",
    "Safety inspection": "Full safety and performance inspection",
    "CO2 check": "CO2 safety check",
    "Gas leak / gas pressure check": "Gas leak and gas pressure checks",
    "Refrigerant check": "Refrigerant level and pressure check",
    "Plumbing inspection": "Whole-home plumbing inspection",
    "Water heater flush": "Water heater inspection and flush",
    "Leak detection": "Whole-home leak detection check",
    "Valve check": "Shut-off valve operation check",
    "Water pressure test": "Water pressure test",
    "Priority service": "Priority scheduling",
    "After-hours discount": "Reduced after-hours service call fee",
    "Parts and labor discount": "Preferential repair discount",
    "No trip charge": "No trip charge for covered appointments",
    "No overtime fee": "No overtime fee during covered windows",
  };

  return map[service];
}

function resolveExcludedServices(category: PlanGenerationInput["planCategory"]) {
  const base = ["Repair parts and materials", "Emergency service calls"];
  return category === "HVAC"
    ? [...base, "Refrigerant recharge unless explicitly included"]
    : category === "Plumbing"
      ? [...base, "Drain cleaning beyond routine maintenance scope"]
      : [...base, "Drain cleaning beyond routine maintenance"];
}

function buildOptionalAddons(category: PlanGenerationInput["planCategory"]) {
  if (category === "HVAC") {
    return [
      {
        name: "Upgrade to multi-year agreement",
        description: "Lock in pricing with a longer commitment term.",
        estimated_price_impact: "-10% effective annual rate",
      },
      {
        name: "Emergency visit priority",
        description: "Reduced after-hours emergency service call fee.",
        estimated_price_impact: "+$40/year",
      },
    ];
  }

  if (category === "Plumbing") {
    return [
      {
        name: "Extended water heater coverage",
        description: "Add expanded annual flush and safety check support.",
        estimated_price_impact: "+$35/year",
      },
      {
        name: "Emergency plumbing priority",
        description: "Priority dispatch for urgent plumbing service windows.",
        estimated_price_impact: "+$50/year",
      },
    ];
  }

  return [
    {
      name: "Water heater extended coverage",
      description: "Add annual flush and expanded inspection scope.",
      estimated_price_impact: "+$45/year",
    },
    {
      name: "Emergency visit coverage",
      description: "Priority after-hours response add-on.",
      estimated_price_impact: "+$60/year",
    },
  ];
}

function resolveConfidence(input: PlanGenerationInput, topSeedPlans: MaintenancePlanSeed[]) {
  if (!topSeedPlans.length) {
    return 0.78;
  }
  const top = topSeedPlans[0];
  const recurrenceWeight = Math.min(0.12, (top.recurrenceCount ?? 0) / 60000);
  const comboPenalty = input.planCategory === "HVAC & Plumbing" ? -0.03 : 0;
  return Number((0.82 + recurrenceWeight + comboPenalty).toFixed(2));
}

export function recommendationToGeneratedPlan(
  input: PlanGenerationInput,
  recommendation: MaintenancePlanRecommendation,
): GeneratedMaintenancePlan {
  const annualPrice =
    recommendation.pricing.annual_price ??
    recommendation.pricing.computed_annual_total;
  const discountPercent =
    /(\d+)%/.test(recommendation.included_services.join(" "))
      ? Number((recommendation.included_services.join(" ").match(/(\d+)%/) || [])[1] ?? 0)
      : input.desiredCoverageLevel === "Premium"
        ? 10
        : 5;

  const descriptionLimit = parseInstructions(input.optionalInstructions).shortenDescription ? 400 : 3000;
  const planDescription = trimDescription(
    `${recommendation.plan_name} provides ${recommendation.service_frequency.visits_per_year} planned visit(s) per year with ${recommendation.included_services.join(", ")}.`,
    descriptionLimit,
  );

  return validateGeneratedPlan({
    planName: recommendation.plan_name,
    quickBooksItemName: recommendation.plan_name,
    planDescription,
    colorCode: resolveColor(input.planTier, input.planCategory),
    contractLength: "12 Months",
    annualPrice,
    account: "Maintenance Plan Revenue",
    className: recommendation.plan_type,
    collectTax: recommendation.pricing.collect_tax ? "Yes" : "No",
    editableTerms: recommendation.terms_and_conditions,
    serviceWindows: recommendation.service_frequency.service_windows
      .map((window) => `${window.job_name} (${window.start_month}-${window.end_month})`)
      .join("; "),
    discountPercent: Math.max(0, Math.min(15, discountPercent)),
    confidenceReason: recommendation.recommendation_explanation,
  });
}

function clampPrice(price: number) {
  return Math.max(1, Math.round(price));
}
