import { historicalPlanPatterns } from "../data/historicalPlanPatterns";
import type {
  CustomerSegment,
  IncludedService,
  MaintenancePlanSeed,
  PlanCategory,
  PlanTier,
  PlanGenerationInput,
} from "../types/maintenancePlan";

const serviceKeywords: Record<IncludedService, string[]> = {
  "AC maintenance": ["ac maintenance", "spring", "maintenance service"],
  "Furnace maintenance": ["furnace", "fall", "maintenance service"],
  "Filter changes": ["filter"],
  "Unit cleaning": ["cleaning", "coil wash", "unit"],
  "Safety inspection": ["safety inspection", "system checks", "component checks"],
  "CO2 check": ["co2"],
  "Gas leak / gas pressure check": ["gas leak", "gas pressure"],
  "Refrigerant check": ["refrigerant"],
  "Plumbing inspection": ["pipe inspection", "plumbing", "water heater safety", "appliance hose"],
  "Water heater flush": ["flush", "tankless", "water heater"],
  "Leak detection": ["leak detection"],
  "Valve check": ["valve"],
  "Water pressure test": ["water pressure"],
  "Priority service": ["priority", "guaranteed service", "same-day"],
  "After-hours discount": ["after-hours"],
  "Parts and labor discount": ["discount", "repairs", "parts and labor"],
  "No trip charge": ["no trip charge"],
  "No overtime fee": ["no overtime"],
};

const defaultHvacServices: IncludedService[] = [
  "AC maintenance",
  "Furnace maintenance",
  "Filter changes",
  "Unit cleaning",
  "Safety inspection",
  "CO2 check",
  "Priority service",
  "Parts and labor discount",
];

const defaultComboServices: IncludedService[] = [
  ...defaultHvacServices,
  "Plumbing inspection",
  "Water heater flush",
  "Leak detection",
  "Valve check",
  "Water pressure test",
];

const defaultPlumbingServices: IncludedService[] = [
  "Plumbing inspection",
  "Water heater flush",
  "Leak detection",
  "Valve check",
  "Water pressure test",
  "Priority service",
  "No trip charge",
];

export function determineServicesForCategory(
  category: PlanGenerationInput["planCategory"],
  customerSegment: CustomerSegment,
): IncludedService[] {
  if (category === "HVAC") {
    return customerSegment === "Commercial"
      ? [
          "Filter changes",
          "Safety inspection",
          "Refrigerant check",
          "Priority service",
          "Parts and labor discount",
        ]
      : defaultHvacServices;
  }

  if (category === "Plumbing") {
    return customerSegment === "Commercial"
      ? [
          "Plumbing inspection",
          "Leak detection",
          "Valve check",
          "Water pressure test",
          "Priority service",
          "No trip charge",
        ]
      : defaultPlumbingServices;
  }

  return customerSegment === "Commercial"
    ? [
        "Filter changes",
        "Safety inspection",
        "Refrigerant check",
        "Plumbing inspection",
        "Leak detection",
        "Water pressure test",
        "Priority service",
      ]
    : defaultComboServices;
}

function inferTier(
  planName: string,
  annualPrice: number,
  recurrenceCount: number,
): Exclude<PlanTier, "Best recommendation"> {
  const name = planName.toLowerCase();
  if (name.includes("platinum")) return "Platinum";
  if (name.includes("gold")) return "Gold";
  if (name.includes("silver")) return "Silver";
  if (name.includes("commercial")) return "Commercial";
  if (name.includes("10 year") || recurrenceCount > 2000) return "Gold";
  if (annualPrice >= 260) return "Gold";
  if (annualPrice >= 140) return "Silver";
  return "Basic";
}

function inferFallbackPrice(
  groupedCategory: PlanGenerationInput["planCategory"],
  customerSegment: CustomerSegment,
) {
  if (groupedCategory === "HVAC") {
    return customerSegment === "Commercial" ? 2040 : 150;
  }
  if (groupedCategory === "Plumbing") {
    return customerSegment === "Commercial" ? 695 : 159;
  }
  return customerSegment === "Commercial" ? 1450 : 225;
}

