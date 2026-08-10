## Definition of Ready: rht-s1 — A completed stage's resumed history silently drops its final assistant message when nothing followed it

**Story:** artefacts/2026-08-10-resume-history-trailing-turn-fix/stories/rht-s1-trailing-assistant-turn-shown-in-history.md
**Review artefact:** artefacts/2026-08-10-resume-history-trailing-turn-fix/review/rht-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-resume-history-trailing-turn-fix/test-plans/rht-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/journey.js` — `handleGetJourneyStageView`'s `_priorQA`-building loop only (~line 924-937).
- New test file: `tests/check-rht-s1-trailing-assistant-turn.js`.

**Files explicitly out of scope (must not be touched):**
- `readOnly` suppression logic in `chat-view.js` — untouched.
- `_dshTurns` fetching, `extractCanvasBlocksFromTurns`, or any other part of `handleGetJourneyStageView` outside the exact loop named above.
- `routes/skills.js`'s own, separate live-page turn-rendering logic — unaffected.

### Architecture Constraints

No new architectural decision — reuses the existing lone-`user`-turn display shape (`{question: '', answer: content, modelResponse: ''}`) for the newly-included lone-trailing-assistant case. No ADR required.

### Human oversight

**Low** — a small, precisely-scoped change to one loop, with strong existing regression coverage (`dsh-s3`'s own tests) to re-run alongside the new ones.

### Coding Agent Instructions

1. In `src/web-ui/routes/journey.js`'s `_priorQA`-building loop, change the `else` branch (currently a no-op comment "last unanswered assistant turn -- dropped, per AC5 above") to instead push an answer-only entry:
   ```javascript
   if (_dshTurn.role === 'assistant') {
     var _dshNext = _dshTurns[_dshI + 1];
     if (_dshNext && _dshNext.role === 'user') {
       _priorQA.push({ question: _dshTurn.content, answer: _dshNext.content, modelResponse: '' });
       _dshI++;
     } else {
       // rht-s1: a trailing assistant turn with no following reply is the
       // skill's actual final recorded message for this (already-completed)
       // stage -- readOnly:true already suppresses any interactive "answer
       // this" affordance regardless of turn content, so displaying it here
       // is safe and shows the real historical record instead of nothing.
       _priorQA.push({ question: '', answer: _dshTurn.content, modelResponse: '' });
     }
   } else if (_dshTurn.role === 'user') {
     _priorQA.push({ question: '', answer: _dshTurn.content, modelResponse: '' });
   }
   ```
2. Update the surrounding comment block (lines ~916-923) to reflect the corrected behaviour — remove the now-inaccurate "a trailing unanswered assistant turn is intentionally dropped" claim.
3. Write the 5 tests per the test plan.
4. Run the new test file plus `check-dsh-s3-breadcrumb-split-view.js` and `check-dsh-s3-render-chat-readonly.js` unmodified — zero regression, specifically confirming the existing AC1 (paired case) and AC2 (zero-turns case) assertions still pass exactly as before.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — text-content-presence checks only, no new layout)

**PROCEED: Yes**
