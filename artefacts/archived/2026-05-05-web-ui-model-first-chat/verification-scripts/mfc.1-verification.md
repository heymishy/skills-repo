# Verification Script — mfc.1: Model-First Chat-Driven Skill Session

**Story:** mfc.1 — Model-First Chat-Driven Skill Session Architecture
**Skill:** model-first chat architecture for web UI skill sessions
**Verified by:** post-implementation manual smoke test

---

## Pre-conditions

- Server running locally: `npm run dev` or `node --env-file=.env src/web-ui/server.js`
- Authenticated GitHub session (cookie present)
- `COPILOT_REPO_PATH` set to this repo root
- At least one skill present under `.github/skills/` (e.g. `discovery`)

---

## AC1 — POST session redirects to `/chat` not `/next`

1. Navigate to `/skills` in browser
2. Click a skill (e.g. **discovery**)
3. Submit the session creation form
4. **Expected:** browser is redirected to `/skills/discovery/sessions/<id>/chat` (URL contains `/chat`)
5. **Fail condition:** URL contains `/next` after redirect

---

## AC2 — Chat page has correct HTML structure

1. Observe the page rendered at the `/chat` URL from AC1
2. **Expected:** page contains a scrollable messages area, a text input field, and a Send button
3. Open browser DevTools → Elements
4. **Expected:** `#chat-messages` div exists; `#chat-form` form exists; `#chat-input` textarea exists
5. **Expected:** the JavaScript on the page posts to `/api/skills/<name>/sessions/<id>/turn`
6. **Fail condition:** any of the four elements missing; form target is wrong path

---

## AC3 — Initial model turn fires with `Begin the session.` / empty history

1. On the `/chat` page load, observe the `#chat-messages` area
2. **Expected:** at least one assistant message appears — the model's opening question or greeting
3. Open browser DevTools → Network → reload `/chat` URL
4. **Expected:** no `/turn` POST on page load; the initial response is rendered server-side
5. **Fail condition:** `#chat-messages` is empty on load; or a POST to `/turn` occurs on page load

---

## AC4 — Single `_skillTurnExecutor` call per turn; both turns appended to `session.turns`

1. Type a response into `#chat-input` and press Send
2. **Expected:** your message appears in `#chat-messages` as a user bubble (blue)
3. **Expected:** a new assistant message appears below it (the model's response)
4. Repeat for a second message
5. **Expected:** conversation grows — each user/assistant pair appends correctly
6. **Fail condition:** messages don't appear; only one side of the conversation shows; duplicate messages

---

## AC5 — Artefact signal parsed; `session.done = true`; artefact path derived from slug + skill name

*Note: requires the model to produce a full artefact response, which may not happen in a short smoke test. Verify by running an actual discovery session to completion.*

1. Complete a full skill session by answering all questions until the model outputs an artefact
2. **Expected:** when the model's response contains `---ARTEFACT-START---` ... `---ARTEFACT-END---` and `---SLUG---`, the chat form is replaced with a "Review and commit artefact" link
3. Click the link → navigate to `/commit-preview`
4. **Fail condition:** the link never appears; navigating to `/commit-preview` shows empty content

---

## AC6 — `commit-preview` page shows `session.artefactContent` and `session.artefactPath`

1. After AC5 completes, navigate to `/skills/<name>/sessions/<id>/commit-preview`
2. **Expected:** the page shows the full artefact content (markdown text produced by the model)
3. **Expected:** the proposed file path shown matches `artefacts/<slug>/<skill-name>.md`
4. **Fail condition:** preview is blank; path is wrong format

---

## AC7 — `buildSystemPrompt` includes copilot-instructions, SKILL.md, product context, protocol

*Verified by automated tests T7.1–T7.3 in `check-mfc1-model-first-chat-session.js`.*

Manual confirmation:
1. Run `node -e "const r=require('./src/web-ui/routes/skills'); const p=r.buildSystemPrompt('discovery', null, process.cwd()); console.log(p.slice(0,500));"` from repo root
2. **Expected:** output includes text from `.github/copilot-instructions.md`
3. **Expected:** output includes `--- SKILL: discovery ---` section
4. **Expected:** output includes `--- WEB UI PROTOCOL ---` section near end
5. **Fail condition:** any of the three sections missing from output

---

## AC8 — `skillTurnExecutor` builds `[system, ...history, user]` messages array

*Verified by automated tests T8.1–T8.3 in `check-mfc1-model-first-chat-session.js`.*

---

## AC9 — `setNextQuestionExecutorAdapter` and `setSectionDraftExecutorAdapter` exported as no-ops

1. Run: `node -e "const r=require('./src/web-ui/routes/skills'); r.setNextQuestionExecutorAdapter(function(){}); r.setSectionDraftExecutorAdapter(function(){}); console.log('no error');"` from repo root
2. **Expected:** output is `no error` — no exception thrown
3. **Fail condition:** an error or exception is thrown

---

## AC10 — `npm test` passes with 0 failures

1. From repo root, run: `npm test`
2. **Expected:** all test files report 0 failures
3. **Fail condition:** any test reports FAIL or non-zero exit code

---

## Post-merge smoke test checklist

- [ ] Server starts without error (`npm run dev`)
- [ ] Redirect from form submit goes to `/chat` (AC1)
- [ ] Initial assistant message visible on `/chat` page load (AC3)
- [ ] User can type a message and receive a reply (AC4)
- [ ] `/auth/github` redirect if no session cookie on `/chat` (auth guard)
- [ ] `npm test` passes (AC10)
