# Contract Proposal: CSRF field on the live-injected gate-confirm form

**Story reference:** artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- In `src/web-ui/routes/skills.js`: add `var CSRF_TOKEN = "' + escHtml(csrfToken) + '";` immediately alongside the existing `GATE_CONFIRM_URL`/`NEXT_STAGE_LABEL` declarations (~line 3084-3085).
- `_renderChatPage`'s signature gains a `csrfToken` parameter (it does not currently have one at this point in the file, despite `jgcc-s1` computing one at its call site for the separate `ougl.4` branch — confirmed the function only takes `(skillName, sessionId, session, backUrl, navContext)`; the existing `ougl.4` branch already references a `csrfToken` variable so this must already be threaded through some other captured scope or `jgcc-s1`'s parameter addition needs re-confirming against the live call site before assuming its exact shape).
- In `showCommitLink()`'s injected form HTML (~line 3714), insert `+ '<input type="hidden" name="_csrf" value="' + CSRF_TOKEN + '">'` between the opening `<form>` tag and the `<button>`.

## What will NOT be built

- No change to the already-correct server-rendered `ougl.4` branch.
- No change to the `definition-of-ready` branch's plain `<a href>` link.
- No removal of `csdl-s1`'s diagnostic logging (separate follow-up).
- No broader audit of other `innerHTML`-injected forms (logged as a `/capture` recommendation instead).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Regex-extract `var CSRF_TOKEN = "([a-f0-9]+)";` from `handleGetChatHtml`'s response; assert equals `req.session.csrfToken` | Unit |
| AC2 | Regex-extract `showCommitLink`'s function body; assert it references `CSRF_TOKEN` while building a `name="_csrf"` field | Unit |
| AC3 | Live click-through on `wuce-staging` post-deploy, same reproduction method that found the bug | Manual |
| AC4 | Re-run `check-jgcc-s1-chat-gate-confirm-csrf-field.js` and the 5 chat-page-adjacent files | Integration (existing) |

## Assumptions

- `_renderChatPage`'s exact current parameter list and where `csrfToken` is actually already in scope at the point `script` is built must be re-verified directly against the live file before implementing — the DoR contract's own "what will be built" section flags this as unconfirmed rather than assuming the summary from a prior session's own notes is still accurate.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only. Services: none. APIs: none.
