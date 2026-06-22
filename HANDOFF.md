# WEX FSM / Payzer — Maintenance Plan Creation Agent
## Production Build Brief

**Goal:** A guided assistant embedded in Payzer's "New Maintenance Plan" form that uses
company + customer context, a RAG database of successful plans, and an LLM to pre-recommend
and generate a realistic maintenance plan draft — which the user reviews, approves, and can
still edit before saving.

**Design principle (non-negotiable):** Button → overlay → smart selections → review screen →
populate form. No chatbot. The user always approves before anything writes to the form. The
business owns the final plan.

---

## What the POC proves (already built — build FROM this, not over it)

Local Vite React + TypeScript app. Run with `npm install && npm run dev`.
Mock mode requires no API keys and must always work.

| File | What it does |
|------|-------------|
| `src/types/maintenancePlan.ts` | All TypeScript types — `PlanGenerationInput`, `GeneratedMaintenancePlan`, `MaintenancePlanSeed`, etc. |
| `src/data/maintenancePlanSeeds.ts` | 9 seed plans (HVAC + plumbing) — permanent offline fallback |
| `src/lib/recommendation.ts` | `recommendSeedPlans(input)` — scores seeds by category, tier, services, schedule |
| `src/lib/planGenerator.ts` | `generateMaintenancePlan()` + `validateGeneratedPlan()` — deterministic mock, always works |
| `src/lib/ai.ts` | `generatePlanWithAi()` — calls `VITE_AI_PROXY_URL` if set, falls back to mock on any error |
| `src/components/BuildPlanOverlay.tsx` | 6-step wizard: category → tier → services → schedule → pricing → instructions |
| `src/components/MaintenancePlanForm.tsx` | Payzer-like form — accepts `GeneratedMaintenancePlan` and populates all fields |

---

## Known gaps — fix these before calling this production-ready

These are not optional cleanup. They affect correctness.

1. **Wizard opens with hardcoded demo values.** `BuildPlanOverlay.tsx` initializes with
   `planCategory: "Residential HVAC"`, `planTier: "Gold"`, and 9 pre-checked services.
   In production, the wizard must open blank (or with Context API preselections), not demo defaults.

2. **`optionalInstructions` is ignored in mock mode.** `planGenerator.ts` never reads
   `input.optionalInstructions`. The LLM prompt includes it, but if the LLM is unavailable
   the instructions have no effect. Mock generation must apply basic instruction parsing —
   detect "under $250" → cap price, "priority service" → add to services, "shorter" → trim description.

3. **No Commercial Plumbing seed data.** `maintenancePlanSeeds.ts` has no Commercial Plumbing
   entry. Scoring heuristics partially cover it but retrieval quality is poor. Add at least
   two real Commercial Plumbing examples before launch.

4. **`confidenceReason` only references seed names, not context.** When the Context API is
   wired, `confidenceReason` must explain WHY the system recommended this plan based on the
   customer's actual service history or company profile — not just which seeds matched.

5. **No save handler.** The form populates but has no submit action. Production must wire
   "Save Plan" to Payzer's maintenance plan creation API.

6. **`PlanGenerationInput` has no context field.** When Context API data is available, it
   must travel through to the LLM prompt. Add an optional `contextPayload?: MaintenancePlanContext`
   field to `PlanGenerationInput` before Phase 3.

---

## Architecture

```
Overlay opens
     │
     ▼
[Context Data API] ─── company profile, customer type, service history, equipment, recent jobs
     │
     │  pre-fills: planCategory + reason, planTier + reason, services + reason
     │  if unavailable: wizard opens blank, user selects manually
     ▼
User confirms / adjusts wizard steps (category → tier → services → schedule → pricing → instructions)
     │
     ▼
[LanceDB RAG] ─── top 3 similar successful plans + metadata → added to LLM prompt context
     │
     ▼
[LLM reasoning] ─── returns valid GeneratedMaintenancePlan JSON
     │
     │  on failure → validateGeneratedPlan() fallback → generateMaintenancePlan() mock
     ▼
Review screen (plan name, description, price, windows, terms, confidence reason)
     │
     User: Regenerate | Edit selections | Approve
     │
     ▼
Payzer "New Maintenance Plan" form populated — all fields remain editable
     │
     ▼
User saves → Payzer maintenance plan creation API
```

