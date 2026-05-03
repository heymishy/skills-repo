# AC Verification Script: wuce.3 — Submit attributed sign-off via GitHub Contents API

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.3-attributed-signoff.md
**Test plan reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.3-attributed-signoff-test-plan.md
**Verification script author:** Copilot
**Date:** 2026-05-02

---

## Pre-verification checks

```bash
node tests/check-wuce3-attributed-signoff.js
ls tests/fixtures/github/contents-api-write-success.json
ls tests/fixtures/github/contents-api-conflict.json
ls tests/fixtures/markdown/discovery-unsigned.md
ls tests/fixtures/markdown/discovery-signed.md
```

---

## AC1 — Sign-off on unsigned artefact → Contents API commit with ## Approved by section

**Automated evidence:** T1.1, T1.2, T1.3, IT1

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** All tests pass; payload contains `## Approved by` section with name and ISO timestamp.

**Manual confirmation:**
> **Note:** The sign-off UI button is not yet built (later story). Manual confirmation uses `curl` against the live API. You need a valid session cookie from the running app — sign in at `http://localhost:3000`, then copy the `session` cookie value from DevTools → Application → Cookies.

1. Sign in at `http://localhost:3000`; copy the `session` cookie value from DevTools
2. POST to the sign-off endpoint with a real artefact path:
   ```bash
   curl -s -X POST http://localhost:3000/sign-off \
     -H "Content-Type: application/json" \
     -H "Cookie: session=<your-session-cookie>" \
     -d '{"artefactPath": "artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md"}' \
     | python -m json.tool
   ```
3. Confirm response is `{"success": true, ...}`
4. Navigate to the repository in GitHub → `artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md` → confirm a commit appears with your GitHub identity as author/committer and a `## Approved by` section at the end of the file

**Pass condition:** Commit visible in GitHub with correct author identity; `## Approved by` section in committed file. ✅ / ❌

---

## AC2 — Post sign-off refresh shows ## Approved by with name and timestamp

**Automated evidence:** IT2

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Manual confirmation (state-dependent gap):**
1. Complete the sign-off curl from AC1 manual step
2. Fetch the artefact content directly:
   ```bash
   curl -s http://localhost:3000/artefact/2026-05-02-web-ui-copilot-execution-layer/discovery \
     -H "Cookie: session=<your-session-cookie>"
   ```
3. Confirm the response body contains `## Approved by` with your display name and an ISO 8601 timestamp

**Pass condition:** Section visible with correct name and ISO 8601 timestamp after page refresh. ✅ / ❌

---

## AC3 — Git commit author/committer is authenticated user's identity

**Automated evidence:** T3.1, IT1 (via mock capture)

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Manual confirmation:**
> Requires a second GitHub account or re-running after the AC1 sign-off has been reverted on GitHub.
1. Open the commits page for `artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md` in GitHub after the AC1 curl
2. Confirm the commit shows your GitHub username as both author and committer
3. Confirm no `github-actions[bot]` or service account identity appears

**Pass condition:** Both author and committer show the authenticated user's identity. ✅ / ❌

---

## AC4 — Path traversal → 400, no Contents API call

**Automated evidence:** T4.1, T4.2, IT3

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** All tests pass; 400 returned; mock Contents API not called.

**Manual confirmation:**
1. Using curl or a REST client, POST to `/sign-off` with body `{"artefactPath": "../../etc/passwd"}`
2. Confirm 400 response; confirm no GitHub API call occurs (check application logs — no outbound Contents API request logged)

**Pass condition:** 400 response; no API call in logs. ✅ / ❌

---

## AC5 — Conflict → "Artefact was updated" message

**Automated evidence:** T5.1, IT4

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** All tests pass; 409 returned with reload instruction.

**Manual confirmation:**
> **Note:** AC5 and AC6 require state from prior steps. AC5 needs two sign-off attempts with the same SHA (conflict); AC6 needs the file already signed off. These are exercised fully by the automated tests — manual confirmation is optional.
1. To confirm AC5 manually: attempt the AC1 curl a second time without reverting the file — the SHA will be stale, triggering a 409 with `"Artefact was updated — please reload"`
2. Confirm the 409 response body contains that message

**Pass condition:** Conflict error message shown; page reloads to latest version. ✅ / ❌

---

## AC6 — Already signed off → message + button disabled

**Automated evidence:** T6.1, T6.2, IT5

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** All tests pass; 409 returned; Contents API PUT not called.

**Manual confirmation (layout-dependent gap):**
1. Navigate to a discovery artefact that already has a `## Approved by` section
2. Confirm the sign-off button is visually disabled (greyed out, not clickable)
3. Confirm the message "Already signed off by [name] on [date]" is visible
4. Attempt to click the button — confirm it does not submit

**Pass condition:** Button disabled; message displayed with approver info. ✅ / ❌

---

## NFR verification

### Security — Rate limiting

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** 11th request returns 429.

### Audit — Sign-off event logged

```bash
node tests/check-wuce3-attributed-signoff.js
```

### Security — No server write token

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** All NFR tests pass.

---

## Full suite run

```bash
node tests/check-wuce3-attributed-signoff.js
```

**Expected:** 0 failures.

---

## Completion criteria

- [ ] All tests pass with 0 failures (`node tests/check-wuce3-attributed-signoff.js`)
- [ ] Fixture files committed (`contents-api-write-success.json`, `contents-api-conflict.json`, `discovery-unsigned.md`, `discovery-signed.md`)
- [ ] AC1 manual confirmation: commit appears in GitHub with user's identity
- [ ] AC2 manual confirmation: ## Approved by section visible after refresh
- [ ] AC3 manual confirmation: author/committer is authenticated user (not service account)
- [ ] AC5 manual confirmation: conflict message shown; page reloads
- [ ] AC6 manual confirmation: button disabled; message displayed
- [ ] NFR1 rate-limiting test passing
- [ ] NFR3 no server-level write token confirmed
