## Test Plan: Replace the landing page's fake illustrative hash with a real, live-computed one

**Story reference:** artefacts/2026-08-09-crypto-card-real-hash-fix/stories/ccrh-s1-real-instruction-hash.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Card shows the real, current hash of skills/review/SKILL.md | 1 test | — | — | — | — | 🟢 |
| AC2 | No "✓ matches trace" claim; copy invites independent verification | 1 test | — | — | — | — | 🟢 |
| AC3 | Fails open to a safe fallback if the file is missing/unreadable | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing landing-page test suites unaffected | — | 1 full re-run | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** The real `skills/review/SKILL.md` file (for AC1) plus a temporarily-renamed-away version for AC3's fail-open test, following the exact same rename/restore-in-finally pattern already established in `tests/check-lccf-s1-fail-open-learnings-count.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | The real `skills/review/SKILL.md` file | Real repo file | None | Cross-checked against a directly-computed `crypto.createHash('sha256')` value in the test itself |
| AC2 | The rendered hero card HTML | Real render output | None | String assertions against the rendered markup |
| AC3 | A temporarily-renamed-away `skills/review/SKILL.md` | Real file, renamed for the test duration | None | Restored in a `finally` block |
| AC4 | Existing `check-lphf-s1-golden-trace-demo.js` (or equivalent landing-page suite) | Existing test file | None | Regression guard |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### instructionHash_computesRealSha256_ofSkillsReviewSkillMd

- **Verifies:** AC1
- **Precondition:** Real `skills/review/SKILL.md` present (the real condition in every environment, local and deployed)
- **Action:** Call the new hash-computation function
- **Expected result:** Returns a hash string matching `crypto.createHash('sha256').update(fs.readFileSync('skills/review/SKILL.md')).digest('hex')` computed independently in the test — not the old hardcoded `e3b0c4...` value
- **Edge case:** No

### heroCard_doesNotClaimMatchesTrace_invitesIndependentVerification

- **Verifies:** AC2
- **Precondition:** Rendered landing page HTML
- **Action:** Inspect the crypto-verification hero card's markup
- **Expected result:** The card does not contain the string "matches trace"; it contains text inviting the visitor to independently recompute the hash themselves (e.g. naming the file and hash algorithm)
- **Edge case:** No

### instructionHash_failsOpenToSafeFallback_whenFileMissing

- **Verifies:** AC3
- **Precondition:** `skills/review/SKILL.md` temporarily renamed away
- **Action:** Call the hash-computation function
- **Expected result:** Returns a safe fallback value (e.g. a placeholder string) without throwing — the landing page must still render
- **Edge case:** Yes — this is the exact fail-open requirement itself

---

## Integration Tests

### existingLandingPageSuite_passesUnaffected

- **Verifies:** AC4
- **Action:** Re-run the existing landing-page test suite(s) (`check-lphf-s1-golden-trace-demo.js` and any other file asserting on `handleRoot`'s rendered output) unchanged
- **Expected result:** All existing tests still pass — this fix is additive to one hero card only

---

## NFR Tests

None beyond the ACs above — Performance/Security/Accessibility are all "negligible"/"none identified" per the story's own NFR section; no dedicated NFR test needed beyond AC1-AC4's own coverage.

---

## Out of Scope for This Test Plan

- Building or testing a real trace-matching mechanism — explicitly out of scope for the story itself
- Any other hero card's content or tests

---

## Test Gaps and Risks

None identified.
