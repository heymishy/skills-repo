# EXP-004 Run: T3 (Session token refresh) — Haiku Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
- Model: claude-haiku-4-5
- Trial: 1
- Date: 2026-05-21
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.6

### Step 1 - Confirm the story

**Story loaded:** GitHub OAuth session token refresh handler (ham.6)
**Feature:** Hamilton Core Banking DR Failover — Web UI session layer
**Review:** PASS — 1 MEDIUM finding acknowledged; no HIGH findings
**Test plan:** 5 tests (T1–T5) covering all 5 ACs
**Verification script:** Referenced as artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.6-verification.md

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — GitHub OAuth session token refresh handler**

**What will be built:**
- New route handler at `src/web-ui/routes/session-refresh.js` exposing POST `/api/session/refresh`
- Handler reads `req.session.accessToken` (canonical field name per D37)
- Calls GitHub OAuth token refresh endpoint with current token
- Writes new token back to `req.session.accessToken`
- Returns 200 `{ refreshed: true }` on success
- Returns 401 `{ error: "No active session" }` if no token exists
- Returns 502 `{ status: <upstream> }` if GitHub returns non-2xx
- Implements injectable adapter via `setGitHubRefreshFn(fn)` with throwing stub default
- Production wiring in `server.js` calls `setGitHubRefreshFn` at startup with real implementation

**What will NOT be built:**
- Proactive background refresh (timer-based pre-emptive) — reactive only for MVP
- Refresh token rotation (not supported by GitHub OAuth model used here)
- Frontend auto-trigger logic — browser client responsibility

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (valid token → refresh + session update + 200) | Unit test: mock session with valid token, spy on GitHub endpoint call, verify token updated and 200 returned | unit |
| AC2 (no session token → 401) | Unit test: mock session without token, verify 401 returned and GitHub endpoint not called | unit |
| AC3 (GitHub 503 → 502 with upstream status) | Unit test: mock GitHub returning 503, verify 502 returned with status field | unit |
| AC4 (injectable adapter usage) | Unit test: inject mock adapter, verify mock called instead of real endpoint | unit |
| AC5 (server.js wiring) | Integration test: start server, verify `setGitHubRefreshFn` called at startup with real implementation | integration |

**Assumptions:**
- Session object (`req.session`) is available and writable during request handling
- GitHub OAuth refresh endpoint returns a token in the response body
- `GITHUB_CLIENT_SECRET` is available in `process.env` at runtime
- The injectable adapter injection point is called before any request is handled

**Estimated touch points:**
Files: `src/web-ui/routes/session-refresh.js` (new), `server.js` (wiring call added)
Services: Web UI backend, GitHub OAuth service
APIs: GitHub OAuth token refresh endpoint

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

The contract correctly maps:
- AC1 (valid token → refresh) to token update and 200 response verification
- AC2 (no token → 401) to error response verification without endpoint call
- AC3 (GitHub error → 502) to upstream status propagation
- AC4 (injectable adapter) to mock injection and call verification
- AC5 (production wiring) to server startup sequence verification

No mismatches found. Proceeding to hard blocks.

---

## Hard blocks checklist

### H1 — User story format

✅ **PASS**

Story is in As / Want / So format with named persona:
- As: "Hamilton operations team member using the web UI"
- Want: "GitHub OAuth session token automatically refreshed when actively using the interface"
- So that: "not logged out mid-transaction due to token expiry and forced to re-authenticate from scratch"

---

### H2 — At least 3 ACs in Given / When / Then format

✅ **PASS**

5 acceptance criteria all in Given / When / Then format:
- AC1: "Given a valid unexpired `req.session.accessToken` exists, when POST `/api/session/refresh` is called, then..."
- AC2: "Given `req.session.accessToken` is absent or null, when POST `/api/session/refresh` is called, then..."
- AC3: "Given the GitHub OAuth refresh call returns a non-2xx response, when POST `/api/session/refresh` is called, then..."
- AC4: "Given `setGitHubRefreshFn(mockFn)` is called with a mock implementation, when POST `/api/session/refresh` is invoked in a test, then..."
- AC5: "Given the production wiring module `server.js`, when the server starts, then `setGitHubRefreshFn` is called with the real GitHub OAuth refresh implementation..."

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**

