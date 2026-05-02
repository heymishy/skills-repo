# Verification Script: wuce.5 — Personalised action queue

**Story:** wuce.5-action-queue
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.5-action-queue-test-plan.md
**Run after:** implementation is complete on the feature branch

---

## Step 1 — Run Jest test suite

```bash
cd <repo-root>
npx jest tests/check-wuce5-action-queue.js --verbose
```

**Expected output:**
```
PASS tests/check-wuce5-action-queue.js
  hasPendingSignOff
    ✓ T1.1 — pending: returns true when ## Approved by is absent
    ✓ T1.2 — signed: returns false when ## Approved by is present
    ✓ T1.3 — edge: returns false for empty string
    ✓ T1.4 — case sensitivity: only matches exact ## Approved by heading
  getPendingActions
    ✓ T2.1 — returns pending items with required fields
    ✓ T2.2 — returns empty array when no artefact is pending
    ✓ T2.3 — includes only artefacts user has read access to
    ✓ T2.4 — repo access throws → treated as access failure, not exception propagation
  renderActionQueue (DOM-state)
    ✓ T3.1 — renders pending items with AC1 fields
    ✓ T3.2 — renders empty state with AC2 message
    ✓ T3.3 — renders banner when bannerMessage is set
    ✓ T3.4 — list items have descriptive link text
  GET /api/actions
    ✓ IT1 — returns pending items for authenticated user
    ✓ IT2 — returns empty state with correct response shape
    ✓ IT3 — repo returning 404 → omits items, sets banner
    ✓ IT4 — requires authentication
  NFR
    ✓ NFR1 — audit log entry on action queue load
    ✓ NFR2 — repository access validated server-side

Tests: 18 passed, 18 total
```

**Fail condition:** any test fails → do not proceed; fix before verification.

---

## Step 2 — Verify shared fixture files exist

```bash
ls tests/fixtures/markdown/artefact-pending-signoff.md
ls tests/fixtures/markdown/artefact-signed-off.md
ls tests/fixtures/github/pipeline-state-feature.json
ls tests/fixtures/github/contents-api-artefact-pending.json
ls tests/fixtures/github/repo-access-denied.json
```

**Expected:** all five files present; no "No such file" errors.

**Check fixture content:**
```bash
# artefact-pending-signoff.md must NOT contain "## Approved by"
grep -c "## Approved by" tests/fixtures/markdown/artefact-pending-signoff.md
# Expected: 0

# artefact-signed-off.md MUST contain "## Approved by"
grep -c "## Approved by" tests/fixtures/markdown/artefact-signed-off.md
# Expected: 1
```

---

## Step 3 — Manual AC3 verification (sign-off removes item from queue)

Requires wuce.3 to be implemented.

1. Log in as `test-stakeholder`
2. Confirm the action queue shows at least one pending item
3. Complete sign-off on that artefact (via wuce.3 sign-off flow)
4. Navigate back to the dashboard
5. Reload the page
6. **Expected:** the signed-off artefact no longer appears in the "Action required" section

**Pass condition:** item absent after sign-off + reload.

---

## Step 4 — Manual AC4 verification (artefact link navigation)

1. Log in as `test-stakeholder`
2. View the action queue with at least one pending item
3. Click the artefact link for any pending item
4. **Expected:** navigated to the artefact view (wuce.2 render); artefact content displayed

---

## Step 5 — Security verification (server-side repo access check)

```bash
# Call GET /api/actions without a session cookie
curl -i http://localhost:3000/api/actions
# Expected: 401 Unauthorized

# Call GET /api/actions with a valid session
curl -i -b "session=<valid-session>" http://localhost:3000/api/actions
# Expected: 200 with items array (may be empty)
```

---

## Step 6 — Full npm test (regression check)

```bash
npm test
```

**Expected:** all pre-existing tests pass; no new failures introduced by wuce.5 implementation.

---

## AC verification checklist

| AC | Verified by | Status |
|---|---|---|
| AC1 | T2.1, T3.1, IT1 | [ ] |
| AC2 | T3.2, IT2 | [ ] |
| AC3 | Manual Step 3 | [ ] |
| AC4 | T3.1 (link href), Manual Step 4 | [ ] |
| AC5 | T2.3, T2.4, T3.3, IT3 | [ ] |
