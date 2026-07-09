# Definition of Ready: Multi-user within one tenant journey spec (bri-s3.3)

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md
**Verification script reference:** artefacts/2026-07-09-beta-readiness-infra/verification-scripts/bri-s3.3-multi-user-tenant-journey-verification.md
**Review artefact:** artefacts/2026-07-09-beta-readiness-infra/review/bri-s3.3-review-2.md
**Contract:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s3.3-multi-user-tenant-journey-dor-contract.md
**Assessed by:** Copilot (agent)
**Date:** 2026-07-10

---

## ⚠️ Read this first

This story carries a **formal RISK-ACCEPT/PROCEED-BLOCKED gate**, recorded in `artefacts/2026-07-09-beta-readiness-infra/decisions.md` (2026-07-09, post-/review): bri-s3.3 is written and committed now, but **formally cannot pass until `2026-07-09-team-identity-roles` reaches at least definition-of-ready**. The hard-block checklist below evaluates the story/test-plan/verification-script *artefacts themselves* — which are complete, internally consistent, and correctly acknowledge the gap. The overall DoR determination is nonetheless **BLOCKED**, because a story cannot be assigned to a coding agent for full implementation while 3 of its 4 ACs depend on a schema that does not exist yet.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a first beta customer onboarding as a team... I want... So that..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs (AC1–AC4), all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | All 4 ACs have an E2E test block written (AC1–3 blocked-but-written, AC4 executable) |
| H4 | Out-of-scope section is populated | ✅ | Cross-tenant isolation → S3.4; real-time collaborative editing named explicitly |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 4 — Risk-critical journeys have deterministic E2E coverage |
| H6 | Complexity is rated | ✅ | Rating 3 (raised from 2 at /review — explicitly because of the cross-feature dependency), Scope stability **Unstable** |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2, 2026-07-09 — PASS, 0 HIGH findings (confirmed, not re-checked this run) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ (technically) | AC1–3's gaps ARE explicitly acknowledged — Declared Gap Notice, Coverage gaps table, and the formal RISK-ACCEPT entry in `decisions.md` all document the same gap consistently. H8 passes on its own narrow terms; it does not by itself make this story assignable (see BLOCKED determination below). |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: ["dorStatus"]` declared, referring to `2026-07-09-team-identity-roles`'s story-level `dorStatus` field; field confirmed present in schema (see dor-contract). This PASS is a schema-declaration technicality — it does not resolve the substantive block. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018, ADR-025 cited (scope distinction vs. S3.4 correctly drawn); no Category E HIGH findings from review. One MEDIUM finding (ADR-025 stretch-citation) — see W3 below. |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT blocks sign-off | ✅ | No CSS-layout-dependent AC gap type in the test plan (gap type is External-dependency, not CSS-layout). E2E tooling confirmed configured repo-wide (Playwright, `tests/e2e/`, ADR-018) — passes cleanly. |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists, lists this story under Security (role-boundary regression guard, marked "depends on external feature") |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; nfr-profile.md exists |
| H-GOV | Governance approval check | ✅ | Confirmed PASSED — not re-checked this run |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set — skipped |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set — skipped |

**All individual hard blocks technically pass or are N/A.** This is expected and consistent with the story/test-plan's honest, well-documented handling of the gap — it does not mean the story is assignable for full implementation (see below).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | N/A — populated |
| W2 | Scope stability is declared | ✅ (declared, value is a red flag) | Declared as **Unstable** — "depends on `team-identity-roles`' final role list/schema, which could still change before that feature reaches DoR." This declaration itself is a material signal supporting the BLOCKED determination, not merely a check-the-box item. | N/A — correctly declared |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | Review Run 2 (2026-07-09) recorded a MEDIUM finding regarding an ADR-025 "stretch citation" in this story's Architecture Constraints (the ADR-025 reference names the within-tenant vs. cross-tenant scope distinction, which is a reasonable but slightly extended reading of ADR-025's stated scope). This finding is **not yet logged** in `decisions.md` — no matching RISK-ACCEPT or acknowledgement entry found. | **Not yet acknowledged — outstanding action.** |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script has not been reviewed by a domain expert. Given AC1–3 are blocked, a domain-expert review is especially valuable here to confirm the "Blocked (dependency not yet delivered)" result option and the re-run trigger language are correctly understood before this is handed to whoever eventually re-runs it. | Not yet done — outstanding for all 6 Epic 3 stories. |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | The AC1–3 gaps are explicitly addressed via the formal RISK-ACCEPT gate and a named revisit trigger ("when `2026-07-09-team-identity-roles` reaches definition-of-ready, re-verify these ACs") — not left as an open, unaddressed uncertainty. | N/A |

