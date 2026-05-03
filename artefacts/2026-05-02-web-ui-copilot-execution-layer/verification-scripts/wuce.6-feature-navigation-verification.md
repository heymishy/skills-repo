# Verification Script: wuce.6 — Multi-feature navigation and artefact browser

**Story:** wuce.6-feature-navigation
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.6-feature-navigation-test-plan.md
**Run after:** implementation is complete on the feature branch

---

## Step 1 — Run test suite

```bash
cd <repo-root>
node tests/check-wuce6-feature-navigation.js
```

**Expected output:**
```
wuce.6 feature-navigation: 70 passed, 0 failed
```
    ✓ IT2 — GET /features/:slug returns artefact index with display labels
    ✓ IT3 — repo with no artefacts directory → "No artefacts found"
    ✓ IT4 — requires authentication
  NFR
    ✓ NFR1 — audit log on feature list access
    ✓ NFR2 — private repo not enumerated for unauthorised user

Tests: 21 passed, 21 total
```

**Fail condition:** any test fails → fix before proceeding.

---

## Step 2 — Verify shared fixture files exist

```bash
ls tests/fixtures/github/pipeline-state-feature.json
ls tests/fixtures/github/contents-api-artefact-list.json
ls tests/fixtures/github/contents-api-empty-artefacts.json
```

**Expected:** all three files present.

**Check no internal type identifiers in artefact list fixture:**
```bash
# contents-api-artefact-list.json should not expose internal type strings as rendered labels
# (the adapter converts them; the fixture is raw API data which is fine)
cat tests/fixtures/github/contents-api-artefact-list.json
# Expected: array of GitHub Contents API file entries with "name", "type", "path", "sha" fields
```

---

## Step 3 — Manual AC2 verification (no internal types rendered)

1. Start the server locally
2. Log in as `test-stakeholder`
3. Navigate to `/features`
4. Click on a feature to open the artefact index
5. **Expected:** all artefact types displayed as plain-language labels: "Discovery", "Benefit Metric", "Stories", "Test Plan", "Ready Check"
6. **Fail condition:** any internal identifier visible (e.g. `"dor"`, `"benefit-metric"`, `"test-plan"`) appears as rendered browser text

---

## Step 4 — Manual AC3 verification (artefacts grouped by stage)

1. Navigate to a feature's artefact index
2. **Expected:** artefacts grouped under stage headings (Discovery, Definition, Test Plan, DoR)
3. Each group heading is visible and each artefact appears under the correct group

---

## Step 5 — Manual AC4 verification (artefact link opens wuce.2 view)

1. Navigate to a feature's artefact index
2. Click any artefact link
3. **Expected:** navigated to wuce.2 artefact view; markdown rendered as formatted HTML

---

## Step 6 — Manual AC5 verification (repo with no artefacts directory)

Configure a test repository that has no `artefacts/` directory (or mock the 404 response), then:

1. Navigate to `/features`
2. If that repo appears in the feature list, click on it
3. **Expected:** "No artefacts found" message displayed; no error page or 500 response

---

## Step 7 — Full npm test (regression check)

```bash
npm test
```

**Expected:** all pre-existing tests pass; no new failures.

---

## AC verification checklist

| AC | Verified by | Status |
|---|---|---|
| AC1 | T3.1, T5.1, IT1 | [ ] |
| AC2 | T1.1–T1.6, T4.1, T5.2, IT2, Manual Step 3 | [ ] |
| AC3 | T2.1–T2.2, Manual Step 4 | [ ] |
| AC4 | T4.2, T5.1 (link href), Manual Step 5 | [ ] |
| AC5 | IT3, Manual Step 6 | [ ] |
