# EXP-004 Run: T3 (Session token refresh) — Haiku Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
- Model: claude-haiku-4-5
- Trial: 2
- Date: 2026-05-14
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
- Route handler at `src/web-ui/routes/session-refresh.js` exposing POST `/api/session/refresh`
- Handler reads `req.session.accessToken` (canonical field per D37 standard)
- Calls GitHub OAuth token refresh endpoint with current token via HTTPS
- Writes refreshed token back to `req.session.accessToken`
- Response: 200 `{ refreshed: true }` on success
- Response: 401 `{ error: "No active session" }` if no token in session
- Response: 502 `{ error: "Token refresh failed", status: <upstream_status> }` if GitHub returns non-2xx
- Implements injectable adapter `setGitHubRefreshFn(fn)` with throwing stub default
- Production wiring in `server.js` calls `setGitHubRefreshFn(realImpl)` at startup with real GitHub implementation

**What will NOT be built:**
- Proactive background token refresh (timer-based pre-expiry) — reactive only for MVP
- Refresh token rotation (not supported by GitHub OAuth model used here)
- Frontend auto-trigger logic — client-side responsibility

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (valid token → refresh + update + 200) | Unit test: mock session with valid token, spy on GitHub endpoint, verify token updated and 200 returned | unit |
| AC2 (no session → 401) | Unit test: mock session without token, verify 401 returned and no endpoint call | unit |
| AC3 (GitHub error → 502 with status) | Unit test: mock GitHub 503, verify handler returns 502 with upstream status | unit |
| AC4 (injectable adapter usage) | Unit test: inject mock adapter, verify mock called instead of real endpoint | unit |
| AC5 (server.js wiring) | Integration test: start server, verify `setGitHubRefreshFn` called at startup with real implementation | integration |

**Assumptions:**
- Session object `req.session` is available and writable during request handling
- GitHub OAuth refresh endpoint returns token in response body
- `GITHUB_CLIENT_SECRET` available in `process.env` at runtime
- Injectable adapter is wired before any request is handled

**Estimated touch points:**
Files: `src/web-ui/routes/session-refresh.js` (new), `server.js` (add wiring call)
Services: Web UI backend, GitHub OAuth service
APIs: GitHub OAuth token refresh endpoint, session middleware

---

### Step 3 — Contract Review

✅ **Contract review passed** — implementation aligns with all ACs.

All AC verification approaches are concrete and testable.

---

## Hard blocks checklist

### H1–H9 — Story format through architecture

✅ **H1–H9 all PASS**
- H1: Correct As/Want/So with persona "Hamilton operations team member using the web UI"
- H2: 5 ACs all in Given/When/Then format
- H3: All 5 ACs covered by tests T1–T5
- H4: 3 explicit out-of-scope items
- H5: M4 (Operator session interruption rate ≤ 1%) named
- H6: Complexity rated as 1
- H7: 1 MEDIUM finding R1; no HIGH findings
- H8: No uncovered ACs
- H9: Architecture Constraints populated; no Category E HIGH findings

---

### H-GOV — Governance approval check

❌ **FAIL**

**Discovery artefact `## Approved By` section:**

```
## Approved By

Dr. James Hamilton — Lead Engineer — 2026-05-01
Marcus Webb — Tech Lead — 2026-05-02
```

**H-GOV evaluation — AC4 (role classification):**
- Entry 1: "Dr. James Hamilton — Lead Engineer" → **Engineering role** ✅
- Entry 2: "Marcus Webb — Tech Lead" → **Engineering role** ✅
- Result: All entries in `## Approved By` are engineering roles

**H-GOV AC4 rule:** All entries in `## Approved By` are engineering roles → H-GOV FAIL

H-GOV requires at least one named non-engineering approver (product owner, business stakeholder, platform PM, etc.). Both entries are clearly engineering-focused roles.

**H-GOV is triggered — sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Issue |
|-------|--------|-------|
| H1–H9 | ✅ PASS | Story format, ACs, tests, scope, benefit, complexity, review, architecture all correct |
| H-GOV — Governance | ❌ **FAIL** | Both approvers are engineering roles; need ≥1 non-engineering approver |

**H-GOV is a hard block.**

**Next step:** Add a named non-engineering approver to the `## Approved By` section in the discovery artefact (e.g., product owner, business stakeholder). Then re-run /definition-of-ready.

---

## Evaluation summary

**Verdict:** BLOCKED
**Primary failure:** H-GOV (AC4 — engineer-only approvers)
**Categorical fail triggered:** No
**Process compliance:** ✅ Correct — H1–H9 evaluated and passed; H-GOV evaluated and failed; process stopped
**Output quality:** Role classification applied correctly; "Lead Engineer" and "Tech Lead" both identified as engineering roles; explicit fix guidance provided