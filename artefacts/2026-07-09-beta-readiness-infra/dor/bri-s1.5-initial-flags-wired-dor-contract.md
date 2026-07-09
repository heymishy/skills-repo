# Contract Proposal: Create and wire the 3 initial flags across both projects

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.5-initial-flags-wired.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.5-initial-flags-wired-test-plan.md

---

## What will be built

- A shared flag-key constants module (e.g. `src/web-ui/modules/flag-keys.js`) exporting the exact 3 flag name strings: `wizard-ui`, `product-kanban-view`, `org-kanban-view` — no bespoke evaluation logic per flag, all gated through S1.1's `isEnabled()`.
- `handleGetWizard` (`src/web-ui/routes/journey.js`) gates the wizard canvas element on `isEnabled('wizard-ui', ...)`, per S1.3's bootstrap mechanism.
- `handleGetProductKanban` (`src/web-ui/routes/products.js`) gates on `isEnabled('product-kanban-view', ...)` — returns a not-found/disabled response (short-circuiting before the DB call) when off, the normal `{ columns: [...] }` payload when on.
- `handleGetOrgKanban` (`src/web-ui/routes/products.js`) gates on `isEnabled('org-kanban-view', { tenantId })`, per S1.4's tenant-targeting mechanism — renders for the targeted tenant only, returns not-found/disabled (with zero cross-tenant data leak) for others.
- Manual creation of all 3 flags in both the staging and prod PostHog dashboards (operational step, not code).

## What will NOT be built (scope boundary)

- A 4th flag beyond the 3 named.
- Automated flag-parity checking between staging and prod projects — manual verification is sufficient for MVP.
- Verifying the real PostHog dashboard configuration in code — this requires live dashboard access and is handled by the two manual scenarios in the verification script.

## AC → test-approach table

| AC | Description | Test approach |
|----|--------------|----------------|
| AC1 | `wizard-ui` off/on gates the wizard canvas element | Integration (2) + Manual scenario (real staging+prod project existence — External-dependency gap, 🟡) |
| AC2 | `product-kanban-view` off/on gates `handleGetProductKanban` | Unit (1) + Integration (2) |
| AC3 | `org-kanban-view` on for one tenant renders via `handleGetOrgKanban`; others get not-found, no data leak | Integration (2) |
| AC4 | All 3 flags exist by the same name in both projects | Unit (1, code-side name match) + Manual scenario (real dashboard comparison — External-dependency gap, 🔴) |

## Assumptions

- `handleGetProductKanban`/`handleGetOrgKanban`/`handleGetWizard` already exist and are already-shipped (per this story's 2026-07-09 correction) — this story only adds the flag gate in front of existing behaviour, it does not build new board/wizard functionality.
- The two External-dependency gaps (AC1's "verified in both environments independently," AC4's real dashboard parity) are explicitly out of this test plan's automatable scope and are handled via manual scenarios in the verification script, per the test plan's own Coverage gaps table — not silently assumed passing.

**Flagged for the record (test-plan note appears stale, not a live scope mismatch):** the test plan's NFR section includes a note claiming "the story's NFR section still reads '`billing-v2` gating must not expose billing data...'" (the superseded placeholder flag from before the 2026-07-09 correction). Checked against the current story text: the Security NFR line already reads "`org-kanban-view` gating must not expose org Kanban data for a tenant it isn't targeted at..." — i.e. the story has **already been corrected**; the test plan's discrepancy note is itself now out of date relative to the current story. No story-text action needed. Recorded here so the operator isn't misled by the stale test-plan note into re-editing a field that's already correct.

## Estimated touch points

- New: `src/web-ui/modules/flag-keys.js`
- `src/web-ui/routes/journey.js` — `handleGetWizard` gating
- `src/web-ui/routes/products.js` — `handleGetProductKanban`, `handleGetOrgKanban` gating
- New: `tests/check-bri-s1.5-initial-flags-wired.js`
- PostHog dashboards (staging + prod) — manual flag creation, not code
