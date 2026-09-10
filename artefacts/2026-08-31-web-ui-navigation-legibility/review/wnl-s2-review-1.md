# Review Report: Make the "Continue to next stage" action persistently reachable regardless of scroll position — Run 1

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s2-persistent-next-stage-action.md
**Date:** 2026-09-10
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) / Completeness — `tests/check-lsbm-s1-live-substep-injection.js` (lsbm-s1) uses the literal string `'<div class="sw-journey-gate"'` as a slice-boundary anchor (lines 284, 299) to extract and assert against a portion of the rendered chat HTML. This story is not referenced anywhere in the story's own Architecture Constraints or Dependencies, and AC4 (the regression guard for sub-step affordance behaviour) does not mention this specific existing test's exact-string dependency.
  Risk if proceeding: If the sticky-positioning implementation changes the `.sw-journey-gate` div's own opening-tag attribute order or wraps it in a new outer container (rather than adding `position: sticky` via the existing `style="..."` attribute or the existing class, preserving `class="sw-journey-gate"` as a literal, findable substring), `lsbm-s1`'s slice-boundary lookup fails loudly (`assert.ok(end !== -1, ...)`) — a real, concrete regression risk, not hypothetical, since the exact anchor string is a runtime unit-test dependency, not just an informal convention.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add `tests/check-lsbm-s1-live-substep-injection.js` as an explicitly named regression check, and constrain the implementation approach (e.g. "the `class="sw-journey-gate"` attribute must remain the literal string used by the existing div's opening tag — add sticky positioning via `style` or an additional CSS rule targeting the existing class, not by restructuring the div itself") before `/test-plan`.

- **[1-M2]** Category E (Architecture compliance) — Same mis-citation as `wnl-s1`: Architecture Constraints cites "ADR-009 Express-less design" for the "no new npm dependencies" constraint. `.github/architecture-guardrails.md`'s real ADR-009 is "Evaluation and write-back workflows must be separate triggers" — unrelated. `CLAUDE.md` already documents this exact class of mistake as previously made and corrected elsewhere in this codebase.
  Risk if proceeding: Same as `wnl-s1`'s 1-M2 — a coding agent following the citation finds unrelated content.
  To acknowledge: run /decisions, category RISK-ACCEPT — or correct the citation before `/test-plan`.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW across 1 story.
**Outcome:** PASS

**Category scores:**

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |

Category E (Architecture compliance): 1 MEDIUM finding (1-M1) — Architecture Constraints correctly cites the reusable `.sw-imp-banner` sticky pattern and the exact file/line to modify, but omits a real, directly-relevant existing test dependency (`lsbm-s1`) whose exact-string anchor could break under a careless implementation.
