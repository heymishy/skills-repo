# Definition of Ready: The two existing non-trace consumers of artefact fetching keep working unchanged

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s6-regression-verification.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s6-regression-verification-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s6-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation (verification-only, no production changes) aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Platform maintainer |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 4 integration tests across 4 ACs |
| H4 | Out-of-scope populated | ✅ | 2 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Bugs of this class per session" — honest verification-only framing |
| H6 | Complexity rated | ✅ | Rating 1 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency | ✅ | schemaDepends: ["stage","reviewStatus"] on cat-s5 — both fields exist in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | req.session.accessToken convention + tir-s5 mock-shape lesson cited by name; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered |
| H-NFR3 | Data classification not blank | ✅ | Populated |
| H-NFR-profile | NFR profile presence | ✅ | Populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered — no production code changes at all in this story |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
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
Story: The two existing non-trace consumers of artefact fetching keep working unchanged — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s6-regression-verification.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s6-regression-verification-test-plan.md

Goal:
Make every test in tests/check-cat-s6-regression-verification.js pass. This
is a VERIFICATION-ONLY story — do not modify journey.js, export-data-source.js,
or any other production file. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies.
- AC1/AC2 tests MUST call the real journey.js gate-confirm function and the
  real export-data-source.js export function directly — never a reimplemented
  mock standing in for either. Per CLAUDE.md's own tir-s5 lesson: verify the
  mock/fixture shape against the REAL, CURRENT production wiring code before
  writing any fixture — read export-data-source.js's actual repoOverride
  usage first, do not assume shape from the function signature.
- req.session.accessToken is the canonical field name — confirm neither call
  site relies on the deprecated req.session.token.
- If AC1, AC2, AC3, or AC4 surfaces a REAL defect (not a test-authoring gap),
  stop and add a PR comment describing it — do not fix it in this story; it
  becomes a new, separate story per this story's own Out of Scope section.
- Do not fix either of the two documented pre-existing baseline failures
  (check-p3.5-validate-trace.js, check-pcr-s1-test-runner.js) — explicitly
  out of scope.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` — read in full before implementing.

Most directly relevant sections for this story (verification-only, no production changes, but must correctly exercise real call sites):

- **Session token access**: confirm `req.session.accessToken` is what both real call sites actually use before writing any fixture that populates a session object.
- No injectable adapter, HTML rendering, or new route surface is introduced or modified by this story — those sections are read for context only, not applied.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)
