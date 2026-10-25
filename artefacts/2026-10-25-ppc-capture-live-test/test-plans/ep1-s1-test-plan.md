# Test Plan: ep1-s1 — Run Live Capture Session and Confirm Durable Record

**Feature:** 2026-10-25-ppc-capture-live-test
**Story:** ep1-s1
**Date:** 2026-10-25
**Review status at plan creation:** FAIL (1-H1 RISK-ACCEPT pending at DoR; 1-M1 resolved; 1-L1 noted)
**Test runner:** N/A — no automated tests; this is a production verification exercise

---

## Test Data Strategy

**Strategy:** Live production session — no synthetic data, no fixtures, no mocks.

The mechanism under test (ppc-s1/s2/s3) is already deployed to production. The "test input" is a real operator action in the live web UI. The "test output" is a real GitHub commit to the configured artefacts repository path.

**PCI / sensitivity constraints:** None. No card data, no PII, no sensitive fields involved. The capture record is a PNG screenshot of a skill session UI.

**Test data owner:** Platform operator / maintainer — the same person running the session.

**Test data availability:** Available immediately — no setup required beyond being authenticated in the production web UI.

**Test data gap:** None.

---

## AC Coverage Table

| AC | Description | Test type | Test IDs | Gap? |
|----|-------------|-----------|----------|------|
| AC1 | Capture record written: ≥1 non-empty PNG committed to GitHub artefacts path with successful commit status | Manual verification | MV-1, MV-2, MV-3 | No |
| AC2 | Record retrievable: tenant-scoped screenshot route returns and renders the committed PNG | Manual verification | MV-4 | No |

**Note on AC count:** Review finding 1-H1 flagged fewer than 3 ACs. Both ACs cover the two required verification surfaces (GitHub API path and web UI screenshot route). A third AC would be artificial for this binary verification exercise. RISK-ACCEPT to be logged at DoR.

---

## Unit Tests

**None.** No new code is introduced by this story. The capture mechanism (ppc-s1/s2/s3) already has unit test coverage from its own delivery stories. Adding unit tests here would be redundant and would not verify production behaviour.

---

## Integration Tests

**None.** The integration path (operator action → capture pipeline → GitHub Contents API → repository storage) is already covered by ppc-s1/s2/s3 integration tests. This story verifies that path works in the live production environment — a task only a human-run session can perform.

---

## NFR Tests

**None — confirmed.** The story NFR field states "None" (updated to "None — confirmed" per review finding 1-M1 resolution). No performance, security, or availability NFR thresholds apply to this one-time verification exercise.

---

## Gap Table

| AC | Gap type | Handling | Risk-accept justification |
|----|----------|----------|--------------------------|
| AC1 | No automated test possible | Manual verification only — production session | Production-only path; no mock or synthetic environment can substitute for a real GitHub commit with a real OAuth token. Verification is binary (commit exists or does not). |
| AC2 | No automated test possible | Manual verification only — HTTP route inspection | Route verification requires a live server with a real committed record; cannot be exercised in a unit or integration harness without defeating the purpose of the exercise. |

---

## AC Verification Script

**Audience:** Platform operator / maintainer
**Purpose:** Step-by-step human walkthrough covering both ACs. Use for:
1. **Pre-code sign-off** (N/A — no code; read as "pre-session confirmation that steps are correct")
2. **Post-session smoke test** — run immediately after completing the live capture session
3. **Delivery review** — evidence that the mechanism was verified in production

**Setup:**
- You must be authenticated in the live production web UI (not staging)
- The ppc-s1/s2/s3 capture mechanism must be deployed (confirm with the platform operator before starting)
- You will need access to the GitHub repository that hosts the configured artefacts storage path
- Have the GitHub repository open in a browser tab before starting

**Reset between scenarios:** Not needed — Scenario 1 produces the record that Scenario 2 verifies. Run them in sequence without resetting.

**Estimated time:** 5–10 minutes total.

---

### Scenario 1 — AC1: Capture record written to GitHub repository storage

**What you are checking:** After completing a live skill session in the web UI, at least one PNG file has been committed to the configured artefacts path in the GitHub repository, the file is non-empty, and the commit status shows success.

**Steps:**

**MV-1 — Run a live discovery skill session**

1. Open the live production web UI and navigate to the skill launcher.
2. Select the "discovery" skill and start a new session.
3. Complete the session through to the point where the capture pipeline is triggered. (The capture event is triggered when the session produces an artefact — follow the discovery skill prompts until you reach the artefact output step.)
4. Note the approximate time you completed the session — you will use this to identify the commit in GitHub.

