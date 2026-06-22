import type { PlanCategory } from "../types/maintenancePlan";

export interface HistoricalPlanPattern {
  id: string;
  planName: string;
  groupedCategory: PlanCategory;
  customerSegment: "Residential" | "Commercial";
  recurrenceCount: number;
  annualPrice: number;
  contractLengthYears: number;
  appointmentDurationMinutes: number;
  collectTax: boolean;
  description: string;
  serviceWindows: Array<{
    job_name: string;
    start_month: number;
    end_month: number;
  }>;
}

// Parsed from customers (1).csv (UTF-16 tab-delimited historical export)
// and curated to high-recurrence, maintainer-friendly plan patterns.
export const historicalPlanPatterns: HistoricalPlanPattern[] = [
  {
    id: "csv-hvac-10-year-maintenance-agreement",
    planName: "10 Year Maintenance Agreement",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 6025,
    annualPrice: 100,
    contractLengthYears: 10,
    appointmentDurationMinutes: 120,
    collectTax: false,
    description:
      "20 complete system check-ups. 1 complete AC check-up in spring and 1 complete heating check-up in fall each year.",
    serviceWindows: [
      { job_name: "Spring", start_month: 3, end_month: 9 },
      { job_name: "Fall", start_month: 10, end_month: 2 },
    ],
  },
  {
    id: "csv-hvac-one-year-residential-pma-2x",
    planName: "ONE YEAR RESIDENTIAL PMA-2X",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 3060,
    annualPrice: 166,
    contractLengthYears: 1,
    appointmentDurationMinutes: 120,
    collectTax: false,
    description:
      "Two scheduled semi-annual cleanings, waived standard service call fee during business hours, reduced after-hours fee.",
    serviceWindows: [
      { job_name: "MIDTERM PMA", start_month: 1, end_month: 12 },
      { job_name: "FINAL PMA", start_month: 1, end_month: 12 },
    ],
  },
  {
    id: "csv-hvac-preventative-maintenance-savings",
    planName: "Preventative Maintenance Savings Agreement",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 2336,
    annualPrice: 149,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Two maintenances per year approximately six months apart. Customer schedules service windows.",
    serviceWindows: [
      { job_name: "1st PMA", start_month: 1, end_month: 6 },
      { job_name: "Final PMA", start_month: 7, end_month: 12 },
    ],
  },
  {
    id: "csv-hvac-1-year-maintenance-agreement",
    planName: "1 Year - Maintenance Agreement",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 1707,
    annualPrice: 150,
    contractLengthYears: 1,
    appointmentDurationMinutes: 120,
    collectTax: false,
    description:
      "Two complete check-ups: 1 AC check-up in spring and 1 heating check-up in fall with drain line and outdoor unit cleaning.",
    serviceWindows: [
      { job_name: "Spring", start_month: 3, end_month: 9 },
      { job_name: "Fall", start_month: 10, end_month: 2 },
    ],
  },
  {
    id: "csv-hvac-comfort-plus-membership",
    planName: "*1 System - Comfort Plus Membership",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 1540,
    annualPrice: 239,
    contractLengthYears: 1,
    appointmentDurationMinutes: 120,
    collectTax: true,
    description:
      "Single-system comfort membership with recurring preventative maintenance and member benefits.",
    serviceWindows: [],
  },
  {
    id: "csv-hvac-residential-2-time-esa",
    planName: "Residential 2-time ESA",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 1419,
    annualPrice: 170,
    contractLengthYears: 1,
    appointmentDurationMinutes: 120,
    collectTax: false,
    description:
      "Annual maintenance plan with two visits per year focused on reliable system performance.",
    serviceWindows: [
      { job_name: "1st of 2", start_month: 1, end_month: 12 },
      { job_name: "2nd of 2", start_month: 1, end_month: 12 },
    ],
  },
  {
    id: "csv-hvac-comfort-club-member-1-year",
    planName: "1-System Comfort Club Member 1-Year",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 1096,
    annualPrice: 199.95,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Two performance tune-ups per year, priority service and discount benefits.",
    serviceWindows: [
      { job_name: "Visit 1", start_month: 1, end_month: 2 },
      { job_name: "Visit 2", start_month: 7, end_month: 8 },
    ],
  },
  {
    id: "csv-hvac-key-performance-plan",
    planName: "Key Performance Plan",
    groupedCategory: "HVAC",
    customerSegment: "Residential",
    recurrenceCount: 1083,
    annualPrice: 185,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Two tune-ups each year with priority service and discount on service calls.",
    serviceWindows: [
      { job_name: "KPP #1", start_month: 1, end_month: 4 },
      { job_name: "KPP #2", start_month: 7, end_month: 10 },
    ],
  },
  {
    id: "csv-combo-deluxe-grinder-cleaning",
    planName: "DELUXE GRINDER CLEANING (OB-GS-ONO)",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 2498,
    annualPrice: 244.75,
    contractLengthYears: 3,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Recurring whole-home mechanical maintenance pattern with higher annual ticket.",
    serviceWindows: [],
  },
  {
    id: "csv-combo-1-system-pma",
    planName: "1 System PMA",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 2475,
    annualPrice: 199,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Single-system recurring maintenance pattern with spring and fall visit cadence.",
    serviceWindows: [
      { job_name: "Spring Visit", start_month: 3, end_month: 8 },
      { job_name: "Fall Visit", start_month: 9, end_month: 2 },
    ],
  },
  {
    id: "csv-combo-preventative-tune-up-annual",
    planName: "Preventative Tune-Up Agreement - Annual Visit",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 1930,
    annualPrice: 75,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Annual tune-up agreement with lower-cost entry pricing and add-on unit model.",
    serviceWindows: [],
  },
  {
    id: "csv-combo-twice-year-maintenance-contract",
    planName: "TWICE A YEAR MAINTENANCE CONTRACT",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 1721,
    annualPrice: 225,
    contractLengthYears: 1,
    appointmentDurationMinutes: 120,
    collectTax: false,
    description:
      "Twice-yearly maintenance including HVAC checks, electrical checks, condensate cleaning and plumbing inspection.",
    serviceWindows: [
      { job_name: "FIRST Maintenance Visit", start_month: 3, end_month: 4 },
      { job_name: "LAST Maintenance Visit", start_month: 9, end_month: 10 },
    ],
  },
  {
    id: "csv-combo-gold-plan",
    planName: "Gold Plan",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 1631,
    annualPrice: 199,
    contractLengthYears: 1,
    appointmentDurationMinutes: 90,
    collectTax: false,
    description:
      "Two seasonal maintenance checks with priority diagnostic scheduling and discounted parts and repairs.",
    serviceWindows: [
      { job_name: "Spring Maintenance Visit", start_month: 4, end_month: 9 },
      { job_name: "Fall Furnace Maintenance", start_month: 10, end_month: 12 },
    ],
  },
  {
    id: "csv-combo-silver-plan",
    planName: "Silver Plan",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 1140,
    annualPrice: 139,
    contractLengthYears: 1,
    appointmentDurationMinutes: 90,
    collectTax: false,
    description:
      "Two seasonal maintenance checks and prioritized scheduling with budget-focused pricing.",
    serviceWindows: [
      { job_name: "Spring Maintenance", start_month: 4, end_month: 9 },
      { job_name: "Fall Maintenance", start_month: 10, end_month: 12 },
    ],
  },
  {
    id: "csv-combo-annual-maintenance-plan",
    planName: "Annual Maintenance Plan",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Commercial",
    recurrenceCount: 1046,
    annualPrice: 320,
    contractLengthYears: 2,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Commercial-style annual maintenance with checklist inspection components and spring/fall windows.",
    serviceWindows: [
      { job_name: "Spring", start_month: 3, end_month: 5 },
      { job_name: "Fall", start_month: 9, end_month: 11 },
    ],
  },
  {
    id: "csv-combo-1-year-silver-maintenance-plan",
    planName: "1 YEAR SILVER MAINTENANCE PLAN",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 748,
    annualPrice: 250,
    contractLengthYears: 1,
    appointmentDurationMinutes: 90,
    collectTax: true,
    description:
      "Includes 1 AC and 1 furnace maintenance visit per year, reminders and optional monthly payment.",
    serviceWindows: [
      { job_name: "A/C MAINTENANCE", start_month: 4, end_month: 8 },
      { job_name: "FURNACE MAINTENANCE", start_month: 10, end_month: 12 },
    ],
  },
  {
    id: "csv-combo-1-year-gold-maintenance-plan",
    planName: "1 YEAR GOLD MAINTENANCE PLAN",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 709,
    annualPrice: 340,
    contractLengthYears: 1,
    appointmentDurationMinutes: 90,
    collectTax: true,
    description:
      "Includes AC and furnace maintenance, warranty support, discounts, no overtime fees and priority service.",
    serviceWindows: [
      { job_name: "A/C MAINTENANCE", start_month: 4, end_month: 8 },
      { job_name: "FURNACE MAINTENANCE", start_month: 8, end_month: 12 },
    ],
  },
  {
    id: "csv-combo-2-system-pma",
    planName: "2 System PMA",
    groupedCategory: "HVAC & Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 696,
    annualPrice: 298.5,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: false,
    description:
      "Two-system PMA plan pattern with spring and fall scheduled visits.",
    serviceWindows: [
      { job_name: "Spring Visit", start_month: 3, end_month: 8 },
      { job_name: "Fall Visit", start_month: 9, end_month: 2 },
    ],
  },
  {
    id: "seed-plumbing-service-agreement",
    planName: "Plumbing Service Agreement",
    groupedCategory: "Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 540,
    annualPrice: 99,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: true,
    description:
      "Water heater safety check, whole-home leak detection, valve exercise and water pressure test with no trip charge.",
    serviceWindows: [{ job_name: "Annual Plumbing Check", start_month: 1, end_month: 12 }],
  },
  {
    id: "seed-tankless-water-heater-flush",
    planName: "Tankless Water Heater Flush",
    groupedCategory: "Plumbing",
    customerSegment: "Residential",
    recurrenceCount: 410,
    annualPrice: 195,
    contractLengthYears: 1,
    appointmentDurationMinutes: 60,
    collectTax: true,
    description:
      "Annual flush for one tankless water heater including descaler circulation and operation check.",
    serviceWindows: [{ job_name: "Tankless Flush Service", start_month: 1, end_month: 12 }],
  },
  {
    id: "seed-commercial-plumbing-service-agreement",
    planName: "Commercial Plumbing Service Agreement",
    groupedCategory: "Plumbing",
    customerSegment: "Commercial",
    recurrenceCount: 300,
    annualPrice: 595,
    contractLengthYears: 1,
    appointmentDurationMinutes: 90,
    collectTax: true,
    description:
      "Backflow inspection, leak detection, valve checks and water pressure test for commercial properties.",
    serviceWindows: [{ job_name: "Semi-Annual Plumbing Inspection", start_month: 1, end_month: 12 }],
  },
];
