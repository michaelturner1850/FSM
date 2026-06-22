export type PlanCategory = "HVAC" | "Plumbing" | "HVAC & Plumbing";

export type PlanTier =
  | "Basic"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Commercial"
  | "Best recommendation";

export type CustomerSegment = "Residential" | "Commercial";

export type CoverageLevel = "Economy" | "Standard" | "Premium" | "Long-term value";

export type ServiceSchedule =
  | "Once per year"
  | "Twice per year"
  | "Quarterly"
  | "Seasonal"
  | "Custom"
  | "Best recommendation";

export type PricingPreference =
  | "Use recommended price"
  | "Lower-cost plan"
  | "Premium plan";

export type CollectTax = "Yes" | "No";

export type IncludedService =
  | "AC maintenance"
  | "Furnace maintenance"
  | "Filter changes"
  | "Unit cleaning"
  | "Safety inspection"
  | "CO2 check"
  | "Gas leak / gas pressure check"
  | "Refrigerant check"
  | "Plumbing inspection"
  | "Water heater flush"
  | "Leak detection"
  | "Valve check"
  | "Water pressure test"
  | "Priority service"
  | "After-hours discount"
  | "Parts and labor discount"
  | "No trip charge"
  | "No overtime fee";

export interface MaintenancePlanSeed {
  id: string;
  name: string;
  type:
    | "Residential HVAC"
    | "Commercial HVAC"
    | "Residential Plumbing"
    | "Commercial Plumbing"
    | "HVAC & Plumbing";
  tier: Exclude<PlanTier, "Best recommendation">;
  price: number;
  includes: string[];
  excludes?: string[];
  serviceWindows: string;
  discountPercent: number;
  recurrenceCount?: number;
}

/**
 * Live company + customer context returned by the Context Data API.
 * When present, each wizard step uses recommendations to pre-select values
 * and show a reason to the user. The full payload is also forwarded to the
 * LLM prompt so the generated plan reflects real customer history.
 *
 * TODO (Phase 2): wire GET /v1/maintenance-plan-context on overlay open.
 */
export interface MaintenancePlanContext {
  companyId: string;
  customerId?: string;
  company: {
    tradeTypes: ("HVAC" | "Plumbing")[];
    existingPlanNames?: string[];
    defaultAccount?: string;
    collectTaxDefault?: CollectTax;
  };
  customer?: {
    type: "residential" | "commercial";
    location?: { city?: string; state?: string };
    serviceHistory?: { category: string; description: string; date?: string }[];
    equipment?: { type: string; label?: string }[];
    recentJobs?: { type: string; amount?: number; date?: string }[];
  };
  recommendations?: {
    planCategory: PlanCategory;
    planCategoryReason: string;
    planTier?: PlanTier;
    planTierReason?: string;
    includedServices?: IncludedService[];
    includedServicesReason?: string;
    serviceSchedule?: ServiceSchedule;
  };
}

export interface PlanGenerationInput {
  planCategory: PlanCategory;
  customerSegment: CustomerSegment;
  propertyType: string;
  unitCount: number;
  desiredCoverageLevel: CoverageLevel;
  planTier: PlanTier;
  includedServices: IncludedService[];
  serviceSchedule: ServiceSchedule;
  pricingPreference: PricingPreference;
  annualPriceOverride?: number;
  optionalInstructions?: string;
  /** Populated in Phase 2 when the Context Data API is wired. */
  contextPayload?: MaintenancePlanContext;
}

export interface RecommendationServiceWindow {
  job_name: string;
  start_month: number;
  end_month: number;
  scheduling_note?: string;
}

export interface MaintenancePlanRecommendation {
  recommendation_id: string;
  plan_type: string;
  plan_name: string;
  coverage_level: CoverageLevel;
  contract_length_years: number;
  service_frequency: {
    visits_per_year: number;
    appointment_duration_minutes: number;
    total_visits?: number;
    service_windows: RecommendationServiceWindow[];
  };
  included_services: string[];
  excluded_services: string[];
  pricing: {
    annual_price?: number;
    annual_price_first_unit?: number;
    annual_price_additional_units?: number;
    computed_annual_total: number;
    billing_frequency: "annual" | "monthly";
    collect_tax: boolean;
    pricing_note?: string;
  };
  optional_addons: Array<{
    name: string;
    description: string;
    estimated_price_impact: string;
  }>;
  terms_and_conditions: string;
  recommendation_explanation: string;
  confidence: number;
  similar_historical_plans: Array<{
    plan_name: string;
    popularity_percent: number;
    annual_price?: number;
  }>;
}

export interface GeneratedMaintenancePlan {
  planName: string;
  quickBooksItemName: string;
  planDescription: string;
  colorCode: string;
  contractLength: "12 Months";
  annualPrice: number;
  account: string;
  className: string;
  collectTax: CollectTax;
  editableTerms: string;
  serviceWindows: string;
  discountPercent: number;
  confidenceReason: string;
}

export interface MaintenancePlanFormValues {
  planName: string;
  quickBooksItemName: string;
  planDescription: string;
  colorCode: string;
  contractLength: string;
  annualPrice: string;
  account: string;
  className: string;
  collectTax: CollectTax;
  editableTerms: string;
  serviceWindows: string;
}
