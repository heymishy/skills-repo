# Definition of Ready: Build the canonical artefact trace from real disk structure for any feature

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s1-core-trace-builder-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s1-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Platform maintainer |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10 unit tests across 5 ACs |
| H4 | Out-of-scope populated | ✅ | 3 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | "Bugs of this class per session" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH, 1 LOW (1-L1, non-blocking) |
| H8 | No uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | ADR-029, ADR-028, product/mission.md cited; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered — no layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered — no compliance NFR with named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story NFRs populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner — 2026-09-06" (M1: positive signal — clearly non-engineering role) |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered — no `setX()` adapters introduced |
| H-INF | Infra-plan gate | ✅ | Not triggered — `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ | Not triggered — `hasMigrationTrack` absent |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 unresolved MEDIUM findings for this story |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script derived from already-PASSed ACs/test plan; low independent-authorship risk | Hamish King — RISK-ACCEPT logged in decisions.md, 2026-09-06 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the canonical artefact trace from real disk structure for any feature — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s1-core-trace-builder.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s1-core-trace-builder-test-plan.md

Goal:
Make every test in tests/check-cat-s1-core-trace-builder.js pass. Do not add
scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies (product/tech-stack.md).
- New file: src/web-ui/adapters/artefact-trace.js, exporting buildArtefactTrace(repoRoot, featureSlug).
- Out of scope: label/subdirectory display-name resolution (cat-s2), divergence
  classification beyond the two feature-level status codes (cat-s3), any write
  to pipeline-state.json.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing — specifically ADR-028 (one canonical builder per derived
  structure) and ADR-029 (disk is canonical for artefact content). Do not
  introduce a second archived/-fallback implementation alongside the 3 already
  found in the audit — this module is the one canonical implementation.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md`

<!-- Full text of the matched standards file is injected verbatim per the /definition-of-ready skill's standards-injection step. -->

See `.github/standards/web-ui/web-ui-patterns.md` in full — the following sections are most directly relevant to this story's own touch points (new adapter module, no route/session/HTML rendering surface):

- **Stack constraints:** No new npm `dependencies` — Node.js built-ins only; no Express.
- **HTML render function unit test pattern** — not directly applicable (this story has no render function), but the general "assert on specific string/structural fragments, not full-snapshot equality" testing philosophy applies equally to asserting on `buildArtefactTrace`'s returned object shape: assert specific fields, not full deep-equal against a giant literal.
- This story introduces no route handler, no session logic, no HTML output, and no injectable adapter (`setX()` pattern) — the injectable-adapter, session-token, silent-fallback, and shell-module sections of the standards file do not apply here; they become directly relevant starting at `cat-s4`/`cat-s5`.

The full standards file is available at the path above and MUST be read in full by the coding agent before implementation, per the standards-injection step — this DoR artefact summarises relevance rather than reproducing all 417 lines a second time.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)
