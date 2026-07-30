# Definition of Ready: Organisation exists as a first-class entity with an org_type

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
**Test plan reference:** artefacts/2026-07-30-agency-client-organisations/test-plans/story-1-organisation-entity-test-plan.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-07-31

---

## Contract Proposal

See `story-1-organisation-entity-dor-contract.md` for the full proposal. Summary: a new `organisations` table + OAuth-callback resolution step + one-time backfill for pre-existing tenants. No UI, no `agency`/`client` assignment (Story 3's job).

## Contract Review

Checked against all 4 ACs and the test plan: every AC has a named test approach (unit and/or integration), no AC requires behaviour the contract omits, and the contract's "what will NOT be built" boundary matches the story's own Out of Scope section exactly (no UI, no agency/client assignment).

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a Platform operator..." |
| H2 | ≥3 ACs in G/W/T format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 8 tests across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 3 items listed |
| H5 | Benefit linkage references a named metric | ✅ | "Agency-led client provisioning" |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1 — PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — no upstream story, schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-025, ADR-026, ADR-027 all cited; Architecture compliance scored 5 |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — no UI in this story |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` present, Story 1 rows populated |
| H-NFR2 | Compliance clause sign-off | ✅ N/A | No compliance framework named; "Not required" checked |
| H-NFR3 | Data classification not blank | ✅ | "Confidential" |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ | Present |
| H-GOV | Approved By ≥1 non-blank, non-engineering entry | ✅ | "Hamish King — Product/Platform Owner — 2026-07-30" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No `setX()`-style injectable adapter introduced — table lookup uses the existing DB pool directly, not a swappable external integration |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged in /decisions | ✅ N/A | Review run 1 had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by domain expert | ✅ | Acknowledged and proceeding — logged as RISK-ACCEPT in `decisions.md` (2026-07-31); script gets its first walkthrough as the post-merge smoke test instead of pre-code | Hamish King — Product/Platform Owner — 2026-07-31 |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table states "None" | — |

**W4 consolidated across all 6 stories** — see the epic-level note at the end of this DoR pass rather than repeating per story.

---

## Oversight level

**Epic-level oversight: Medium** (per `epics/agency-client-organisations.md`). No per-story override for Story 1 — it is the lowest-risk story in the epic (pure additive schema + resolution step, no UI, no auth, no billing).

> ⚠️ Medium oversight — share the DoR artefact with the tech lead before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Organisation exists as a first-class entity with an org_type — artefacts/2026-07-30-agency-client-organisations/stories/story-1-organisation-entity.md
Test plan: artefacts/2026-07-30-agency-client-organisations/test-plans/story-1-organisation-entity-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this codebase's existing raw http.createServer + pg adapter conventions (no framework migration)
- Migration must be idempotent (CREATE TABLE IF NOT EXISTS), matching modules/user-roles.js's migrateTeamSchema precedent
- No UI, no route/page — data-model and resolution-step only (explicitly out of scope)
- Do not set org_type to 'agency' or 'client' anywhere in this story — Story 3's responsibility
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce anti-patterns or violate named mandatory constraints or Active ADRs (ADR-025, ADR-026, ADR-027 apply directly to this story).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium

## Applicable standards
Domain tags: [data, web-ui]
- .github/standards/data/data-standards.md (data modelling, validation, residency — read in full before implementing the organisations table)
- .github/standards/web-ui/web-ui-patterns.md (raw http.createServer + injectable adapter + session-handling conventions — read in full before wiring the OAuth-callback resolution step; 373 lines, referenced by path rather than inlined here for length)
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Product/Platform Owner — 2026-07-31 (acknowledged)
