# Definition of Ready: ep1-s1 — Run Live Capture Session and Confirm Durable Record

**Feature:** 2026-10-25-ppc-capture-live-test
**Story:** ep1-s1
**Date:** 2026-10-25
**Status:** PROCEED (H2/H7 RISK-ACCEPTed)
**Oversight:** Low

---

## Contract Proposal

**What will be built:**
No code is written. The story is a production verification exercise. The deliverable is a confirmed durable capture record — a non-empty PNG committed to the configured artefacts path in the GitHub repository — plus a human confirmation that the tenant-scoped screenshot route retrieves and renders it.

**What will NOT be built:**
- No code changes of any kind
- No new routes, modules, or configuration
- No edge-case, error-path, or failure-mode testing
- No evaluation of capture content quality or visual semantics
- No staging bypass or synthetic session substitution

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — ≥1 non-empty PNG committed to GitHub artefacts path, successful commit status | Operator runs a live discovery skill session in production web UI; inspects GitHub repository for the resulting commit | Manual / production |
| AC2 — Tenant-scoped screenshot route returns and renders the committed PNG | Operator navigates to the screenshot route in the live production web UI after AC1 confirmed; observes HTTP 200 and rendered image | Manual / production |

**Assumptions:**
- The ppc-s1/s2/s3 capture mechanism is already deployed to the live production environment
- The configured artefacts GitHub repository path is known to the operator before starting
- The operator has a valid production OAuth session with sufficient scope to trigger the capture pipeline
- A "structurally valid PNG" is confirmed by GitHub rendering a preview
- The tenant-scoped screenshot route URL pattern is known or discoverable from `src/web-ui/routes/` before starting

**Estimated touch points:**
Files: none (no code changes)
Services: live production web UI, GitHub Contents API (existing), tenant-scoped screenshot route (existing)
APIs: GitHub repository contents endpoint (read/verify only)

---

## Hard Block Results

| # | Check | Result |
|---|-------|--------|
| H1 | User story format | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then format | ⚠️ RISK-ACCEPT — 2 ACs only; both required surfaces covered; third AC not achievable without artificial scope |
| H3 | Every AC has a test | ✅ PASS |
| H4 | Out-of-scope section populated | ✅ PASS |
| H5 | Benefit linkage | ✅ PASS |
| H6 | Complexity rated | ✅ PASS |
| H7 | No unresolved HIGH findings | ⚠️ RISK-ACCEPT — 1-H1 (AC count) acknowledged; no other HIGH findings |
| H8 | No uncovered ACs | ✅ PASS |
| H8-ext | Schema dependency check | ✅ PASS — Dependencies: None |
| H9 | Architecture constraints populated | ✅ PASS — ADR-020, ADR-029 cited |
| H-E2E | CSS-layout-dependent AC check | ✅ PASS — neither AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit None | ✅ PASS |
| H-NFR2 | Compliance NFR sign-off | ✅ PASS — not applicable |
| H-NFR3 | Data classification | ✅ PASS — not applicable |
| H-NFR-profile | NFR profile presence | ✅ PASS — NFR: None |
| H-GOV | Approved By in discovery | ✅ PASS — Operator — Platform maintainer — 2026-10-25 |

**RISK-ACCEPT — H2/H7:**
Rationale: Verification-only exercise; two ACs cover both required verification surfaces (GitHub API path and web UI screenshot route); scope does not support a third meaningful AC without forcing a contrived condition. Log in /decisions before starting the verification exercise.

---

## Warnings

| # | Check | Result |
|---|-------|--------|
| W1 | NFRs populated or "None — confirmed" | ✅ Resolved — "None — confirmed" in test plan |
| W2 | Scope stability declared | ✅ PASS — Stable |
| W3 | MEDIUM findings acknowledged | ✅ Resolved — 1-M1 resolved in test plan; 1-L1 noted for retrospective |
| W4 | Verification script reviewed | ⚠️ Standing RISK-ACCEPT — solo operator posture per architecture-guardrails.md |
| W5 | No UNCERTAIN items in gap table | ✅ PASS |

---

## Coding Agent Instructions

**Note:** This story has no coding agent involvement. There is no code to write. The "agent" for this story is the platform operator executing the verification exercise manually.

**Operator Instructions — ep1-s1:**

**Before starting:**
1. Log the H2/H7 RISK-ACCEPT in /decisions with rationale: "Verification-only exercise; two ACs cover both required surfaces; scope does not support a third meaningful AC without forcing a contrived condition."
2. Confirm the configured artefacts GitHub repository path is known (check `src/web-ui/` or `context.yml` for the path configured in ppc-s1/s2/s3 if needed).
3. Confirm the tenant-scoped screenshot route URL pattern is known (check `src/web-ui/routes/` if needed).
4. Ensure you have a valid production OAuth session before starting.

**Scope contract:**
- Files to touch: none
- Services to exercise: live production web UI, GitHub repository (read-only from operator perspective), tenant-scoped screenshot route
- Out of scope: any code change, any staging substitution, any error-path testing

**Verification exercise — execute in sequence:**

**AC1 — Capture record written (MV-1 → MV-2 → MV-3):**
1. Navigate to the live production web UI skill launcher.
2. Select the "discovery" skill and start a new session.
3. Complete the session through to the artefact output step (the capture event is triggered at this point).
4. Note the approximate time you completed the session.
5. Open the GitHub repository hosting the configured artefacts path.
6. Navigate to the artefacts directory and find the new commit (within the last few minutes).
7. Confirm the commit status is success (green / no error).
8. Open the committed file in GitHub — confirm it renders a PNG preview (not a "binary file not shown" message).
9. Confirm the file is non-empty (GitHub preview loads; or download and open in an image viewer).

AC1 passes when: commit exists, status = success, file is non-empty, GitHub renders a PNG preview.

**AC2 — Record retrievable via screenshot route (MV-4):**
1. In the live production web UI, navigate to the screenshot or capture record view.
2. Find the record from the AC1 session (by time or ID) or enter its direct URL.
3. Observe that the route returns HTTP 200 and the browser displays the PNG image.
4. Confirm the image matches the capture session (shows the skill session UI, not a blank or placeholder).

AC2 passes when: HTTP 200, PNG renders in browser, image matches the AC1 session.

**After both ACs pass:**
- Run /definition-of-done for ep1-s1.

**Completion criteria:** Both AC1 and AC2 pass. No code changes required. No PR required.

---

## DoR Sign-off

**Status:** PROCEED
**Hard blocks:** 14/15 passed (1 RISK-ACCEPTed)
**Warnings:** 0 blocking (W4 standing RISK-ACCEPT; W3 resolved)
**Oversight:** Low
**Sign-off:** Operator — Platform maintainer — 2026-10-25