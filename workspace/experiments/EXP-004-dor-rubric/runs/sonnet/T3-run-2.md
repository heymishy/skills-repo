# EXP-004 Run: T3 (Session token refresh) — Sonnet Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T3 (Session token refresh — H-GOV engineer-only approvers)
- Model: claude-sonnet-4-6
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.6

### Step 1 — Confirm the story

**Story loaded:** GitHub OAuth session token refresh handler (ham.6)
**Feature:** Hamilton Core Banking DR Failover — Web UI session layer
**Review:** PASS — R1 MEDIUM acknowledged; no HIGH findings
**Test plan:** T1–T5; all 5 ACs covered; no gaps
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.6-verification.md

---

### Step 2 — Contract Proposal

**Contract Proposal — GitHub OAuth session token refresh handler (ham.6)**

**What will be built:**
- `src/web-ui/routes/session-refresh.js` — new route module exposing `POST /api/session/refresh`:
  - Reads `req.session.accessToken` (canonical field per coding standard; never `req.session.token`)
  - If token present and valid: calls GitHub OAuth refresh endpoint, writes refreshed token to `req.session.accessToken`, returns `200 { refreshed: true }`
  - If no session token: returns `401 { error: "No active session" }` — no refresh attempt
  - If GitHub upstream returns non-2xx: returns `502 { error: "Token refresh failed", status: <upstream_status> }` — session unchanged
- Injectable adapter `setGitHubRefreshFn(fn)` exported from the module; default stub throws (`throw new Error("Adapter not wired: gitHubRefreshFn")`) per D37 rule — not null/empty
- Production wiring in `server.js`: `setGitHubRefreshFn(realImpl)` called at startup before any request handling

**What will NOT be built:**
- Proactive background token refresh (timer-based pre-expiry)
- OAuth refresh token rotation
- Client-side auto-trigger logic

**AC → test mapping:**

| AC | Test coverage |
|----|---|
| AC1 (valid session token → refresh called, token updated, 200) | T1 |
| AC2 (no session token → 401, no refresh call) | T2 |
| AC3 (GitHub 503 → handler returns 502 with upstream status) | T3 |
| AC4 (injectable adapter → mock injected via setGitHubRefreshFn, mock called) | T4 |
| AC5 (server.js wires real impl at startup) | T5 |

**Assumptions:**
- `express-session` middleware configured in `server.js` (ham.4 prerequisite)
- `GITHUB_CLIENT_SECRET` in `process.env`
- Injectable adapter default stub must throw; test wires mock before each test

**Touch points:**
- `src/web-ui/routes/session-refresh.js` (new)
- `server.js` (add `setGitHubRefreshFn(realImpl)` wiring call at startup)

---

### Step 3 — Contract Review

✅ **Contract review passed** — all 5 ACs are mapped. D37 injectable adapter requirements (explicit wiring AC5 + throwing stub default) accounted for. No mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a Hamilton operations team member using the web UI, I want..." — named persona present, correct format.

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4, AC5 — all 5 in GWT format. Count: 5 ≥ 3.

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**
AC1 → T1, AC2 → T2, AC3 → T3, AC4 → T4, AC5 → T5. All 5 covered.

---

### H4 — Out-of-scope section populated

✅ **PASS**
Three named items: proactive background refresh, refresh token rotation, frontend auto-trigger.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M4 (Operator session interruption rate ≤ 1% during active DR operations)."

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 1."

---

### H7 — No unresolved HIGH findings

✅ **PASS**
Review: R1 MEDIUM acknowledged. No HIGH findings.

---

### H8 — No uncovered ACs

✅ **PASS**
Test plan gap table: no gaps. All 5 ACs covered.

---

### H8-ext — Cross-story schema dependency check

✅ **PASS**
Dependencies: ham.4 (upstream). No `schemaDepends` declaration in the DoR contract. Story introduces no new pipeline-state.schema.json fields. Schema check not required.

---

### H9 — Architecture Constraints populated; no Category E HIGH findings

✅ **PASS**
Architecture Constraints populated (canonical `req.session.accessToken`, D37 injectable adapter rule, secret handling, session config from ham.4). No Category E findings in review report.

---

### H-E2E — CSS-layout-dependent ACs

✅ **PASS**
Backend route story. Test plan has no CSS-layout-dependent AC types.

---

### H-NFR — NFR profile or explicit "None — reviewed" field

✅ **PASS**
Story NFR section: `NFRs: None — reviewed 2026-05-12`. Explicit exemption form present.

---

### H-NFR2 — Compliance NFR human sign-off

✅ **PASS** (N/A)
NFR section is explicit "None — reviewed". No compliance NFRs.

---

### H-NFR3 — Data classification not blank

✅ **PASS** (N/A)
No NFR profile referenced. Explicit "None — reviewed" exemption applies.

---

### H-NFR-profile — NFR profile presence check

✅ **PASS**
Story NFR section is "None — reviewed". No profile required.

---

### H-GOV — Governance approval check

Reading `## Approved By` section from the discovery artefact directly:

```
## Approved By

Dr. James Hamilton — Lead Engineer — 2026-05-01
Marcus Webb — Tech Lead — 2026-05-02
```

**Section is present and has entries — H-GOV AC2 (empty) and AC3 (absent) do not apply. Evaluating AC4:**

- **"Dr. James Hamilton — Lead Engineer"** — "Lead Engineer" is an engineering role. ✅ Engineering.
- **"Marcus Webb — Tech Lead"** — "Tech Lead" is an engineering role. ✅ Engineering.

Both entries are engineering roles. There is no entry from a non-engineering approver (product owner, business stakeholder, programme management, or equivalent).

**H-GOV AC4 is triggered.**

❌ **H-GOV FAIL — Approved By contains engineer-only entries**

All entries in the `## Approved By` section hold engineering role titles. H-GOV requires at least one named non-engineering approver. The presence of two engineering approvers with full names, dates, and titles does not satisfy this requirement — the requirement is about role type, not about the section being populated.

**H-GOV fails. Sign-off blocked.**

---

## Verdict

❌ **BLOCKED — 1 hard block failed**

| Block | Status | Detail |
|-------|--------|--------|
| H1–H9 | ✅ PASS | All story quality gates pass |
| H-E2E | ✅ PASS | No CSS-layout ACs |
| H-NFR / H-NFR2 / H-NFR3 / H-NFR-profile | ✅ PASS | Explicit "None — reviewed" exemption |
| H-GOV | ❌ **FAIL** | Two engineering approvers ("Lead Engineer", "Tech Lead"); zero non-engineering approvers |
| H-ADAPTER | Not reached | Blocked at H-GOV |

**Fix:** Add at least one named non-engineering approver to the `## Approved By` section in the discovery artefact. Format: `Name — Role — Date`. The role must be clearly non-engineering (e.g. product owner, head of platform partnerships, programme director, business owner).

Re-run /definition-of-ready after updating the discovery artefact.