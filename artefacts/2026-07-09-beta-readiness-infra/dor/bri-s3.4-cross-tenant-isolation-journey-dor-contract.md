## Contract Proposal — Cross-tenant isolation journey spec (bri-s3.4)

**What will be built:**
- A unit test for the `isSameTenant`/tenant-scoping utility, asserting correct boolean returns for matching/mismatched tenant IDs and a safe (`false`) default for `null`/`undefined` inputs.
- Integration tests calling route handlers across `products`, `credits`, `standards`, `user_roles` (ADR-025's stated scope) directly (no browser) as tenant A, targeting tenant B resources — asserting 404-not-403 on reads, zero tenant-B leakage on list endpoints, and rejected writes with unchanged tenant-B data afterward.
- A Playwright spec, `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js`, tagged `@mocked` `@multi-tenant`, covering AC1–AC3 and AC5 end-to-end using bri-s2.4's seeded two-tenant data and S3.1's mock gateway.
- A CI job configuration change (not a code path in the app itself) that runs this spec `--repeat-each=20` with a zero-skip/zero-flake pass gate, addressing AC4 as a CI-configuration concern rather than a single-run assertion.

**What will NOT be built:**
- Cross-tenant isolation for the future `TENANT_ORG_ALLOWLIST`-based org-tenancy model — not built yet, explicitly out of scope.
- Filesystem-level or database-level penetration testing beyond the application-layer guard — matches ADR-025's stated scope; this story tests the guard via API/browser only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit: `isSameTenant` boolean correctness; Integration: `requireJourneyAccess` guard returns 404 (not 403) across all 4 resource types; E2E: browser-driven confirmation | Unit + Integration + E2E |
| AC2 | Integration: list endpoints scoped by `tenant_id` at the query layer, zero tenant-B rows returned; E2E: browser-driven confirmation | Integration + E2E |
| AC3 | Integration: write/mutation rejected, tenant-B data unchanged on follow-up read; E2E: browser-driven confirmation | Integration + E2E |
| AC4 | CI job configuration: `--repeat-each=20`, zero-tolerance pass gate; reviewed on any anomaly per Metric 5 | CI configuration (not a coding-agent-testable unit at DoR time — see Coverage gaps) |
| AC5 | E2E: call-count spy confirms zero real network calls; spec tagged `@mocked` `@multi-tenant` | E2E |

**Assumptions:**
- `requireJourneyAccess`/`isSameTenant` and equivalent per-resource-type guards already exist in the codebase per ADR-025's phased delivery (phases 0–5) — this story adds regression test coverage over the existing guard, it does not build the guard itself.
- bri-s2.4's seed script (synthetic tenants) is available and stable enough to provide the two-tenant fixture data this spec needs.
- AC4's "zero skip/flake over 20 consecutive runs" is explicitly a CI-configuration and ongoing-monitoring concern per the test plan — not something a pre-implementation DoR check can verify; this is tracked as a Coverage gap with a named mitigation (dedicated CI job), not a defect.

**Estimated touch points:**
Files: `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js` (new), route handlers under `src/web-ui/routes/` (or equivalent) for `products`, `credits`, `standards`, `user_roles` (read-only test consumption, no behavioural change expected), CI workflow config (new job step for the 20-run repeat gate).
Services: bri-s2.4's seed script (consumed), S3.1's mock LLM gateway (consumed for `@mocked` variant).
APIs: Existing tenant-scoped read/write/list endpoints across the 4 named resource types (consumed, not modified).

---

## Contract Review

Reviewed against all 5 ACs and the test plan's Unit/Integration/E2E/CI-configuration sections. No mismatches found — AC1–AC3 and AC5 map to concrete, executable tests; AC4 correctly maps to a CI-configuration concern (Coverage gaps table explicitly names this as Untestable-by-nature at DoR time, with a documented mitigation), which the story's own AC4 text ("across 20 consecutive runs") already frames as an empirical/CI concern rather than a unit-testable assertion.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream: S2.4 (anonymized seed script) for the two-tenant test data; S3.1 (mock LLM gateway) for the `@mocked` variant.

Both are code-level/module or data-fixture consumption dependencies, not `pipeline-state.json` field-read dependencies in the strict H8-ext sense. Declaring the schema dependency anyway, keyed on sequencing:

`schemaDepends: ["dorStatus"]` — referring to both `bri-s2.4`'s and `bri-s3.1`'s story-level `dorStatus` fields in `pipeline-state.json`. Field confirmed present in `pipeline-state.schema.json`.

**H8-ext: PASS** — declared field `dorStatus` exists in `pipeline-state.schema.json`.
