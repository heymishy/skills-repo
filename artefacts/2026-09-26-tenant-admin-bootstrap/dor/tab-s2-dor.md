# Definition of Ready: Backfill admin for every existing real tenant that has members but no admin

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
**Test plan reference:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s2-test-plan.md
**Contract:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s2-dor-contract.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-28

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs; correctly identifies that no cross-tenant transaction is needed (unlike `tab-s1`), matching the story's own explicit skip-and-continue error-handling design.

---

## Hard Blocks

<!-- tab-s2 is migration-story.md-formatted (no User Story/GWT ACs) -- H1/H2 adapted to the template's own equivalent structural-completeness fields, per the same judgment already applied at /review. -->

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 (adapted) | Migration type checked; Scope section fully populated (Source/Target/Data-in-scope/Explicitly-out-of-scope) | ✅ | Data migration checked; all 4 Scope sub-fields populated |
| H2 (adapted) | ≥3 ACs in data-condition format, each independently verifiable | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10/10 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 3 items in "Explicitly out of scope" |
| H5 | Benefit linkage names a metric | ✅ N/A-adapted | Migration-story.md has no dedicated Benefit Linkage field; linkage confirmed via `benefit-metric.md`'s own coverage matrix (Metric 2) and the story's now-added Benefit-metric reference line (per /review finding tab-s2 1-M2) |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Review Run 2: 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies names `tab-s1` as upstream — `schemaDepends: ["dodStatus", "prStatus"]` declared below; both fields confirmed present in `.github/pipeline-state.schema.json` (lines 192, 194) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ N/A-adapted | Migration-story.md has no dedicated Architecture Constraints field; ADR-025 tenant-scoping and MC-SEC-02 both confirmed met at `/review` Category E (score 5/PASS) |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — backend-only migration script |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-09-26-tenant-admin-bootstrap/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" (feature-level NFR profile) |
| H-NFR-profile | NFR profile presence (B1) | ✅ | Profile exists |
| H-GOV | Approved By ≥1 non-engineering entry | ✅ | "Hamish King — Platform Owner — 2026-09-28" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No adapter introduced — direct `pool` parameter to the migration script's own functions |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set for this feature — the `/schema-migration-review` skill's own gate is for a different, heavier programme-track migration class; this story's own `migration-story.md` format already carries the equivalent rigor (volume criteria, transformation rules, rollback procedure) inline |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Both Run 1 MEDIUM findings resolved (1 fixed, 1 RISK-ACCEPTed) by Run 2 | — |
| W4 | Verification script reviewed by domain expert | ⚠️ RISK-ACCEPT | Script may not perfectly reflect real-world usage nuance | Hamish King, 2026-09-28 — logged in decisions.md |
| W5 | No UNCERTAIN gap-table items | ✅ | Gap table: None | — |

---

## Standards injection

Story has no `domain` field — `migration-story.md`'s own template has no dedicated field for it. Skipped silently.

---

## Oversight level

**Epic oversight:** Medium (per `epics/real-admin-bootstrap.md`) — security-sensitive, tech lead awareness required, no formal sign-off. DoR artefact to be shared before assigning.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Backfill admin for every existing real tenant that has members but no admin — artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s2.md
Test plan: artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New script `scripts/backfill-tenant-admin.js` — a standalone, one-time
  script, matching this repo's own convention for migration scripts
  (see existing scripts/migrate-schema-*.js files for the pattern).
- Do NOT touch `tab-s1`'s `tenant_admin_bootstrap` table or bootstrap
  function — this migration writes only to `team_memberships`.
- Each tenant's own row promotion is a single-row UPDATE, atomic at the
  Postgres statement level — do NOT wrap the whole batch in one
  cross-tenant transaction (that would defeat the story's own
  skip-and-continue error handling).
- Log each modified row's pre-migration role BEFORE overwriting it —
  this is what makes the story's own rollback procedure a direct
  restore, not a guess.
- Implement the 10% STOP gate: track error count vs. total processed;
  if the error rate exceeds 10%, stop automatically and log an alert
  rather than continuing silently.
- Architecture standards: read `.github/architecture-guardrails.md`
  before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech lead awareness required only
**Signed off by:** Not required (Medium oversight, DoR PROCEED: Yes)
