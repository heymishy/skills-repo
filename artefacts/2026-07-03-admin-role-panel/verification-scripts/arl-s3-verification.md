# AC Verification Script: arl-s3 — Admin credits page: view all balances and submit top-up

**Story reference:** artefacts/2026-07-03-admin-role-panel/stories/arl-s3.md
**Technical test plan:** artefacts/2026-07-03-admin-role-panel/test-plans/arl-s3-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Scenarios 1–6 and 8–9 are automated tests run via terminal.
2. Scenario 7 🔴 is a manual browser test and requires the Fly.io deployment with arl-s1 and arl-s2 already live.
3. For the manual scenario: log in to the deployed app as `heymishy` (GitHub OAuth) first.

**Automated test command:**
```
node tests/check-arl-s3-admin-credits.js
```

**To start the server locally for the manual scenario (Scenario 7):**
```powershell
# PowerShell — load .env then start server
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```
```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

**Reset between scenarios:** Not needed for automated tests. For Scenario 7: refresh the `/admin/credits` page between keyboard navigation passes.

---

## Scenarios

---

### Scenario 1: Admin credits page loads with all tenants and balances (automated)

**Covers:** AC1

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: GET /admin/credits renders HTML with tenant list`

**Expected outcome:**
> The test passes. The HTML response contains every tenant ID and its current credit balance. No tenant is missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Each tenant row has a top-up form (automated)

**Covers:** AC2

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: GET /admin/credits HTML includes form with correct action and field names`

**Expected outcome:**
> The test passes. The page HTML contains form elements with `action="/api/admin/credits/adjust"`, a `tenantId` field, an `amount` number input, and a submit button — one for each tenant.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Submitting a valid top-up updates the balance (automated)

**Covers:** AC3

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: POST /api/admin/credits/adjust with valid data updates balance and redirects`
3. Also look for: `PASS: POST handler reads body from req.body and calls adjustBalance with parsed integer`

**Expected outcome:**
> Both tests pass. When a valid `tenantId` and positive integer `amount` are submitted, the credits balance increases by that amount and the response redirects to `/admin/credits`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Invalid amounts are rejected (automated — 3 edge cases)

**Covers:** AC4

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for all three:
   - `PASS: POST /api/admin/credits/adjust with amount=0 returns 400`
   - `PASS: POST /api/admin/credits/adjust with negative amount returns 400`
   - `PASS: POST /api/admin/credits/adjust with non-numeric amount returns 400`

**Expected outcome:**
> All three tests pass. Zero, negative, and non-numeric amounts all return HTTP 400 and leave the credit balance unchanged.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Non-admin cannot view the credits page (automated)

**Covers:** AC5

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: Non-admin GET /admin/credits returns 403`

**Expected outcome:**
> The test passes. A non-admin user trying to access `/admin/credits` gets HTTP 403. No tenant data is included in the response.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Non-admin cannot submit top-up (automated)

**Covers:** AC6

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: Non-admin POST /api/admin/credits/adjust returns 403`

**Expected outcome:**
> The test passes. A non-admin user submitting any POST body to `/api/admin/credits/adjust` gets HTTP 403. No balance is changed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7 🔴 (manual browser — RISK-ACCEPT): Keyboard navigation works on credits page

**Covers:** AC7

**Steps:**
1. Open a browser (Chrome, Edge, or Firefox). Log in to the app as `heymishy` (GitHub OAuth).
2. Navigate to `/admin/credits`.
3. Press Tab. The first form's amount input should receive keyboard focus (you should see a focus outline).
4. Press Tab again. Focus should move to the submit button for the first tenant.
5. Press Tab again. Focus should move to the next tenant's amount input.
6. Repeat until you have tabbed through all visible tenants.
7. Navigate back to the first tenant's amount input. Type `10` in the field.
8. Press Tab to reach the submit button. Press Enter (or Space).

**Expected outcome:**
> Step 3–6: Every form element (amount input and submit button) on the page is reachable via Tab key. Focus is visible on each element.
> Step 7–8: Pressing Enter on the submit button submits the form. The page redirects to `/admin/credits` and the balance for that tenant has increased by 10.

**Broken behaviour looks like:** The Tab key skips some forms, focus is invisible (no outline), or pressing Enter on the button does not submit the form.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: Unknown tenantId in top-up is rejected (automated)

**Covers:** AC8

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: POST with unknown tenantId returns 400`

**Expected outcome:**
> The test passes. If a `tenantId` that does not exist in the credits table is submitted, HTTP 400 is returned and no balance row is created or modified.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 9: HTML-escaping prevents raw HTML injection (automated — security)

**Covers:** AC9

**Steps:**
1. Run: `node tests/check-arl-s3-admin-credits.js`
2. Look for: `PASS: GET /admin/credits HTML-escapes tenantId with special characters`

**Expected outcome:**
> The test passes. A tenant ID containing `<b>` or `<script>` characters is rendered as `&lt;b&gt;` in the HTML — the browser displays the literal text rather than interpreting it as a tag.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Page loads with tenant list | | |
| Scenario 2 — Top-up forms present | | |
| Scenario 3 — Valid top-up works | | |
| Scenario 4 — Invalid amounts rejected | | |
| Scenario 5 — Non-admin GET blocked | | |
| Scenario 6 — Non-admin POST blocked | | |
| Scenario 7 🔴 — Keyboard navigation (manual) | | |
| Scenario 8 — Unknown tenantId rejected | | |
| Scenario 9 — HTML escaping | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
