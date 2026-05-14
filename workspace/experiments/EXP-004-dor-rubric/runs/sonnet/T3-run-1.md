# EXP-004 Run: T3 (Session token refresh) — Sonnet Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
- Model: claude-sonnet-4-6
- Trial: 1
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.6

### Step 1 — Confirm the story

**Story loaded:** GitHub OAuth session token refresh handler (ham.6)
**Feature:** Hamilton Core Banking DR Failover — Web UI session layer
**Review:** PASS — 1 finding (R1 MEDIUM acknowledged); no HIGH findings
**Test plan:** 5 tests (T1–T5) covering all 5 ACs — no gaps
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.6-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — GitHub OAuth session token refresh handler**

**What will be built:**
- Route handler `src/web-ui/routes/session-refresh.js` exposing `POST /api/session/refresh`:
  - Reads `req.session.accessToken` (canonical field per D37 coding standard)
  - On valid token: calls GitHub OAuth token refresh endpoint, writes refreshed token back to `req.session.accessToken`, returns `200 { refreshed: true }`
  - On absent/null token: returns `401 { error: "No active session" }` — no refresh attempt
  - On GitHub non-2xx response: returns `502 { error: "Token refresh failed", status: <upstream_status> }` — session token unchanged
- Injectable adapter `setGitHubRefreshFn(fn)` on the module per D37 rule; default stub throws (does not return null/empty)
- Production wiring in `server.js`: calls `setGitHubRefreshFn(realImpl)` at startup before server handles any requests

**What will NOT be built:**
- Proactive background refresh (timer-based pre-emptive refresh before expiry) — reactive on demand only for MVP
- Refresh token rotation (GitHub Apps model does not support OAuth refresh token rotation)
- Frontend auto-trigger logic — client-side responsibility

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (valid token → refresh called, session updated, 200) | Unit test: valid session with token, spy on GitHub refresh fn, assert mock called and session updated and 200 returned | unit |
| AC2 (no session token → 401, no refresh) | Unit test: session without token, assert 401 returned and GitHub fn not called | unit |
| AC3 (GitHub 503 → 502 with upstream status) | Unit test: mock GitHub refresh returning 503, assert handler returns 502 with status field | unit |
| AC4 (mock adapter → mock called not real endpoint) | Unit test: inject mock fn via setGitHubRefreshFn, invoke route, assert mock called | unit |
| AC5 (server.js wires real impl at startup) | Integration/wiring test: start server, verify setGitHubRefreshFn called before first request | integration |

**Assumptions:**
- `express-session` middleware already configured (ham.4 complete)
- `GITHUB_CLIENT_SECRET` available in `process.env` at runtime
- Real GitHub OAuth refresh endpoint contract known from ham.4 implementation
- Injectable adapter default stub throws per D37 standard

**Estimated touch points:**
Files: `src/web-ui/routes/session-refresh.js` (new), `server.js` (add wiring call)
Services: Web UI backend, GitHub OAuth service
APIs: GitHub OAuth token refresh endpoint, express-session middleware

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. D37 injectable adapter pattern accounted for in AC4 and AC5 coverage. No mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a **Hamilton operations team member using the web UI**, I want... So that..."

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4, AC5 — all 5 in Given/When/Then format. Count: 5. Requirement: ≥ 3.

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**
- AC1 → T1 ✅
- AC2 → T2 ✅
- AC3 → T3 ✅
- AC4 → T4 ✅
- AC5 → T5 ✅

---

### H4 — Out-of-scope section populated

✅ **PASS**
3 explicit out-of-scope items: proactive background refresh, refresh token rotation, frontend auto-trigger logic.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M4 (Operator session interruption rate ≤ 1% during active DR operations)"

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 1 (well understood; injectable adapter pattern established)"

---

### H7 — No unresolved HIGH findings

✅ **PASS**
Review report: 1 finding, R1 MEDIUM, acknowledged in /decisions. No HIGH findings.

---

### H8 — No uncovered ACs

✅ **PASS**
Test plan gap table: No gaps. All 5 ACs have full test coverage.

---

### H8-ext — Cross-story schema dependency check

✅ **PASS**
Dependencies: ham.4 (upstream). No `schemaDepends` declaration required — this story does not introduce pipeline-state.schema.json fields. H8-ext check not applicable.

---

### H9 — Architecture Constraints populated; no Category E HIGH findings

✅ **PASS**
Architecture Constraints section populated (token refresh handler location, canonical `req.session.accessToken` field, session config, secret handling, D37 injectable adapter rule). Review report has no Category E findings.

---

### H-E2E — CSS-layout-dependent ACs

✅ **PASS**
Backend route handler story. No CSS-layout-dependent ACs in the test plan.

---

### H-NFR — NFR profile or explicit "None — reviewed" field

✅ **PASS**
Story NFR section: `NFRs: None — reviewed 2026-05-12`. Explicit exemption form present.

---

### H-NFR2 — Compliance NFR human sign-off

✅ **PASS** (N/A)
NFR section is "None — reviewed". No compliance NFRs to check.

---

### H-NFR3 — Data classification field not blank

✅ **PASS** (N/A)
No NFR profile referenced. Story explicitly exempted with "None — reviewed".

---

### H-NFR-profile — NFR profile presence check

✅ **PASS**
Story NFR section is "None — reviewed". H-NFR-profile check not required.

---

### H-GOV — Governance approval check

Reading `## Approved By` section from the discovery artefact:

```
## Approved By

Dr. James Hamilton — Lead Engineer — 2026-05-01
Marcus Webb — Tech Lead — 2026-05-02
```

**Evaluating entries:**
- "Dr. James Hamilton — **Lead Engineer**" → Engineering role ✅ identified
- "Marcus Webb — **Tech Lead**" → Engineering role ✅ identified

**H-GOV AC4 assessment:** Both entries carry engineering role titles. The section is populated (AC1, AC2, AC3 do not apply). H-GOV AC4 applies: all entries in `## Approved By` are engineering roles.

❌ **H-GOV FAIL — Approved By contains engineer-only entries**

H-GOV requires at least one named non-engineering approver (product owner, business stakeholder, or equivalent). Both current entries are engineering roles: "Lead Engineer" and "Tech Lead".

**H-GOV is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1–H9 | ✅ PASS | Story format, ACs, tests, scope, benefit, complexity, review, architecture all correct |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ PASS | Explicit "None — reviewed" exemption |
| H-GOV | ❌ **FAIL** | `## Approved By` has 2 entries; both are engineering roles ("Lead Engineer", "Tech Lead"); no non-engineering approver present |
| H-ADAPTER | Not reached (blocked at H-GOV) | — |

**Fix:** Add a named non-engineering approver (e.g. product owner, platform PM, business stakeholder) to the `## Approved By` section in the discovery artefact with their role and approval date.

Re-run /definition-of-ready after updating the discovery artefact.