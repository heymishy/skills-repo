# Definition of Ready: Collapse five independent label tables into one shared, corrected table

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s2-unified-label-table-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s2-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Developer/engineer |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC3 covered by manual scenario, acknowledged not silently skipped |
| H4 | Out-of-scope populated | ✅ | 2 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Bugs of this class per session" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH; 1 MEDIUM (1-M1) resolved in same pass |
| H8 | No uncovered ACs (or acknowledged) | ✅ | AC3 gap explicitly acknowledged with manual handling, not silent |
| H8-ext | Cross-story schema dependency | ✅ | schemaDepends: ["stage","reviewStatus"] on cat-s1 — both fields exist in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-028, CLAUDE.md correction named; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered |
| H-NFR3 | Data classification not blank | ✅ | Populated |
| H-NFR-profile | NFR profile presence | ✅ | Populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | 1-M1 was resolved (AC4 reworded) in the same review pass, not deferred — no RISK-ACCEPT needed |
| W4 | Verification script reviewed by domain expert | ⚠️ | Low — derived from PASSed AC/test plan | Hamish King — RISK-ACCEPT logged in decisions.md, 2026-09-06 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Collapse five independent label tables into one shared, corrected table — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s2-unified-label-table.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s2-unified-label-table-test-plan.md

Goal:
Make every test in tests/check-cat-s2-unified-label-table.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies.
- New file: src/web-ui/adapters/artefact-labels.js, exporting resolveLabel(subdir, filename)
  and resolveColumnKey(subdir, filename). resolveColumnKey MUST delegate to
  features.js's existing exported _deriveMatrixColumn for the dor/ split — do
  not reimplement that logic a second time (AC2's explicit requirement).
- Before deleting or redirecting any of the 5 old label tables, run a full-repo
  grep for their names/functions to identify every affected test file
  (per the story's own Implementation note on AC4) — update each in place with
  an explanatory comment, never silently delete a failing test.
- CLAUDE.md's own directory-tree list (Artefact storage section) must be
  updated in the same change to add review/, decisions/, spikes/.
- Out of scope: changing which folder an artefact type is stored in; any UI
  rendering change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing — ADR-028 applies (this is the ADR's second concrete
  application, after cat-s1).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` — read in full before implementing.

Most directly relevant sections for this story's touch points (a new pure-function adapter module plus editing 5 existing table call sites — no route/session/HTML surface of its own):

- **Stack constraints:** No new npm `dependencies`.
- **HTML render function unit test pattern** — the "assert specific fragments, not full-snapshot" philosophy applies to `resolveLabel`/`resolveColumnKey`'s own unit tests (assert the specific label/key value, not a full literal object dump).
- No injectable adapter, session, or HTML-rendering surface is introduced by this story — those standards sections become relevant starting at `cat-s4`.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)
