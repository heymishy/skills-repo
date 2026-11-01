# Review Report: Stop the deploy-group concurrency lock from silently cancelling E2E coverage — Run 1

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Date:** 2026-11-01
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance / F — Journey.js fixture hygiene / G — skills.js fixture hygiene / H — journeys.js fixture hygiene (all 8, A–H)
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC1 and AC3 are both disjunctive ("either X no longer occurs, or an automatic mechanism recovers it") rather than describing one single observable outcome. This is an acceptable, deliberate choice given the fix approach is genuinely undetermined at `/definition` time (per `/clarify`'s own finding that the underlying GitHub Actions platform limitation can't be fully eliminated) — but `/test-plan` will need to pick a concrete, testable interpretation (most likely: test the auto-recovery path directly, since the "cancellation no longer occurs" path isn't achievable without the out-of-scope ephemeral-environments redesign).

---

## Scores

**Traceability score (1–5):** 5 — References epic, discovery, benefit-metric correctly; Benefit Linkage names m6 with a real mechanism sentence; m6 appears in the benefit coverage matrix.

**Scope integrity score (1–5):** 5 — Doesn't implement anything in epic/discovery Out of Scope; its own Out of Scope section names 3 explicit exclusions (ephemeral environments, per-ref narrowing — explicitly a rejected regression — and Fly.io changes, confirmed unnecessary via `/clarify`).

**AC quality score (1–5):** 5 — All 4 ACs in Given/When/Then, independently testable. The disjunctive framing in AC1/AC3 (1-L1) is a minor quality note, not a defect — it correctly reflects genuine uncertainty rather than papering over it with a falsely-precise single-path AC.

**Completeness score (1–5):** 5 — User story with a named, discovery-matched persona (platform maintainer); benefit linkage real; out of scope populated; NFRs populated, including a genuinely new NFR shape for this epic lineage (least-privilege CI permissions) grounded in a real concern, not fabricated; complexity rated (2); scope stability declared (Stable).

---

## Overall score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above.

### Category E: Architecture compliance

Architecture Constraints field populated ("None identified — checked"); confirmed ADR-009/010 (audit-workflow trigger separation) don't govern E2E deploy concurrency scoping, and no other Active ADR applies. **Score: 5.**

### Category F: Journey.js fixture hygiene

N/A — this story touches `.github/workflows/*.yml` only, no `journey.js`-touching test file. **Score: 5.**

### Category G: skills.js fixture hygiene

N/A — no `skills.js`-touching file in scope. **Score: 5.**

### Category H: journeys.js fixture hygiene

N/A — no `journeys.js`-touching file in scope. **Score: 5.**

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS
