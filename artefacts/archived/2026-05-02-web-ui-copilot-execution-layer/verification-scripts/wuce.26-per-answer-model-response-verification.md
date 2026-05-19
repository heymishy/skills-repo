# AC Verification Script: wuce.26 — Per-answer model response in skill HTML flow

**Story:** wuce.26 — Per-answer model response in skill HTML flow
**Date:** 2026-05-04
**Version:** 1.0

---

## Setup

This script serves three purposes:
1. **Pre-code sign-off** — confirm the described behaviour is correct before coding begins
2. **Post-merge smoke test** — confirm shipped behaviour matches this description
3. **Delivery review** — structured walkthrough for stakeholders

**Prerequisites:**

Load environment variables and start the server (required before any scenario):

```powershell
# PowerShell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Navigate to `http://localhost:3000` in a browser. Sign in with GitHub OAuth if redirected.

**Reset between scenarios:** Clear browser cookies or open a new private/incognito window.

---

## Scenario 1 — Model response appears after submitting first answer (AC1, AC3)

**What this verifies:** After submitting an answer, the next question page shows a model response above the question form.

**Steps:**
1. Open a browser and navigate to `http://localhost:3000/skills`
2. Click on any skill (e.g. "Discovery")
3. On the skill launch page, click "Start session" or the equivalent button
4. Read the first question shown in the form
5. Type a meaningful answer into the text field (at least 2–3 sentences)
6. Click "Submit" (or equivalent)
7. Observe the page that loads for the second question

**Expected result:**
- Below the page heading and above the prior Q&A transcript, there is a distinct block labelled with something like "Model response" or a visual separator
- That block contains a short paragraph of text that acknowledges your answer and provides some context or framing relevant to the skill
- The prior Q&A transcript below it shows "Q1:" followed by the question text you saw, and "Your answer:" followed by the text you typed
- The second question form appears below both of those sections

**What broken looks like:** The page for question 2 shows only the question form with no model response block above the prior Q&A. Or the model response block is present but empty.

---

## Scenario 2 — No model response block on question 1 (AC4)

**What this verifies:** The first question page does not show an empty placeholder or model response block.

**Steps:**
1. Start a new skill session (fresh login or new incognito window)
2. Observe the first question page before submitting anything

**Expected result:**
- The page shows only the question form (question text + text input + submit button)
- There is NO "Model response" section or empty box above or below the question form
- There is NO "Prior Q&A" section (nothing has been submitted yet)

**What broken looks like:** An empty model response block or empty prior Q&A section appears above the question form.

---

## Scenario 3 — API failure is handled gracefully — session continues (AC2)

**What this verifies:** If the Copilot API is unavailable, the skill session continues without an error page.

**Note:** This scenario requires temporarily disabling or pointing to a broken API endpoint. If you cannot do this, mark as "manual smoke test — deferred to post-deployment". Use environment variable `WUCE_TURN_MODEL_BROKEN=true` if the implementation supports it, or temporarily revoke the token.

**Steps:**
1. Revoke or corrupt the `GITHUB_TOKEN` / `accessToken` value in `.env` to cause API calls to fail
2. Start the server fresh with the broken token
3. Start a skill session and navigate to question 1
4. Submit an answer
5. Observe the next page

**Expected result:**
- The browser is NOT shown an error page (no "500 Internal Server Error" or stack trace)
- Question 2 loads normally
- The model response block for question 1 is either absent or shows a graceful fallback (e.g. "Model response unavailable")
- The prior Q&A transcript shows Q1 and your answer correctly

**What broken looks like:** A 500 error page, or an unhandled exception, or the session hanging indefinitely.

---

## Scenario 4 — Model response is included in the artefact preview (AC7)

**What this verifies:** The generated artefact preview includes the model responses alongside each answer.

**Steps:**
1. Start a skill session
2. Answer ALL questions in the session (go through every question)
3. Reach the artefact preview page
4. Read through the preview content

**Expected result:**
- The preview shows each Q&A pair
- After each answer (or below it), the model's response for that turn is visible in the preview text
- Turns where the model failed (if any) do not show an empty or null entry — those sections are omitted cleanly

**What broken looks like:** The preview shows only questions and answers with no model responses. Or the preview shows "null" or "[object Object]" where a model response should be.

---

## Scenario 5 — Model response rendered safely (NFR — Security)

**What this verifies:** Model response content containing HTML special characters does not inject tags into the page.

**Steps:**
1. If you can control the test skill's questions, set up a skill where the model is likely to return angle brackets or script content (e.g. ask a question about HTML/JS code)
2. Alternatively, intercept the API response in browser DevTools Network panel and note the raw model response text
3. Check whether any angle-bracket content in the response appears as rendered HTML or as escaped text

**Expected result:**
- Any `<`, `>`, or `&` characters in the model response appear as literal characters (`&lt;`, `&gt;`, `&amp;`) in the page source
- No `<script>` or arbitrary HTML tags from the model response are executed or rendered as DOM elements

**What broken looks like:** The model response containing `<b>bold</b>` renders as **bold** instead of showing the literal text `<b>bold</b>`.

---

## Summary

| Scenario | AC(s) | Status (fill in at smoke test) |
|----------|-------|-------------------------------|
| 1 — Model response after answer 1 | AC1, AC3 | ⬜ |
| 2 — No placeholder on question 1 | AC4 | ⬜ |
| 3 — API failure graceful degradation | AC2 | ⬜ |
| 4 — Model response in artefact preview | AC7 | ⬜ |
| 5 — Safe HTML rendering of model response | NFR-Security | ⬜ |