function inferIncludedServices(
  description: string,
  groupedCategory: PlanGenerationInput["planCategory"],
) {
  const text = description.toLowerCase();
  const services: string[] = [];
  const push = (value: string) => {
    if (!services.includes(value)) services.push(value);
  };

  if (/ac|cooling/.test(text)) push("AC maintenance");
  if (/furnace|heating/.test(text)) push("Furnace maintenance");
  if (/filter/.test(text)) push("Filter changes");
  if (/clean/.test(text)) push("Unit cleaning");
  if (/co2/.test(text)) push("CO2 check");
  if (/gas leak|gas pressure/.test(text)) push("Gas leak / gas pressure check");
  if (/refrigerant|freon/.test(text)) push("Refrigerant check");
  if (/priority|rapid response/.test(text)) push("Priority service");
  if (/overtime/.test(text)) push("No overtime fee");
  if (/discount/.test(text)) push("Parts and labor discount");

  if (groupedCategory === "HVAC & Plumbing" || groupedCategory === "Plumbing") {
    if (/plumbing|water heater|fixture|valve/.test(text)) push("Plumbing inspection");
    if (/flush/.test(text)) push("Water heater flush");
    if (/leak/.test(text)) push("Leak detection");
    if (/valve/.test(text)) push("Valve check");
    if (/pressure/.test(text)) push("Water pressure test");
  }

  return services.length ? services : determineServicesForCategory(groupedCategory, "Residential");
}

function inferExcludedServices(description: string) {
  const text = description.toLowerCase();
  const excludes: string[] = [];
  if (/parts.*not included|materials.*not included|repairs.*quoted separately/.test(text)) {
    excludes.push("Repair parts and materials");
  }
  if (/emergency|after-hours/.test(text)) {
    excludes.push("Emergency service calls");
  }
  return excludes.length ? excludes : undefined;
}

function inferDiscountPercent(description: string, annualPrice: number) {
  const text = description.toLowerCase();
  const match = text.match(/(\d{1,2})\s*%/);
  if (match) {
    const value = Number(match[1]);
    return Math.max(0, Math.min(15, value));
  }
  if (annualPrice >= 300) return 10;
  if (annualPrice >= 180) return 5;
  return 0;
}

const maintenancePlanSeeds: MaintenancePlanSeed[] = historicalPlanPatterns.map((pattern) => ({
  id: pattern.id,
  name: pattern.planName,
  type:
    pattern.groupedCategory === "HVAC"
      ? pattern.customerSegment === "Commercial"
        ? "Commercial HVAC"
        : "Residential HVAC"
      : pattern.groupedCategory === "Plumbing"
        ? pattern.customerSegment === "Commercial"
          ? "Commercial Plumbing"
          : "Residential Plumbing"
        : "HVAC & Plumbing",
  tier: inferTier(pattern.planName, pattern.annualPrice, pattern.recurrenceCount),
  price:
    pattern.annualPrice > 0
      ? pattern.annualPrice
      : inferFallbackPrice(pattern.groupedCategory, pattern.customerSegment),
  includes: inferIncludedServices(pattern.description, pattern.groupedCategory),
  excludes: inferExcludedServices(pattern.description),
  serviceWindows: pattern.serviceWindows.length
    ? pattern.serviceWindows
        .map((window) => `${window.job_name} (${window.start_month}-${window.end_month})`)
        .join("; ")
    : "January - December",
  discountPercent: inferDiscountPercent(pattern.description, pattern.annualPrice),
  recurrenceCount: pattern.recurrenceCount,
}));

function groupedCategoryForSeed(seedType: MaintenancePlanSeed["type"]) {
  if (seedType === "HVAC & Plumbing") return "HVAC & Plumbing";
  if (seedType.includes("HVAC")) return "HVAC";
  if (seedType.includes("Plumbing")) return "Plumbing";
  return "HVAC & Plumbing";
}

