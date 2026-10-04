# Review Report: Add `/signals` to the main navigation — Run 1

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
**Date:** 2026-10-04
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Completeness — Dependencies section states "None," but AC2 explicitly relies on `ep2-s1`'s already-shipped `active: 'signals'` wiring in `handleGetSignalsPanelHtml`. Every sibling story (`sptu-s2`/`s3`/`s4`) names `ep2-s1` as an `[External: ...]` dependency per the same convention; this story should too, for consistency, even though it's non-blocking since `ep2-s1` is already merged and DoD-complete.
- **[1-L2]** AC quality — AC3's regression-test reference ("the existing dangling-link regression test") doesn't name the actual test file. Minor — the real file can be identified at `/implementation-plan` time, but naming it now would make the AC self-contained.

---

## Summary

0 HIGH, 0 MEDIUM, 2 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |

**Traceability (5):** References epic, discovery, and benefit-metric correctly; "So that..." connects explicitly to Metric 1 with a real mechanism sentence (nav discoverability as a precondition for a well-defined "time-to-triage" measurement); metric coverage matrix already lists this story.

**Scope integrity (5):** This story is itself a documented, approved scope addition (decisions.md, 2026-10-04 "Nav gap fix" entry) — not an undocumented one. Out-of-scope section names 3 genuine exclusions (icon bikeshedding, route-logic changes, unread badging). No epic/discovery out-of-scope item is implemented.

**AC quality (4):** 4 ACs, all Given/When/Then, all observable and independently testable, no "should" language. Minor deduction for 1-L2 (unnamed test file reference) — addressable without rework.

**Completeness (4):** User story present with a named persona; benefit linkage populated with a real mechanism; out-of-scope populated; NFRs populated; complexity rated (1); scope stability declared (Stable). Minor deduction for 1-L1 (Dependencies inconsistency with sibling stories' own convention).

### Category E: Architecture compliance

- Architecture Constraints field is populated with specific, verified evidence (real line numbers in `html-shell.js`, named precedent stories `pmnv-s1`/`alrf-s7`) — not blank, not generic.
- No named anti-pattern violated.
- No applicable Active ADR is contradicted; this story doesn't touch any ADR-scoped surface (viz, schema, scripts) — `architecture-guardrails.md`'s own stated scope note confirms guardrails apply to the viz/schema/scripts, not ordinary `src/web-ui/` route code, so Category E's formal checklist is largely not-applicable here beyond the general precedent-citation check already satisfied.
- Story NFRs (keyboard accessibility, no new attack surface) align with the repo's general accessibility/security posture.

No Category E findings.
