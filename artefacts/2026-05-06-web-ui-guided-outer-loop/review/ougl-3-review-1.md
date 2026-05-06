# Review Report: Journey entry screen and start endpoint — Run 1

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-3-journey-entry-and-start.md
**Date:** 2026-05-06
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **1-M1** [C] — AC7 references `sessionManager.createSession` which is not a function that exists in this codebase. Session creation in ougl.3 involves `createJourney()` (journey store), `registerHtmlSession()` (`skills.js`), `setActiveSession()`, and `linkSessionToJourney()`. A coding agent implementing AC7 would search for `sessionManager.createSession`, find nothing, and either skip the test or mock the wrong function.
  Fix: Replace "Given `POST /api/journey` is called and `sessionManager.createSession` throws an error" with "Given `POST /api/journey` is called and the session creation step throws an error (e.g. `registerHtmlSession` throws)" and name the specific function to mock in the test implementation note.

---

## LOW findings — note for retrospective

- **1-L1** [D] — Complexity rating and Scope stability fields absent. Systemic across all 7 ougl stories. See ougl-1-review-1.md for detail.

- **1-L2** [A] — Benefit coverage matrix in `benefit-metric.md` not yet updated. Systemic. See ougl-1-review-1.md for detail.

---

## Category scores

| Category | Score (1–5) | Pass? |
|----------|-------------|-------|
| A — Traceability | 4 | PASS |
| B — Scope discipline | 5 | PASS |
| C — AC quality | 3 | PASS |
| D — Completeness | 4 | PASS |
| E — Architecture compliance | 5 | PASS |

**Scoring notes:**
- A: All three artefact references present. Metric M2 named in benefit linkage — this story is the non-engineer entry point, directly enabling M2 measurement. Systemic LOWs only.
- B: Out-of-scope explicitly excludes journey listing, resume, feature-slug entry on the form, and licence check before journey start. No scope creep vs discovery MVP.
- C: 7 ACs in Given/When/Then. Auth guard tested (AC2, AC5). No hidden internal IDs in form (AC6 explicit XSS/exposure check). AC7 contains the MEDIUM terminology mismatch (`sessionManager.createSession`). Score reduced to 3 for MEDIUM finding but still PASS (≥ 3 threshold).
- D: Non-engineer persona named, user story in As/Want/So, benefit linkage with mechanism, out-of-scope populated, NFRs (security re: no internal IDs in form, performance ≤100ms). Complexity/Scope stability absent (1-L1).
- E: `renderShell`, `escHtml` mandated. `req.session.accessToken` canonical field called out. Route handler in `routes/journey.js` (not inlined). ADR-011 satisfied (story artefact exists). Copilot licence check absence justified consistently with existing HTML routes.

---

## Action required before /test-plan

**Fix 1-M1:** Update AC7 in `ougl-3-journey-entry-and-start.md` to name `registerHtmlSession` (or the session-creation call chain) rather than the non-existent `sessionManager.createSession`.

---

## Summary

0 HIGH, 1 MEDIUM, 2 LOW across ougl.3.
**Outcome: PASS** — 1 MEDIUM must be resolved (or acknowledged in /decisions) before /test-plan.
