# Contract Proposal: Add the missing CSRF field to the in-chat gate-confirm button

**Story reference:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- In `src/web-ui/routes/skills.js`: `_renderChatPage`'s single call site (~line 4509, inside the already-`async` `handleGetChatHtml`) computes `var _csrfToken = await _csrf.generateCsrfToken(req);` and passes it as a new trailing parameter to `_renderChatPage`.
- `_renderChatPage`'s signature gains one new parameter (the token string); inside the `ougl.4` gate-confirm branch (`session.done && session.journeyId`, non-`definition-of-ready` skills), the form gains `_csrf.csrfField(_csrfToken)` as its first child, matching `journey.js`'s own already-correct sibling form.

## What will NOT be built

- No change to the `definition-of-ready` branch's plain `<a href>` link.
- No change to `_renderChatPage`'s own async-ness (stays synchronous).
- No resurrection of the dead `_renderChatPage_forTest` export.
- No broader audit of other forms — declared out of scope by the story.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render via `handleGetChatHtml` with a `done:true`, journey-linked, non-DoR session; assert the gate-confirm form contains `input[name="_csrf"]` matching `req.session.csrfToken` | Unit |
| AC2 | Submit that value through `csrfGuard`/`handlePostGateConfirm`; assert it passes | Unit |
| AC3 | Render with skill `definition-of-ready`; assert the plain link is unchanged, no `_csrf` field added there | Unit |
| AC4 | Re-run the 5 existing chat-page-adjacent test files | Integration (existing) |

## Assumptions

- None beyond what's stated in the story — root cause and fix are both confirmed directly against the real source.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` (`_renderChatPage`'s signature + its one call site) only. Services: none. APIs: none.