**Expected:** The session completes without an error message related to the capture pipeline. (Any "capture failed" or "screenshot write error" banner is a failure signal — stop and investigate before proceeding to MV-2.)

**MV-2 — Confirm the commit exists in GitHub**

1. Open the GitHub repository that hosts the configured artefacts storage path.
2. Navigate to the artefacts directory (the path configured in ppc-s1/s2/s3 — check `src/web-ui/` or `context.yml` for the configured path if you are unsure).
3. Look for a new file committed within the last few minutes (matching the time noted in MV-1).
4. Click on the commit to see its status.

**Expected:** A commit exists. The commit status shows "success" (green checkmark or equivalent). The commit message identifies this as a capture record (not a manual or unrelated commit).

**Broken behaviour looks like:** No new commit in the expected time window; or a commit exists but shows a failed or partial status.

**MV-3 — Confirm the file is a non-empty, well-formed PNG**

1. From the GitHub repository file browser, click the file that was committed in MV-2.
2. GitHub will render a preview if it recognises the PNG format. Confirm the preview loads and shows an image (even a partial or thumbnail rendering is sufficient — what matters is that GitHub recognised the file as a valid PNG).
3. Optionally: download the file and confirm it opens in an image viewer without an error.

**Expected:** The file renders a preview in GitHub (not a "binary file not shown" or "file too large" message). The file is visually recognisable as a screenshot of a skill session UI.

**Broken behaviour looks like:** GitHub shows "binary file not shown" or renders a broken image icon; or the file is 0 bytes.

---

### Scenario 2 — AC2: Record retrievable via tenant-scoped screenshot route

**What you are checking:** After the capture record has been committed to GitHub storage (Scenario 1 must be complete), the tenant-scoped screenshot route in the web UI returns and renders the same PNG file.

**Steps:**

**MV-4 — Access the tenant-scoped screenshot route**

1. In the live production web UI, navigate to the screenshot or capture record view. (This is the route implemented in ppc-s2/s3 — the URL pattern is typically `/captures/:id` or `/artefacts/:tenantId/:filename`. Check the route definitions in `src/web-ui/routes/` if you are unsure of the exact path.)
2. Find the record from Scenario 1 in the list or enter its direct URL.
3. Observe whether the PNG image loads and is displayed in the browser.

**Expected:** The route returns HTTP 200. The browser displays the PNG image — you can see the screenshot content. The image matches what was captured during the discovery session in Scenario 1 (it shows the session UI, not a blank or placeholder image).

**Broken behaviour looks like:** HTTP 404 or 500; a broken image icon; the route returns a different image than the one committed in Scenario 1; the route returns the image from a different tenant's session.

---

## Completion Summary

**Technical test plan:**
- 0 unit tests (no new code)
- 0 integration tests (no new code)
- 0 NFR tests (none applicable)
- 2 ACs covered — both as manual verification scenarios
- 2 gaps noted (both manual-only; production-only path; RISK-ACCEPT justified)

**Verification script:**
- 2 scenarios
- 4 manual verification steps (MV-1 through MV-4)
- Designed for post-session smoke test
- No reset required between scenarios (Scenario 1 produces the input for Scenario 2)

**Test data:** Live production session — no setup required beyond authentication.

**Recommended next step:** Share the verification script with the platform operator to confirm the described steps are correct and the configured artefacts path is known before running the live session. Then proceed to /definition-of-ready for ep1-s1.

---

## Appendix — Skill Performance Capture

<!-- EXP-010-fable5-model-sweep -->
```yaml
experiment_id: EXP-010-fable5-model-sweep
model_label: claude-sonnet-4-6
cost_tier: fast
skill_name: test-plan
artefact_path: artefacts/2026-10-25-ppc-capture-live-test/test-plans/ep1-s1-test-plan.md
run_timestamp: 2026-10-25T00:00:00Z
fidelity_self_report: >
  Model correctly identified this as a production verification exercise with no automated
  tests warranted. Detected the AC2 "renders" trigger word and correctly classified it as
  non-CSS-layout-dependent (functional image-load assertion, not positional). Applied
  RISK-ACCEPT framing from the review report rather than re-raising the 2-AC count as a
  blocking gap. Produced manual verification steps at sufficient precision to be executed
  by an operator unfamiliar with the specific artefacts path configuration.
```