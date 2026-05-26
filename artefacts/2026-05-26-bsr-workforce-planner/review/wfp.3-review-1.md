# Review Report: Map workforce to initiatives with direct allocation, FTE delta, and cost inference — Run 1

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.3.md
**Date:** 2026-05-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** [C — AC quality] — AC1 contains a cross-reference: "see Input Format section below." However, the Input Format section appears before the Acceptance Criteria section in the document — it is above AC1, not below it. The cross-reference direction is incorrect and could briefly confuse a reader. Fix: change "below" to "above" in AC1.

---

## Summary scores

| Category | Score (1–5) | Notes |
|---|---|---|
| A — Traceability | 5 | Epic, discovery, benefit-metric all linked. M1 and M2 both named. Benefit linkage identifies `initiative-map.json` as the M2 measurement vehicle. |
| B — Scope | 5 | Profile-match and net-new explicitly excluded (wfp.4). Portfolio write-back excluded. Fractional allocation excluded. Out-of-scope complete. |
| C — AC quality | 4 | 6 ACs in Given/When/Then. AC1 enumerates all 8 required output fields explicitly. AC4 gap flag. AC5 unmatched person handling. AC6 idempotent. LOW-L1: cross-reference direction in AC1 ("below" should be "above"). |
| D — Completeness | 5 | All sections present. Input Format section fully defines allocation-input.json schema — field rules documented. Named persona. NFRs cover performance, security, integrity. Dependencies direction correct. |
| E — Architecture | 5 | Path traversal not permitted (fixed paths). Portfolio read-only. Output overwrites cleanly (idempotent). No external deps. |

**Outcome:** PASS — 0 HIGH, 0 MEDIUM, 1 LOW. Proceed to /test-plan with LOW noted for cosmetic fix before commit.
