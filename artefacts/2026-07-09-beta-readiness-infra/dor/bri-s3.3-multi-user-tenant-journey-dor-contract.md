## Contract Proposal — Multi-user within one tenant journey spec (bri-s3.3)

**Read this first:** This story has a confirmed, formal RISK-ACCEPT/PROCEED-BLOCKED gate recorded in `decisions.md` (2026-07-09, post-/review): bri-s3.3 "is written and committed now, but formally cannot pass until `2026-07-09-team-identity-roles` reaches at least definition-of-ready." This Contract Proposal is honest about that split — it describes what CAN be built now versus what remains blocked.

**What CAN be built now:**
- The Playwright spec file skeleton, `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, tagged `@mocked` `@multi-tenant`, with all four AC test blocks written (per the test plan's E2E section) — AC1–AC3 written as intended assertions but not executable to a passing state; AC4 (tagging + zero real LLM calls) is independently executable now.
- AC4 in full: confirming the spec file carries both tags and that whatever parts of it do run make zero real calls to the mock/real gateway boundary — this does not depend on `team-identity-roles`.
- The mocked-gateway tagging/wiring check itself (S3.1 consumption) — since this only requires S3.1's fixtures, not the role model.

**What is BLOCKED — cannot be built to a passing state now:**
- AC1 (admin succeeds / engineer denied on a role-gated feature) — requires the per-person role model (admin/engineer/product/viewer) from `2026-07-09-team-identity-roles`, which does not yet exist.
- AC2 (concurrent access by two people in one tenant does not corrupt state) — requires the many-to-many person↔team schema from the same upstream feature.
- AC3 (viewer-role write attempt denied) — requires the viewer role, part of the same unbuilt schema.

The test plan's own "Declared gap notice" and Coverage gaps table make this explicit: AC1–AC3 are marked 🔴 (External-dependency, blocked); only AC4 is 🟢 (or 🟡, noting the file as a whole cannot reach a fully-passing CI run until AC1–3 clear, since all four blocks live in one spec file).

**What will NOT be built (out of scope, independent of the block):**
- Cross-tenant isolation (a different person in a *different* tenant) — S3.4's responsibility.
- Real-time collaborative-editing conflict resolution — AC2 is about safety (no corruption), not live collaboration.

**How each AC will be verified (once unblocked):**

| AC | Test approach | Type | Status |
|----|---------------|------|--------|
| AC1 | E2E: log in as admin, then as engineer, assert access differs on a role-gated feature | E2E | Blocked — written now, cannot pass until role model exists |
| AC2 | E2E: two concurrent sessions in one tenant perform unrelated actions, assert no cross-corruption | E2E | Blocked — written now, cannot pass until person↔team schema exists |
| AC3 | E2E: viewer attempts a write action, assert denial | E2E | Blocked — written now, cannot pass until viewer role exists |
| AC4 | E2E: confirm `@mocked`/`@multi-tenant` tags present and zero real LLM calls made | E2E | Not blocked in isolation, but co-located in the same spec file as AC1–3 |

**Assumptions:**
- `2026-07-09-team-identity-roles` will define the exact role list (admin/engineer/product/viewer) and person↔team schema as currently described in this story and the RISK-ACCEPT entry — if that feature's final schema differs materially, this story's ACs must be re-verified against the new schema before proceeding past implementation (explicit revisit trigger already recorded in `decisions.md`).
- Writing the spec skeleton and AC4 now is valuable even though AC1–3 cannot execute, because it surfaces the dependency in Epic 3's story count rather than leaving a silent gap (per the RISK-ACCEPT rationale).

**Estimated touch points:**
Files: `tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js` (new — skeleton + AC4 executable, AC1–3 pending/skipped).
Services: S3.1's mock LLM gateway (consumed for AC4); `2026-07-09-team-identity-roles`'s (not yet built) role/person model (required for AC1–3).
APIs: None new from this story directly; consumes whichever role-gated endpoints `team-identity-roles` introduces (not yet specified).

---

## Contract Review

Reviewed against all 4 ACs and the test plan's Declared Gap Notice, Coverage gaps table, and E2E section.

No contract mismatches — the proposed "build now vs. blocked" split matches the test plan's own AC Coverage table (AC1–3 marked 🔴/External-dependency-blocked, AC4 🟡/partially executable) exactly. The story's own Dependencies field, the test plan's gap notice, and the RISK-ACCEPT entry in `decisions.md` are all internally consistent — there is no drift between what the artefacts say and what this contract proposes to build.

✅ **Contract review passed** — proposed implementation (skeleton + AC4 only, for now) aligns with all ACs as currently statable; AC1–3 correctly reflect the acknowledged block rather than mismatching it.

---

## H8-ext — Schema Dependency Declaration

**Dependencies (story):** Upstream — cross-feature: `2026-07-09-team-identity-roles` must deliver the per-person role model and person↔team schema; formal RISK-ACCEPT/PROCEED-BLOCKED gate recorded in `decisions.md` (2026-07-09).

This is not a same-feature story dependency, but H8-ext's intent (declare which schema field the gate condition is keyed on) still applies, since the PROCEED-BLOCKED condition is expressed as "that feature must reach at least definition-of-ready" — i.e. keyed on that feature's own story-level `dorStatus` field reaching `signed-off`.

`schemaDepends: ["dorStatus"]` — referring to `2026-07-09-team-identity-roles`'s story-level `dorStatus` field in `pipeline-state.json`. Field confirmed present in `pipeline-state.schema.json` (`properties/features/items/properties/epics/items/properties/stories/items/properties/dorStatus`).

**H8-ext: PASS** — declared field `dorStatus` exists in `pipeline-state.schema.json`. (Note: this PASS is a schema-declaration technicality — it does not resolve the substantive PROCEED-BLOCKED condition below, which independently determines this story's overall READY/BLOCKED status.)
