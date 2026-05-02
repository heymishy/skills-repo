# AC Verification Script: wuce.3 — Submit attributed sign-off via GitHub Contents API

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.3-attributed-signoff.md
**Test plan reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.3-attributed-signoff-test-plan.md
**Verification script author:** Copilot
**Date:** 2026-05-02

---

## Pre-verification checks

```bash
npx jest tests/wuce.3 --ci
ls tests/fixtures/github/contents-api-write-success.json
ls tests/fixtures/github/contents-api-conflict.json
ls tests/fixtures/markdown/discovery-unsigned.md
ls tests/fixtures/markdown/discovery-signed.md
```

---

## AC1 — Sign-off on unsigned artefact → Contents API commit with ## Approved by section

**Automated evidence (Jest):** T1.1, T1.2, T1.3, IT1

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC1|buildSignOffPayload|commitSignOff|POST /sign-off.*200"
```

**Expected:** All tests pass; payload contains `## Approved by` section with name and ISO timestamp.

**Manual confirmation:**
1. Sign in; navigate to a discovery artefact without a sign-off section
2. Click "Sign off this artefact" and confirm the dialog
3. Navigate to the repository in GitHub and confirm the commit appears with your GitHub identity as author/committer
4. Confirm the commit message contains the user's display name and a reference to the artefact

**Pass condition:** Commit visible in GitHub with correct author identity; `## Approved by` section in committed file. ✅ / ❌

---

## AC2 — Post sign-off refresh shows ## Approved by with name and timestamp

**Automated evidence (Jest):** IT2

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC2|after sign-off|Approved by.*section"
```

**Manual confirmation (state-dependent gap):**
1. Complete the sign-off flow from AC1 manual step
2. Refresh the artefact view page
3. Confirm `## Approved by` section is visible with the user's display name and sign-off timestamp

**Pass condition:** Section visible with correct name and ISO 8601 timestamp after page refresh. ✅ / ❌

---

## AC3 — Git commit author/committer is authenticated user's identity

**Automated evidence (Jest):** T3.1, IT1 (via mock capture)

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC3|author.*identity|committer.*identity|service account"
```

**Manual confirmation:**
1. Complete sign-off from a test account (e.g. `test-stakeholder` GitHub account)
2. Open the commit in GitHub → confirm "Authored by test-stakeholder" and "Committed by test-stakeholder"
3. Confirm no `github-actions[bot]` or service account identity appears

**Pass condition:** Both author and committer show the authenticated user's identity. ✅ / ❌

---

## AC4 — Path traversal → 400, no Contents API call

**Automated evidence (Jest):** T4.1, T4.2, IT3

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC4|path traversal|validateArtefactPath|400"
```

**Expected:** All tests pass; 400 returned; mock Contents API not called.

**Manual confirmation:**
1. Using curl or a REST client, POST to `/sign-off` with body `{"artefactPath": "../../etc/passwd"}`
2. Confirm 400 response; confirm no GitHub API call occurs (check application logs — no outbound Contents API request logged)

**Pass condition:** 400 response; no API call in logs. ✅ / ❌

---

## AC5 — Conflict → "Artefact was updated" message

**Automated evidence (Jest):** T5.1, IT4

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC5|SignOffConflictError|409|Artefact was updated"
```

**Expected:** All tests pass; 409 returned with reload instruction.

**Manual confirmation:**
1. Open the artefact page in two browser tabs simultaneously
2. Sign off in tab 1 — succeeds
3. Sign off in tab 2 (using stale SHA) — should fail with conflict
4. Confirm the "Artefact was updated — please reload" message appears in tab 2
5. Confirm tab 2 automatically reloads to show the latest artefact version

**Pass condition:** Conflict error message shown; page reloads to latest version. ✅ / ❌

---

## AC6 — Already signed off → message + button disabled

**Automated evidence (Jest):** T6.1, T6.2, IT5

```bash
npx jest tests/wuce.3 --ci --testNamePattern="AC6|detectExistingSignOff|already signed|disabled"
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
npx jest tests/wuce.3 --ci --testNamePattern="NFR1|rate.limit|429"
```

**Expected:** 11th request returns 429.

### Audit — Sign-off event logged

```bash
npx jest tests/wuce.3 --ci --testNamePattern="NFR2|audit|signoff_submitted"
```

### Security — No server write token

```bash
npx jest tests/wuce.3 --ci --testNamePattern="NFR3|server.*token|env.*token|PERSONAL_ACCESS_TOKEN"
```

**Expected:** All NFR tests pass.

---

## Full suite run

```bash
npx jest tests/wuce.3 --ci --coverage
```

**Expected:** 0 failures; `commitSignOff` adapter and sign-off route handler coverage ≥ 80%.

---

## Completion criteria

- [ ] All Jest tests pass with 0 failures
- [ ] Fixture files committed (`contents-api-write-success.json`, `contents-api-conflict.json`, `discovery-unsigned.md`, `discovery-signed.md`)
- [ ] AC1 manual confirmation: commit appears in GitHub with user's identity
- [ ] AC2 manual confirmation: ## Approved by section visible after refresh
- [ ] AC3 manual confirmation: author/committer is authenticated user (not service account)
- [ ] AC5 manual confirmation: conflict message shown; page reloads
- [ ] AC6 manual confirmation: button disabled; message displayed
- [ ] NFR1 rate-limiting test passing
- [ ] NFR3 no server-level write token confirmed