Test plan coverage:
- AC1: T1 (valid token → GitHub refresh called, session updated, 200 returned)
- AC2: T2 (no session token → 401 returned, no refresh called)
- AC3: T3 (GitHub returns 503 → handler returns 502 with upstream status)
- AC4: T4 (mock adapter injected → mock called, not real endpoint)
- AC5: T5 (server.js wiring test — `setGitHubRefreshFn` called at startup)

All 5 ACs have test coverage.

---

### H4 — Out-of-scope section is populated

✅ **PASS**

Out of Scope section contains 3 explicit items:
- Proactive background refresh (timer-based pre-emptive)
- Refresh token rotation
- Frontend auto-trigger logic

---

### H5 — Benefit linkage references a named metric

✅ **PASS**

"Metric moved: M4 (Operator session interruption rate ≤ 1% during active DR operations — baseline: 8% token expiry during 30-min operations windows)"

Named metric: M4

---

### H6 — Complexity is rated

✅ **PASS**

"Complexity: 1 (well understood; injectable adapter pattern established)"

---

### H7 — No unresolved HIGH findings from the review report

✅ **PASS**

Review report contains 1 MEDIUM finding (R1), no HIGH findings.
- R1: "AC3 error response should include the downstream error message" — MEDIUM severity, acknowledged in /decisions, deferred to post-MVP

No unresolved HIGH findings.

---

### H8 — Test plan has no uncovered ACs (or gaps explicitly acknowledged)

✅ **PASS**

Test plan gap table: "No gaps."

All ACs covered; no gaps left unaddressed.

---

### H9 — Architecture Constraints field populated; no Category E HIGH findings

✅ **PASS**

Architecture Constraints section populated:
- New handler at `src/web-ui/routes/session-refresh.js`
- Token stored in `req.session.accessToken` (canonical field name per D37)
- Session configuration unchanged (`resave: false`, `saveUninitialized: false`)
- GitHub refresh call uses `GITHUB_CLIENT_SECRET` from environment (never forwarded to browser)
- Injectable adapter rule (D37) applies: `setGitHubRefreshFn(fn)` with throwing stub default

No Category E (Architecture) HIGH findings in the review report.

---

### H-GOV — Governance approval check

❌ **FAIL**

**Issue:** The `## Approved By` section in the discovery artefact is populated, but all entries are engineering roles.

**Discovery artefact Approved By section:**

```
## Approved By

Dr. James Hamilton — Lead Engineer — 2026-05-01
Marcus Webb — Tech Lead — 2026-05-02
```

**H-GOV AC4 evaluation:**
- Entry 1: "Dr. James Hamilton — Lead Engineer" → **Engineering role**
- Entry 2: "Marcus Webb — Tech Lead" → **Engineering role**

**H-GOV AC4 rule:** All entries in `## Approved By` are engineering roles → H-GOV FAIL.

H-GOV requires at least one named non-engineering approver (product owner, business stakeholder, etc.).

**H-GOV is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1 — Story format | ✅ PASS | Correct As/Want/So with persona |
| H2 — AC format | ✅ PASS | 5 ACs all in Given/When/Then format |
| H3 — Test coverage | ✅ PASS | All 5 ACs covered by tests |
| H4 — Out of scope | ✅ PASS | 3 explicit out-of-scope items |
| H5 — Benefit linkage | ✅ PASS | M4 (operator interruption rate ≤ 1%) referenced |
| H6 — Complexity | ✅ PASS | Rated: 1 |
| H7 — HIGH findings | ✅ PASS | 1 MEDIUM (R1), no HIGH findings |
| H8 — AC coverage | ✅ PASS | All ACs covered; no gaps |
| H9 — Architecture | ✅ PASS | Constraints populated; no Category E HIGH |
| H-GOV — Governance | ❌ **FAIL** | All approvers are engineers; no non-engineer approver |

**H-GOV is a hard block.** Sign-off cannot proceed until resolved.

**Next step:** Add a named non-engineering approver to the `## Approved By` section in the discovery artefact (e.g. product owner, business stakeholder, platform PM). Then re-run /definition-of-ready.

Reply: done — and I'll re-run the check

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H-GOV (AC4 — engineer-only approver entries)
**Categorical fail triggered:** Yes — H-GOV is a categorical fail if missed (AC4 rule)
**Process compliance:** ✅ Correct — stopped at H-GOV hard block before proceeding to warnings or instructions
**Output quality:** Complete diagnostic with role analysis and specific fix guidance