function categoryScore(seedType: MaintenancePlanSeed["type"], input: PlanGenerationInput) {
  const groupedCategory = groupedCategoryForSeed(seedType);
  let score = groupedCategory === input.planCategory ? 30 : 0;

  if (input.customerSegment === "Residential" && seedType.includes("Residential")) {
    score += 8;
  }
  if (input.customerSegment === "Commercial" && seedType.includes("Commercial")) {
    score += 8;
  }

  return score;
}

function serviceScore(seed: MaintenancePlanSeed, selectedServices: IncludedService[]) {
  const seedText = seed.includes.join(" ").toLowerCase();

  return selectedServices.reduce((score, service) => {
    const hasMatch = serviceKeywords[service].some((keyword) => seedText.includes(keyword));
    return score + (hasMatch ? 4 : 0);
  }, 0);
}

function scheduleScore(seed: MaintenancePlanSeed, schedule: PlanGenerationInput["serviceSchedule"]) {
  const seedText = `${seed.includes.join(" ")} ${seed.serviceWindows}`.toLowerCase();

  if (schedule === "Best recommendation") {
    return 4;
  }
  if (schedule === "Once per year") {
    return seedText.includes("annual") || seedText.includes("one ") ? 8 : 0;
  }
  if (schedule === "Twice per year") {
    return seedText.includes("two ") || seedText.includes("spring") || seedText.includes("fall") ? 8 : 0;
  }
  if (schedule === "Quarterly") {
    return seedText.includes("quarterly") || seedText.includes("four ") ? 8 : 0;
  }

  return 0;
}

export function recommendSeedPlans(input: PlanGenerationInput): MaintenancePlanSeed[] {
  const servicesToMatch = input.includedServices.length > 0
    ? input.includedServices
    : determineServicesForCategory(input.planCategory, input.customerSegment);

  return maintenancePlanSeeds
    .map((seed) => {
      let score = categoryScore(seed.type, input);
      score += input.planTier === "Best recommendation" ? 4 : seed.tier === input.planTier ? 18 : 0;
      score += serviceScore(seed, servicesToMatch);
      score += scheduleScore(seed, input.serviceSchedule);
      return { seed, score };
    })
    .sort((a, b) => b.score - a.score || Math.abs(a.seed.price - averagePrice(input)) - Math.abs(b.seed.price - averagePrice(input)))
    .slice(0, 3)
    .map(({ seed }) => seed);
}

export function getCategoryRecurrenceTotal(input: PlanGenerationInput): number {
  return maintenancePlanSeeds
    .filter((seed) => groupedCategoryForSeed(seed.type) === input.planCategory)
    .filter((seed) =>
      input.customerSegment === "Residential"
        ? seed.type.includes("Residential") || seed.type === "HVAC & Plumbing"
        : seed.type.includes("Commercial"),
    )
    .reduce((sum, seed) => sum + (seed.recurrenceCount ?? 0), 0);
}

export function getPlanPopularityPercent(seed: MaintenancePlanSeed, input: PlanGenerationInput): number {
  const total = getCategoryRecurrenceTotal(input);
  const recurrence = seed.recurrenceCount ?? 0;
  if (total <= 0 || recurrence <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(99, Math.round((recurrence / total) * 100)));
}

function averagePrice(input: PlanGenerationInput) {
  if (input.annualPriceOverride && input.annualPriceOverride > 0) {
    return input.annualPriceOverride;
  }

  if (input.customerSegment === "Commercial") {
    return 2500;
  }
  if (input.planCategory === "Plumbing") {
    return 165;
  }
  if (input.planCategory === "HVAC & Plumbing") {
    return 430;
  }
  return input.planTier === "Platinum" ? 480 : input.planTier === "Gold" ? 340 : 225;
}