### Fallback chain — must work at every level

| Failure point | App behavior |
|---------------|-------------|
| Context API unavailable | Wizard opens blank; user selects all steps manually |
| Context API slow (>2s) | Show wizard immediately; show "couldn't load recommendations" notice |
| LanceDB unavailable | Use local `maintenancePlanSeeds.ts` for retrieval |
| LLM returns invalid JSON or timeout | `validateGeneratedPlan()` → `generateMaintenancePlan()` mock |
| All services down | Full mock generation always produces a valid plan |

Mock mode must remain a first-class path — used for dev, demos, and offline environments.

---

## Three production services to build

### Service 1 — Context Data API
**Owner:** [Other team]  
**Called:** Once when overlay opens (optionally refreshed per step if context changes)

**Required endpoint:**
```
GET /v1/maintenance-plan-context?companyId={id}&customerId={id}
Authorization: [Payzer session / service token]
```

**Response shape:**
```typescript
interface MaintenancePlanContext {
  companyId: string;
  customerId?: string;
  company: {
    tradeTypes: ("HVAC" | "Plumbing")[];
    existingPlanNames?: string[];
    defaultAccount?: string;
    collectTaxDefault?: "Yes" | "No";
  };
  customer?: {
    type: "residential" | "commercial";
    location?: { city?: string; state?: string };
    serviceHistory?: { category: string; description: string; date?: string }[];
    equipment?: { type: string; label?: string }[];
    recentJobs?: { type: string; amount?: number; date?: string }[];
  };
  // Pre-computed recommendations — API-side logic preferred over client-side inference
  recommendations?: {
    planCategory: PlanCategory;
    planCategoryReason: string;       // shown to user, e.g. "Residential HVAC — customer has AC/furnace service history"
    planTier?: PlanTier;
    planTierReason?: string;
    includedServices?: IncludedService[];
    includedServicesReason?: string;
    serviceSchedule?: ServiceSchedule;
  };
}
```

**Rules:**
- Return partial payload if some data is unavailable — never block the wizard with a hard failure
- Target p95 latency < 2s
- Provide OpenAPI spec before app team wires step preselection
- No PII in logs without compliance approval

**App behavior when recommendations are present:**
- Each wizard step pre-selects the recommended value and shows the reason inline
- Example: *"Recommended: Residential HVAC — This customer has residential AC/furnace service history."*
- User can accept (Next) or override — both paths work identically downstream

---

### Service 2 — LanceDB RAG
**Owner:** Ming  
**Called:** Once before the LLM generate call, after user completes wizard

**Required endpoint:**
```
POST /v1/rag/similar-plans
{
  "category": "Residential HVAC",
  "tier": "Gold",
  "services": ["AC maintenance", "Furnace maintenance"],
  "schedule": "Twice per year",
  "pricingPreference": "Use recommended price",
  "companyTrade": ["HVAC"],
  "customerType": "residential",
  "historySummary": "AC and furnace service, two visits per year",
  "topK": 3
}
```

**Response:** Array of top-K `MaintenancePlanSeed`-shaped objects each with a `similarityScore` field.

**Ingestion:**
- Start from the 9 seeds in `src/data/maintenancePlanSeeds.ts`
- Add production successful plans as available, scoped by tenant policy
- Embeddings should capture: category, tier, price band, services list, schedule, discount %
- `maintenancePlanSeeds.ts` stays in the codebase as the permanent offline fallback — never remove it

---

