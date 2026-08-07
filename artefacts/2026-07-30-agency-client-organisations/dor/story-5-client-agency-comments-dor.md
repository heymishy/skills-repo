# Definition of Ready: Client-org lightweight collaboration — comments only

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-5-client-agency-comments-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-5-client-agency-comments-dor-contract.md`. Summary: new `comments` table + routes reusing Story 2's grant-check guard, plus a named PostHog event for AC4.

## Contract Review

Checked against all 4 ACs and the test plan's 13 tests. AC4's event-firing half (added 2026-07-31) is reflected directly in the contract. No mismatch found.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a Client org member (read-only)..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 13 tests across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | "Ongoing client-agency artefact collaboration" |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1 — PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps (resolved 2026-07-31) |
| H8-ext | Cross-story schema dependency | ✅ | Upstream: Story 2. `schemaDepends: [stage, reviewStatus]` — both present in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025, ADR-026 cited; Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC gap | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Present, Story 5 rows populated |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Approved By | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new external-service adapter introduced — PostHog capture reuses the existing wiring already established elsewhere in this codebase (e.g. `journey_created`), not a new injectable integration |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Review run 1's [1-M1] (PostHog event unnamed) resolved inline — AC4 now names `client_agency_comment_created` directly (2026-07-31), per the review's own suggested resolution. No RISK-ACCEPT needed. | Claude (agent), 2026-07-31 |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table states "None" | — |

---

## Oversight level

**Epic-level oversight: Medium.** No story-specific escalation for Story 5 beyond the epic default.

> ⚠️ Medium oversight — share the DoR artefact with the tech lead before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Client-org lightweight collaboration — comments only — artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-5-client-agency-comments-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, existing raw http.createServer + pg adapter conventions
- Comment routes MUST call Story 2's existing grant-check adapter directly — do not implement a parallel/duplicate access-control path
- Comments are append-only in this MVP — no edit/delete routes
- Fire client_agency_comment_created on every comment creation, with org_id, resource_type, resource_id, and a correctly-computed thread_has_both_org_types boolean (AC4, resolves review [1-M1])
- Comment list retrieval must be one batched query, not N+1 (Performance NFR)
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 and ADR-026 apply directly.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards
Domain tags: [web-ui, data]
- .github/standards/web-ui/web-ui-patterns.md (injectable adapters, session handling — 373 lines, read in full; referenced by path rather than inlined here for length)
- .github/standards/data/data-standards.md (data modelling, validation, residency)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31 (acknowledged)
