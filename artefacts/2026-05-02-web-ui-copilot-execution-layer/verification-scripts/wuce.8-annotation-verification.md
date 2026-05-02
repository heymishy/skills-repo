# Verification Script: wuce.8 — Annotation and comment on artefact sections

**Story:** wuce.8-annotation
**Test plan:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.8-annotation-test-plan.md
**Run after:** implementation is complete on the feature branch

---

## Step 1 — Run Jest test suite

```bash
cd <repo-root>
npx jest tests/check-wuce8-annotation.js --verbose
```

**Expected output:**
```
PASS tests/check-wuce8-annotation.js
  sanitiseAnnotationContent
    ✓ T1.1 — strips <script> tags
    ✓ T1.2 — strips arbitrary HTML tags
    ✓ T1.3 — preserves plain text unchanged
    ✓ T1.4 — handles empty string without throwing
  validateAnnotationLength
    ✓ T2.1 — returns false for content exceeding 2000 characters
    ✓ T2.2 — returns true for exactly 2000 characters
    ✓ T2.3 — returns true for content under 2000 characters
  buildAnnotationBlock
    ✓ T3.1 — produces correctly structured block with all required fields
    ✓ T3.2 — timestamp is ISO 8601 format
    ✓ T3.3 — appends to existing ## Annotations section without creating a second one
  parseExistingAnnotations
    ✓ T4.1 — extracts annotations from artefact with ## Annotations section
    ✓ T4.2 — returns empty array when no ## Annotations section exists
    ✓ T4.3 — handles artefact with empty ## Annotations section
  renderAnnotations (DOM-state)
    ✓ T5.1 — annotation affordance present per section heading (keyboard focus)
    ✓ T5.2 — existing annotations rendered below their section
    ✓ T5.3 — artefact with no annotations renders cleanly
  POST /api/artefacts/:path/annotations
    ✓ IT1 — valid payload → annotation committed under user identity
    ✓ IT2 — script content → sanitised content committed
    ✓ IT3 — >2000 characters → 400 rejection
    ✓ IT4 — 409 on first commit → retry succeeds
    ✓ IT5 — 409 on both attempts → error returned to client
    ✓ IT6 — requires authentication
  NFR
    ✓ NFR1 — audit log on annotation submission
    ✓ NFR2 — committer identity is authenticated user

Tests: 24 passed, 24 total
```

**Fail condition:** any test fails → fix before proceeding.

---

## Step 2 — Verify fixture files exist

```bash
ls tests/fixtures/markdown/artefact-with-annotations.md
ls tests/fixtures/github/annotation-commit-success.json
ls tests/fixtures/github/annotation-commit-conflict.json
```

**Check annotation fixture structure:**
```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('tests/fixtures/markdown/artefact-with-annotations.md', 'utf8');
const hasAnnotationsSection = content.includes('## Annotations');
const hasAnnotatorName = content.includes('Jane Stakeholder');
console.log('has ## Annotations:', hasAnnotationsSection, '| has annotator name:', hasAnnotatorName);
"
# Expected: has ## Annotations: true | has annotator name: true
```

---

## Step 3 — Manual AC1 verification (annotation affordance)

1. Start the server locally
2. Log in and navigate to any artefact view
3. **Mouse:** Hover over a section heading — **Expected:** "Add annotation" affordance appears
4. **Keyboard:** Tab to a section heading — **Expected:** affordance is reachable and activatable via Enter/Space
5. **Fail condition:** affordance not keyboard-accessible; only reachable via mouse hover

---

## Step 4 — Manual AC2 verification (annotation committed with correct structure)

1. Navigate to an artefact view
2. Click "Add annotation" on a section (e.g. "Acceptance Criteria")
3. Type: `"This looks correct to me."`
4. Submit
5. Navigate to the raw GitHub file for that artefact
6. **Expected in the committed file:**
   - `## Annotations` section present at the end
   - `### On section: Acceptance Criteria` sub-heading
   - Display name (e.g. `**Test Stakeholder**`)
   - ISO 8601 timestamp (e.g. `2026-05-02T10:00:00Z`)
   - The annotation text
7. **Fail condition:** annotation committed under a service account rather than the logged-in user's identity

---

## Step 5 — Manual AC3 verification (existing annotations displayed)

1. Navigate to an artefact that already has an `## Annotations` section (use the fixture file or a pre-annotated artefact)
2. **Expected:** each annotation appears below its target section with annotator name, date, and text visible in the rendered view — not only in the raw markdown

---

## Step 6 — Manual AC4 + AC5 verification (server-side sanitisation and length limit)

**AC4 — XSS prevention:**
```bash
# POST annotation with script content
curl -s -X POST "http://localhost:3000/api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations" \
  -H "Content-Type: application/json" \
  -b "session=<valid-session>" \
  -d '{ "sectionHeading": "Summary", "annotationText": "Normal text <script>alert(1)</script> more text" }'
# Expected: 200; check committed file — script tags must be absent
```

**AC5 — Length limit:**
```bash
# POST annotation with 2001 characters
LONG=$(python3 -c "print('a' * 2001)")
curl -s -X POST "http://localhost:3000/api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations" \
  -H "Content-Type: application/json" \
  -b "session=<valid-session>" \
  -d "{\"sectionHeading\": \"Summary\", \"annotationText\": \"$LONG\"}"
# Expected: 400 error response; no partial annotation committed
```

---

## Step 7 — Manual AC6 verification (conflict retry behaviour)

To simulate a 409 conflict in development:
1. Open the artefact in two browser tabs simultaneously
2. Add an annotation in tab 1 and submit — let it succeed
3. Add a different annotation in tab 2 (which loaded before tab 1's change) and submit
4. **Expected:** tab 2 submission retries once and either succeeds (with the current SHA) or returns a clear "reload and retry" message to the user
5. **Fail condition:** silent failure; error 500; or partial/missing annotation written

---

## Step 8 — Full npm test (regression check)

```bash
npm test
```

**Expected:** all pre-existing tests pass; no new failures.

---

## AC verification checklist

| AC | Verified by | Status |
|---|---|---|
| AC1 | T5.1 (keyboard), Manual Step 3 | [ ] |
| AC2 | T3.1–T3.2, IT1, Manual Step 4 | [ ] |
| AC3 | T4.1, T5.2, Manual Step 5 | [ ] |
| AC4 | T1.1–T1.3, IT2, Manual Step 6 | [ ] |
| AC5 | T2.1–T2.3, IT3, Manual Step 6 | [ ] |
| AC6 | IT4, IT5, Manual Step 7 | [ ] |
