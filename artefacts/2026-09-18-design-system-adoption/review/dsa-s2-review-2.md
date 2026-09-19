# Review Report: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md — Run 2

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Date:** 2026-09-19
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
None — [1-M1] remains open (see Carried forward).

### New findings this run
🆕 **[2-M1]** Category C — AC5/AC6 name implementation details (the exact adapter function `getPendingActions`, the exact route `POST /api/skills/:name/sessions`) rather than purely observable behaviour.

### Carried forward unchanged
⏳ **[1-M1]** Category C — AC4 describes a verification method rather than a sharply observable outcome — 2 runs open.

### Progress summary
Run 1: 0 HIGH, 1 MEDIUM, 0 LOW
Run 2: 0 HIGH, 2 MEDIUM, 0 LOW
Change: HIGH +0, MEDIUM +1, LOW +0

SAME (no regression in severity class; the amendment's own new ACs introduced one new MEDIUM-class issue of the same kind already open on AC4)

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC4 ("no existing functional behavior regresses — verified by running this screen's own pre-existing test coverage before and after the change") describes a verification method rather than a sharply observable outcome. Same recurring pattern already RISK-ACCEPTed for every sibling story in this feature (dsa-s1's [1-M2], dsa-s3's equivalent).
  Risk if proceeding: interpretive latitude for a coding agent versus the exact token-value ACs (AC1–AC3).
  To acknowledge: run /decisions, category RISK-ACCEPT.

- **[2-M1]** Category C (AC quality) — AC5 ("...fetched via the existing `getPendingActions` adapter — not static/placeholder content") and AC6 ("...link to real, working `POST /api/skills/:name/sessions` session-start actions") each name a specific implementation detail (an adapter function name; an exact route path) inside the AC text itself, rather than describing only the observable, user-facing outcome. A purely observable rewrite would read closer to: AC5 — "Then the 'Waiting on you' list shows the user's real pending sign-off items (feature, artefact type, time pending), not static content"; AC6 — "Then it shows a real, defined set of platform skills that a user can actually start a session for." The implementation-detail phrasing was introduced directly from this story's own Architecture Constraints investigation during the scope-amendment pass, not from re-deriving the AC from user-observable behaviour first.
  Risk if proceeding: low — the named implementation details are correct and already independently verified against real code (not guessed), so this does not risk a coding agent building against the wrong mechanism; the risk is purely that a future story/reviewer reading these ACs in isolation might read them as prescribing an implementation rather than describing an outcome.
  To acknowledge: run /decisions, category RISK-ACCEPT — the underlying behavior described is correct and testable either way; tightening the wording is optional polish, not a correctness fix.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. 2 MEDIUM findings should be acknowledged in /decisions before proceeding, or fixed in the story (both are pre-existing-pattern wording issues, not correctness gaps).

---

## Category detail

### A — Traceability
Story references the parent epic (`epics/visual-restyle-rollout.md`), discovery (`discovery.md`), and benefit-metric (`benefit-metric.md`) artefacts correctly, unchanged from Run 1. Benefit Linkage still names the real metric ("Visual consistency across the 4 real screens") and states the real mechanism (moving the metric from 1/4 to toward 4/4) — unaffected by the amendment, since the amendment is about *what* satisfies the dashboard screen's restyle, not *which* metric it serves. Coverage matrix: this story's slug is already listed under m1's `contributingStories` in `benefit-metric.md`/`pipeline-state.json` (confirmed present from the feature's own `/definition` pass) — no update needed.

### B — Scope discipline
Checked the amended story's new ACs (5-7) and expanded Architecture Constraints/Out of Scope against both the epic's own Out of Scope (no screen beyond the 4 named; no toggle-mechanism changes; no new tokens/components beyond `DESIGN.md`) and discovery's own Out of Scope (no retroactive DoR enforcement; no extending the design system further) — no violation found. The amendment wires *existing* data sources into an *existing*, already-built view function; it does not invent new tokens, components, or design-system patterns, and does not touch the toggle mechanism or any other screen. The story's own Out of Scope section was itself expanded during the amendment to proactively exclude several items that could otherwise creep in during implementation (sidebar rebuild, a richer session-status taxonomy, cross-tenant action-queue changes, dynamic catalog configurability) — this is good scope discipline, not a gap. The scope addition itself (full live-data wiring) has an approved scope note: the story's own "Amendment note" section plus a full `decisions.md` entry recording the operator's explicit choice between the two options presented.

### C — AC quality
All 7 ACs are in Given/When/Then format. AC1-AC4 unchanged from Run 1 (already PASS). AC5-AC7 (new) are independently testable and use observable-outcome verbs ("shows", "reflects") — see MEDIUM finding [2-M1] for the one real quality issue found: AC5/AC6 blend a correct, verified implementation detail into otherwise-observable AC text. This does not block PASS (the scoring criteria's HIGH bar is "fewer than 3 ACs, or not in Given/When/Then" — neither applies) and does not indicate the ACs are wrong, only that their phrasing could be tightened. 7 ACs total, well above the minimum-3 threshold.

### D — Completeness
All template fields populated: User story in As/Want/So format with a named persona (Hamish King, Founder/Operator) — unchanged from Run 1. Benefit linkage populated. Out of scope populated with 7 concrete items (expanded from 3 during the amendment — not blank, not "N/A"). NFRs populated (4 categories, one — Performance — updated during the amendment to note the now-live-network-bound `getPendingActions` call on page load). Complexity rated (amended 2→3, with an HTML-comment rationale explaining the change — a real, honest re-rating, not silently left at the original story's now-stale value). Scope stability declared (Stable, unchanged — a reasonable call, since although the scope grew, the newly-added ACs are themselves well-grounded in verified real code, not open unknowns).

### E — Architecture compliance
`architecture-guardrails.md` exists. Checked: Architecture Constraints field is populated (extensively — expanded during the amendment with exact real file/function names and data shapes for every new data source). The anti-pattern guardrail this story's Architecture Constraints itself cites ("Any change to shared surface modules... is a story — even a small one") is correctly respected: the amendment explicitly does NOT touch `renderShell`'s sidebar (already a shared surface module, already covered by `dsa-s1`'s own token work) — it confines itself to `dashboard.js`/`dashboard-view.js`, both already-named target files. No Active ADR violation found. No mandatory constraint conflict found.
