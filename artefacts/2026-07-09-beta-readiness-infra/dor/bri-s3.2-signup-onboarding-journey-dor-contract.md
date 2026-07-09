## Contract Proposal — Signup → onboarding → first feature journey spec (bri-s3.2)

**What will be built:**
A single Playwright E2E spec, `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js`, tagged `@mocked`, driving:
- Email/password signup through to a dashboard with a "create first product" path (AC1).
- The full outer loop (discovery → benefit-metric → definition → test-plan → definition-of-ready) through the browser UI only, using S3.1's mock LLM gateway fixtures at each stage (AC2).
- A definition-of-ready pass path that lets the inner-loop build stage proceed, with a visible gate-pass result (AC3).
- A second run of the same flow with a deliberately incomplete DoR input, asserting a visibly and textually distinct gate-fail result (AC4).
- A network-call-count spy on the real Copilot Chat Completions client asserting zero real calls across the whole spec (AC5).

Supporting integration tests (non-browser) verify the two data-layer guarantees the Playwright assertions depend on: `GET /api/journey/:id`'s ADR-024 response shape, and the DoR gate evaluator's distinct pass/fail results.

**What will NOT be built:**
- Google OAuth or GitHub OAuth signup variants — this spec covers email/password signup only; OAuth paths are S3.6's responsibility.
- Team/multi-user onboarding — this is the solo, single-user path; multi-user scenarios are S3.3's responsibility.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Playwright: signup with new email/password, assert dashboard renders with a visible/clickable "create first product" path | E2E |
| AC2 | Integration: `GET /api/journey/:id` shape conformance (ADR-024); Playwright: drive discovery→benefit-metric→definition→test-plan→definition-of-ready via browser only, assert each stage hands off automatically | Integration + E2E |
| AC3 | Integration: DoR gate evaluator returns pass for a complete input; Playwright: assert gate-pass UI element visible after inner-loop build runs | Integration + E2E |
| AC4 | Integration: DoR gate evaluator returns a distinguishable fail result for an incomplete input; Playwright: assert gate-fail UI element is visually/textually distinct from the AC3 pass state | Integration + E2E |
| AC5 | Playwright: call-count spy on the real Copilot API client across the full spec file, assert zero invocations | E2E |

**Assumptions:**
- S3.1's mock LLM gateway (bri-s3.1, signed off in this same DoR run) will be implemented before this spec is executed against CI — the spec can be written now, but requires bri-s3.1's fixture set for discovery/benefit-metric/definition/test-plan/definition-of-ready to exist before it passes.
- The seeded staging database (bri-s2.4) is available for a fresh, non-colliding synthetic email — this story generates its own email per run rather than reusing seed-tenant identities.
- The existing `routes/journey.js` gate-evaluation logic for definition-of-ready (`src/enforcement/gate-map.js`) already returns a distinguishable pass/fail result usable by this spec without new backend logic — if not, backend gate-evaluator changes would be a scope addition requiring a DoR contract amendment (ADR-008).

**Estimated touch points:**
Files: `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js` (new), `routes/journey.js` (read-only, GET endpoint consumption), `src/enforcement/gate-map.js` (read-only, DoR gate evaluator consumption).
Services: S3.1's mock LLM gateway (consumed, not modified by this story).
APIs: `GET /api/journey/:id` (consumed per ADR-024 contract, no new consumer behaviour beyond existing shape).

---

## Contract Review

Reviewed against all 5 ACs and the test plan's Integration/E2E sections. No mismatches found — the test plan's AC Coverage table maps 1:1 to the proposed approach above (AC1 E2E-only; AC2–AC4 integration + E2E; AC5 E2E-only), and the Out of Scope sections in both the story and test plan agree (OAuth variants → S3.6; multi-user → S3.3).

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream: S3.1 (mock LLM gateway) — required for the `@mocked` variant to run without real API calls.

This is a **code-level/module consumption dependency** (this spec imports/consumes S3.1's mock gateway fixtures and client at runtime), not a `pipeline-state.json` field-read dependency in the sense H8-ext is designed to catch (e.g. a downstream skill reading an upstream story's `dorStatus`/`reviewStatus` fields to gate its own execution, per the `cdg.3` precedent). Recording the schema declaration anyway, since S3.1 must reach a signed-off DoR state before this story's implementation can begin sequencing-wise:

`schemaDepends: ["dorStatus"]` — referring to `bri-s3.1`'s `dorStatus` field in `pipeline-state.json` (`.github/pipeline-state.json`, `properties/features/items/properties/epics/items/properties/stories/items/properties/dorStatus`). Field confirmed present in `pipeline-state.schema.json`.

**H8-ext: PASS** — declared field `dorStatus` exists in `pipeline-state.schema.json`.
