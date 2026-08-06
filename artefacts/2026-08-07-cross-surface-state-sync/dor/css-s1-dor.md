# Definition of Ready: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey

**Review artefact:** artefacts/2026-08-07-cross-surface-state-sync/review/css-s1-review-2.md
**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
**Test plan reference:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s1-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-07-cross-surface-state-sync/dor/css-s1-dor-contract.md`.

**Contract Review outcome:** The Contract Proposal step surfaced two real gaps not caught at `/definition` or `/review`: (1) the CLI has no existing path to the hosted Postgres database — resolved via a new internal HTTP endpoint architecture, logged as an ARCH decision; (2) no AC covered the case of `INTERNAL_SYNC_URL`/`SECRET` being entirely unconfigured (the majority current-usage case) — resolved by adding AC6, logged as a SCOPE decision. Both resolutions are reflected in the story, test plan, and verification script before this checklist was run. ✅ **Contract review passed** — proposed implementation now aligns with all 6 ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: Platform maintainer straddling both surfaces |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC6 all covered per the AC Coverage table |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ | "Automatic cross-surface agreement rate" |
| H6 | Complexity is rated | ✅ | Rating 3, Unstable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists `das-s1`/`das-s2` as external (different feature folder), not an in-feature upstream story with schema fields — H8-ext's schemaDepends requirement applies to in-feature story dependencies; no in-feature upstream story exists for css-s1 (it's the first story). Not applicable. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 4 constraints named (D37, ADR-025, no-ADR-020, CLI-to-database path); Run 2 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | No layout-dependent ACs — this story has no UI surface |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-08-07-cross-surface-state-sync/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs — `regulated: false` |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence (story declares NFRs) | ✅ | Profile exists (checked above) |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ | "Hamish King — Platform maintainer / Product owner — 2026-08-07 (approved after /clarify)" |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ | AC5 scopes the new internal endpoint's credential wiring; the story's D37 constraint bullet names the stub-throws requirement; implementation plan must name the wiring as a separate task (per D37 rule 3) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set for this story |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set for this story |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable — flagged for more frequent check-ins per the epic's own note | Hamish King |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Run 2 has 0 MEDIUM findings remaining | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged; RISK-ACCEPT logged in `decisions.md` matches this session's established pattern for solo-maintainer review |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

**Outstanding decision to log:** W4 RISK-ACCEPT (see below).

---

## Standards injection

Domain tags: `[web-ui, data]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`, `.github/standards/data/data-standards.md` — both exist in `.github/standards/index.yml` (confirmed by direct file-existence check, not assumed). Both files are attached to the Coding Agent Instructions block below by path; the coding agent must read them in full before implementing the new internal endpoint (`web-ui-patterns.md`) and the new `pipeline-state.json`/journey data-shape touchpoints (`data-standards.md`).

---

## Oversight level

**Medium** (from parent epic `css-e1`) — tech lead awareness required. Share this DoR artefact before assigning.

> ⚠️ **Medium oversight** — share the DoR artefact with the tech lead before assigning to the coding agent. Confirmed: Hamish King (solo maintainer — both roles).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Automatically reflect a CLI-side gate advance on the corresponding web-UI journey — artefacts/2026-08-07-cross-surface-state-sync/stories/css-s1-cli-advance-reflects-on-web-ui-journey.md
Test plan: artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s1-test-plan.md
Contract: artefacts/2026-08-07-cross-surface-state-sync/dor/css-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

New environment variables to introduce and document in .env.example:
- INTERNAL_SYNC_URL — base URL of the deployed web-UI server, used by the CLI to reach the new internal sync endpoint
- INTERNAL_SYNC_SECRET — shared service-level credential; the CLI sends it, the internal endpoint verifies it. Never a per-user OAuth token (that is ADR-020's separate concern for css-s2).

Constraints:
- D37 (injectable adapter rule): the new src/sync/journey-sync-client.js
  functions must have setJourneySyncClient()/getJourneySyncClient(); the
  default stub throws an Error naming the adapter — never a silent/empty
  return. Wire the real implementation as a SEPARATE task from the handler
  task in the implementation plan (D37 rule 3).
- The new internal endpoint is machine-to-machine only — verify the
  INTERNAL_SYNC_SECRET check happens before any Postgres read/write, per AC5.
- AC6's silent no-op must be indistinguishable in behaviour from AC2 for the
  operator — do not add a warning/error message for the unconfigured-env case.
- ADR-025 (multi-tenancy): the internal endpoint's Postgres query/write must
  remain tenant_id-scoped.
- Out of scope: any gate type other than discovery-approved (css-s4); the
  reverse sync direction (css-s2); conflict detection (css-s3).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Also read the two standards files matched above in full:
  .github/standards/web-ui/web-ui-patterns.md and
  .github/standards/data/data-standards.md.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness only
**Signed off by:** Hamish King — Platform maintainer / Product owner (solo repo — both roles), 2026-08-07
