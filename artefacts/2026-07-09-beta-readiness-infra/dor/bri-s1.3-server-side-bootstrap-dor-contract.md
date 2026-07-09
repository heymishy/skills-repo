# Contract Proposal: Bootstrap flags server-side on session start to avoid UI flicker

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.3-server-side-bootstrap.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.3-server-side-bootstrap-test-plan.md

---

## What will be built

- A session-bootstrap step (e.g. `bootstrapFlags(req)` in a new `src/web-ui/modules/flag-bootstrap.js`, or inline in the session-start path of `src/web-ui/routes/journey.js`) that:
  - Resolves all relevant flags for the session via S1.1's `isEnabled()` before the wizard canvas page's initial HTML is rendered — no client-side flag fetch precedes first paint.
  - Attaches the resolved flag state to `req.session.flags` (or equivalent), so a subsequent render within the same session reads the cached value rather than re-querying PostHog — this is the mechanism that makes AC2 ("does not apply until next session-start") true.
  - Falls back to the safe default (`false`, per S1.1 AC4) and resolves promptly if the PostHog call is slow or times out, rather than blocking session start.
- `handleGetWizard` (`src/web-ui/routes/journey.js`) renders the wizard-canvas gated element in the initial HTML response only when the resolved flag is `true` — server-omitted, not client-hidden, when `false`.
- One Playwright spec under `tests/e2e/` (per ADR-018) as a belt-and-braces AC4 check, though the integration tests are sufficient to satisfy the AC per the test plan's own note.

## What will NOT be built (scope boundary)

- Live, mid-session flag updates without a page reload (websocket/SSE) — a toggled flag applies on next session start only.
- Client-side flag override for local development/testing — a separate, unscoped developer-experience concern.

## AC → test-approach table

| AC | Description | Test approach |
|----|--------------|----------------|
| AC1 | All relevant flags resolved and in initial HTML before first paint | Unit (1) + Integration (2) |
| AC2 | Mid-session PostHog toggle does not apply until next session start | Unit (1 — call-counting spy proves no re-query) |
| AC3 | Slow/timed-out PostHog call falls back to safe default, does not block session start | Unit (1) + Integration (1) |
| AC4 | Playwright: initial HTML (not later DOM mutation) reflects flag state | Integration (1) + E2E (1, belt-and-braces) |

## Assumptions

- The bootstrap step hooks into the existing session-start flow ahead of `buildSystemPrompt`/page render, per `product/tech-stack.md` §Web UI layer, consistent with ADR-022/ADR-023's session model.
- The AC4 Playwright spec may be descoped at implementation time (per the test plan's own note) with a `decisions.md` entry, since the integration tests already satisfy the AC's observable requirement.
- Depends on S1.1 (`isEnabled()`) and S1.2 (staging/prod separation) both being usable — per story Dependencies, both are already DoR-ready in this same batch.

## Estimated touch points

- New (or extended): `src/web-ui/modules/flag-bootstrap.js` (or inline addition to `src/web-ui/routes/journey.js`'s session-start path)
- `src/web-ui/routes/journey.js` — `handleGetWizard` gated-render logic
- New: `tests/check-bri-s1.3-server-side-bootstrap.js`
- New (optional, per test plan note): `tests/e2e/bri-s1.3-flag-bootstrap.spec.js`
