# WEX FSM / Payzer — Maintenance Plan Creation Agent (POC)

A guided assistant that sits above Payzer's "New Maintenance Plan" form. The user answers a few simple questions, an AI (or offline mock) generates a recommended plan from successful plan patterns, and the user reviews and approves it before the form fields are populated.

**Design principle:** Button → overlay → smart selections → review screen → populate form. No chatbot. The user always approves. The business owns the final plan.

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

No API keys or environment variables are required. The app runs in **mock mode** by default using local seed data.

---

## Demo flow

1. The form opens blank.
2. Click **Build me a Maintenance Plan**.
3. Step through the wizard — select a category, tier, services, schedule, and pricing.
4. Optionally add plain-language instructions (e.g. *"Keep the price under $250"* or *"Include priority service"*).
5. Click **Generate Plan**.
6. Review the generated plan name, description, price, service windows, and terms.
7. Click **Approve and Populate Form** — all fields fill in and remain editable.
8. Click **Save Plan** *(POC stub — wired to Payzer API in Phase 1)*.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. All are optional — mock mode works without any.

| Variable | Purpose | Phase |
|----------|---------|-------|
| `VITE_CONTEXT_API_URL` | Context Data API — pre-fills wizard with company/customer recommendations | 2 |
| `VITE_AI_PROXY_URL` | LLM reasoning proxy (server-side, no keys in browser) | 3 |
| `VITE_RAG_API_URL` | LanceDB RAG search endpoint | 3 |
| `VITE_FEATURE_MOCK_ONLY` | Force mock generation regardless of other vars | Dev/demo |

---

## Project structure

```
src/
  types/
    maintenancePlan.ts       # All TypeScript types and interfaces
  data/
    maintenancePlanSeeds.ts  # 11 seed plans — permanent offline fallback
  lib/
    recommendation.ts        # recommendSeedPlans() — scores seeds by inputs
    planGenerator.ts         # generateMaintenancePlan() — deterministic mock
    ai.ts                    # generatePlanWithAi() — proxy call with mock fallback
  components/
    BuildPlanOverlay.tsx     # 6-step wizard modal
    MaintenancePlanForm.tsx  # Payzer-like form with Save Plan stub
    GeneratedPlanReview.tsx  # Review screen: approve / regenerate / edit
    WizardStep*.tsx          # Individual wizard step components
  App.tsx
  styles.css
  main.tsx
```

---

## Mock generation and `optionalInstructions`

When no AI proxy is configured, `generateMaintenancePlan()` in `planGenerator.ts` generates a plan from local rules. It also reads `optionalInstructions` and applies basic parsing:

| Instruction example | Effect in mock mode |
|---------------------|---------------------|
| `Keep the price under $250` | Caps annual price at 250 |
| `Make this more premium` | Applies 1.18× price multiplier |
| `Lower-cost` / `affordable` | Applies 0.85× price multiplier |
| `Include priority service` | Adds "Priority service" to services |
| `Include plumbing inspection` | Adds "Plumbing inspection" to services |
| `Make the description shorter` / `concise` | Trims description to ~400 characters |

---

## Build

```bash
npm run build   # TypeScript check + Vite production build → dist/
npm run preview # Serve the production build locally
```

---

## What this POC does NOT include

- Real Payzer API integration (Save Plan is a stub — see `App.tsx`)
- Auth (use Payzer/platform session in production)
- Context Data API integration (Phase 2)
- LanceDB or LLM connections (Phase 3)
- Billing, CRM writeback, or legal compliance

See `HANDOFF.md` for the full production build brief.

---

## Owners

| Workstream | Owner |
|------------|-------|
| Context Data API | [Other team] |
| LanceDB RAG | Ming |
| LLM reasoning proxy | Ming |
| Payzer embed + form mapping | [App engineer] |