**Outstanding warnings requiring action:** W3 (ADR-025 stretch-citation MEDIUM finding — log in `/decisions`), W4 (verification script domain-expert review — schedule, ideally at the point the dependency clears).

---

## Oversight level

**Medium** (per `epic-3-test-suite.md`), with the epic's own rationale additionally naming this as one of the two stories (alongside S3.4) warranting closer review. Moot for this run given the BLOCKED determination — oversight applies once the story is unblocked and reassessed.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ❌ BLOCKED — pending `2026-07-09-team-identity-roles` reaching definition-of-ready

This determination is **not** a hard-block failure in the H1–H-MIG checklist sense — every individual check above passes or is N/A, because the story, test plan, and verification script all handle the known gap correctly and honestly. The BLOCKED status instead reflects the story's own Dependencies field and the formal RISK-ACCEPT/PROCEED-BLOCKED gate recorded in `decisions.md` (2026-07-09): 3 of this story's 4 ACs (AC1, AC2, AC3) cannot be implemented to a passing state because they depend on a role model and person↔team schema that `2026-07-09-team-identity-roles` has not yet delivered.

**What this means in practice:**
- The **artefact itself** (story, test plan, verification script) is complete, internally consistent, and correctly documents the gap — no rework is needed on the artefacts to reach this state.
- The story is **not ready to be assigned to a coding agent for full implementation** of AC1–AC3. Assigning it now would produce either wasted work (implementing against a schema that doesn't exist) or a misleading "passing" PR that skips/pends the very ACs the story exists to cover.
- A **narrow, explicitly-scoped slice CAN proceed now** if desired: the spec-file skeleton plus AC4 (tagging + zero-real-LLM-calls check), which does not depend on `team-identity-roles`. This is optional — the operator may choose to defer even this slice until the dependency clears, to avoid a partial PR that will need revisiting.

**Resolution path:** When `2026-07-09-team-identity-roles` reaches definition-of-ready, re-run `/definition-of-ready` on bri-s3.3, re-verify AC1–AC3 against that feature's final role list/schema (per the revisit trigger already recorded in `decisions.md`), and re-issue a Coding Agent Instructions block with `Proceed: Yes` at that point.

---

## Coding Agent Instructions

Per this DoR run's explicit guidance for bri-s3.3: this block is produced (not omitted) so the blocking condition is unambiguous and machine-readable wherever this artefact is consulted, but `Proceed` is set to `No`.

```
## Coding Agent Instructions

Proceed: No — blocked pending 2026-07-09-team-identity-roles reaching definition-of-ready
Story: Multi-user within one tenant journey spec — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md

Do NOT assign this story for full implementation. AC1, AC2, and AC3 depend on
a per-person role model and person-to-team schema that 2026-07-09-team-identity-roles
has not yet delivered (formal RISK-ACCEPT/PROCEED-BLOCKED gate, decisions.md, 2026-07-09).

If the operator explicitly chooses to proceed with the narrow unblocked slice only:
- Scope is limited to: the spec file skeleton (tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js)
  plus AC4 (tag verification + zero-real-LLM-calls check) only.
- AC1-AC3 test blocks may be written but MUST be left in a skipped/pending state
  (e.g. test.skip / test.fixme) with a comment referencing the RISK-ACCEPT gate —
  do not fabricate a passing implementation against a schema that does not exist.
- Do not implement any role-gated feature, admin/credits panel change, or
  person/team schema work as part of this story — that belongs to
  2026-07-09-team-identity-roles.
- Open a draft PR (if this narrow slice is pursued) noting explicitly in the PR
  description that AC1-AC3 are intentionally unimplemented pending the upstream
  feature, with a link to the decisions.md RISK-ACCEPT entry.

Full re-dispatch instruction: once 2026-07-09-team-identity-roles reaches
definition-of-ready, re-run /definition-of-ready on bri-s3.3 before any
full-scope implementation begins.

Oversight level: Medium (applies once unblocked and reassessed)
```

---

## Sign-off

**Oversight level:** Medium (moot pending unblock)
**Sign-off required:** No formal sign-off required for the BLOCKED determination itself; re-run `/definition-of-ready` and obtain the standard Medium-oversight tech-lead awareness once unblocked.
**Signed off by:** Not applicable — story is BLOCKED, not assigned
