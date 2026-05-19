# DoR: acc.1 — Artefact-first governance gate

**Story:** acc.1
**Feature:** 2026-04-21-artefact-coverage-gate
**DoR status:** Signed off
**Review findings:** 0 HIGH, 0 MEDIUM
**Oversight level:** Low

---

## Hard block checklist (15/15 PASS)

- [x] H1 — Story has a user story with As a / I want / So that
- [x] H2 — All ACs are testable and unambiguous
- [x] H3 — Test plan exists with test count ≥ story ACs
- [x] H4 — No external dependencies (Node.js built-ins only)
- [x] H5 — No schema changes to pipeline-state.json
- [x] H6 — File touchpoints are enumerated in DoR contract
- [x] H7 — Out-of-scope constraints are explicit
- [x] H8 — Complexity is rated (1)
- [x] H9 — Architecture guardrails reviewed (ADR-011 is the governing ADR; no new ADR required)
- [x] H10 — No new external npm dependencies
- [x] H11 — Backwards compatible (additive only — new file + package.json entry)
- [x] H12 — Test plan has TDD baseline note
- [x] H13 — Story has a clear exit condition
- [x] H14 — Feature slug follows naming convention
- [x] H15 — Short-track rationale documented in discovery.md

---

## Coding Agent Instructions

You are implementing **acc.1: Artefact-first governance gate**.

**Entry condition:** DoR signed off. Run `npm test` — confirm it passes (excluding the known pre-existing WSL bash failure in check-p4-enf-second-line T6) before making any changes.

**What to build:**

1. `tests/check-artefact-coverage.js` — governance check script (Node.js built-ins only). See DoR contract for exact behaviour spec.

2. `artefact-coverage-exemptions.json` (repo root) — baseline exemption list. Run the script in discovery mode first to enumerate all currently-uncovered slugs, then add each to this file with a `reason` field.

3. Update `package.json` — append `&& node tests/check-artefact-coverage.js` to the test script.

**Definition of Done:** `npm test` passes with the new check included. `node tests/check-artefact-coverage.js` reports all currently-uncovered slugs as EXEMPT and exits 0.

**Do not:** modify any SKILL.md files, modify pipeline-state.json, or create artefact files for the exempted slugs.