### Service 3 — LLM Reasoning Proxy
**Owner:** Ming  
**Called:** When user clicks "Generate Plan" after completing wizard steps

**Required endpoint:**
```
POST /v1/maintenance-plan/generate
Authorization: [internal service token]
{
  "systemPrompt": "...",
  "userPrompt": "..."
}
```

The `userPrompt` is built by `buildUserPrompt()` in `src/lib/ai.ts`. The `systemPrompt` is defined there too and must not change without review.

**System prompt (fixed):**
> "You are an expert FSM maintenance plan consultant for HVAC and plumbing businesses.
> Generate a practical maintenance plan template based on successful plan patterns.
> Do not copy source plans verbatim. Create a clear, editable recommendation.
> Keep planDescription under 3,000 characters. Use plain, customer-friendly language.
> Do not provide legal advice. Return valid JSON only."

**User prompt must include:** wizard selections, Context API snapshot, top RAG plan matches, optional user instructions.

**Response:** Valid `GeneratedMaintenancePlan` JSON — shape defined in `src/types/maintenancePlan.ts`.

**App-side rules:**
- Browser never calls the LLM directly — always via this server-side proxy
- Run `validateGeneratedPlan()` on all responses before showing to user
- On non-200, timeout, or invalid JSON → fall back to `generateMaintenancePlan()` mock and log the failure
- `optionalInstructions` from the wizard must be included in the user prompt and must influence output

---

## App integration work

### Before any service is ready
- [ ] Remove hardcoded demo defaults from `BuildPlanOverlay.tsx` (gap #1)
- [ ] Apply `optionalInstructions` in `planGenerator.ts` mock generation (gap #2)
- [ ] Add Commercial Plumbing seeds to `maintenancePlanSeeds.ts` (gap #3)
- [ ] Add `contextPayload?: MaintenancePlanContext` to `PlanGenerationInput` in `types/maintenancePlan.ts`
- [ ] Git init + `.gitignore` (node_modules, dist, .env*) + pin npm versions (remove all `"latest"`)

### Embed strategy — answer this before Phase 1
Decide how the overlay mounts in Payzer before writing embed code.
The answer changes how `MaintenancePlanForm.tsx` hands off populated values to Payzer's actual form.

- **Option A:** Direct import into Payzer's React component tree (same app, shared deps)
- **Option B:** Standalone package published to internal registry
- **Option C:** Iframe (simplest isolation, limited form access)

### Phase 1 — Embed + form mapping (no live services needed)
- [ ] Mount `BuildPlanOverlay` and `MaintenancePlanForm` in the real Payzer "New Maintenance Plan" page
- [ ] Map `GeneratedMaintenancePlan` fields to Payzer's actual form schema
- [ ] Wire "Save Plan" to Payzer's maintenance plan creation API
- [ ] Confirm Service Windows display location (below form or dedicated field)
- [ ] Confirm Color Code display (color picker or hex input)
- [ ] Keyboard navigation: ESC closes modal, focus trap inside overlay while open

### Phase 2 — Wire Context API (unblocks smart pre-recommendations)
- [ ] Call `/v1/maintenance-plan-context` on overlay open
- [ ] Show loading state while fetching — do not freeze the overlay
- [ ] On success: pre-select each wizard step from `recommendations` + show reason text
- [ ] On failure or timeout: open wizard blank with notice "We couldn't load customer context — choose manually"
- [ ] Pass `contextPayload` into `buildUserPrompt()` in `ai.ts`
- [ ] Update `confidenceReason` to reflect context API reasoning, not just seed names

### Phase 3 — Wire LanceDB + LLM (unblocks full production generation)
- [ ] Replace single `VITE_AI_PROXY_URL` call in `ai.ts` with sequential: RAG search → build prompt with top matches → LLM generate
- [ ] Keep `generateMaintenancePlan()` mock as automatic fallback — never remove it
- [ ] Feature flag: `VITE_FEATURE_MOCK_ONLY=true` forces mock generation for dev/demo regardless of other env vars
- [ ] Log each generate call: request id, tenant, latency, whether fallback was used (no PII)

### Phase 4 — Hardening
- [ ] Unit tests: `recommendSeedPlans`, `generateMaintenancePlan`, `validateGeneratedPlan`
- [ ] E2E: open overlay → accept context recommendations → generate → approve → all form fields populated correctly
- [ ] Accessibility: focus trap in modal, ARIA labels, keyboard-only path through wizard
- [ ] Error boundaries: LLM failure shows graceful retry UI, not a blank screen
- [ ] Analytics: overlay opened, recommendation accepted vs overridden (per step), generate clicked, approve clicked, form saved

---

## Environment variables

| Variable | Purpose | Required for |
|----------|---------|--------------|
| `VITE_CONTEXT_API_URL` | Context Data API base URL | Phase 2+ |
| `VITE_AI_PROXY_URL` | LLM generate endpoint | Phase 3 |
| `VITE_RAG_API_URL` | LanceDB search endpoint (or same BFF) | Phase 3 |
| `VITE_FEATURE_MOCK_ONLY` | Force mock mode regardless of other vars | Dev/demo always |

All values are set at build/deploy time. No API keys in the browser under any circumstance.

---

## Local → enterprise migration checklist

This repo is built locally first, then moved into the enterprise environment.

- [ ] Confirm target repo path and module name in Payzer
- [ ] Verify internal URLs for all three services and update `.env.production`
- [ ] Confirm CSP headers allow calls to Context API, RAG, and LLM proxy domains
- [ ] Confirm auth header format for each service (Payzer session token, service-to-service token, or both)
- [ ] Run `npm run build` in target environment; confirm no env-specific failures
- [ ] Smoke test: mock-only mode first, then enable each service one at a time

---

## Acceptance criteria

- [ ] User lands on New Maintenance Plan form — all fields empty
- [ ] "Build me a Maintenance Plan" button opens overlay without freezing the page
- [ ] Context API data pre-fills wizard steps with visible reasons when available
- [ ] Context API failure or timeout shows manual fallback gracefully — no broken state
- [ ] User can override any pre-recommended step before generating
- [ ] `optionalInstructions` change the generated plan output in both LLM and mock modes
- [ ] LanceDB top matches appear in the confidence reason shown on the review screen
- [ ] LLM failure or invalid JSON falls back to mock without a user-visible error
- [ ] Review screen shows: plan name, description, price, service windows, terms, confidence reason
- [ ] Regenerate / Edit selections / Approve and Populate Form all work correctly
- [ ] Approve populates all form fields; every field remains editable before save
- [ ] Save wires to Payzer's maintenance plan creation API
- [ ] `VITE_FEATURE_MOCK_ONLY=true` produces a complete plan with no live service calls
- [ ] Works end-to-end in enterprise environment after local cutover

---

## Explicitly out of scope

- Chatbot or conversational UI
- Auth implementation (use Payzer/platform session)
- Billing, pricing engine, CRM writeback
- Legal compliance or warranty advice in generated content
- Perfect dynamic pricing (recommended / lower / premium / override covers POC and v1)

---

## Owners

| Workstream | Owner | Deliverable |
|------------|-------|-------------|
| Context Data API | [Other team] | OpenAPI spec + `/v1/maintenance-plan-context` endpoint |
| LanceDB RAG | Ming | `/v1/rag/similar-plans` endpoint + ingestion pipeline |
| LLM reasoning proxy | Ming | `/v1/maintenance-plan/generate` endpoint + prompt tuning |
| Payzer embed + form mapping | [App engineer] | Overlay mounted in Payzer; fields mapped to real schema |
| Orchestration + fallbacks | [App engineer] | Wire all three services with fallback chain in `ai.ts` |
