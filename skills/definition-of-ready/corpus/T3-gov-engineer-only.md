# Corpus Case T3 — Session token refresh: H-GOV engineer-only approver

## Case metadata

```json
{
  "case_id": "T3",
  "label": "Session token refresh handler — H-GOV engineer-only Approved By (H-GOV FAIL AC4)",
  "difficulty": "adversarial",
  "expected_verdict": "BLOCKED",
  "expected_h_blocks": ["H-GOV"],
  "adversarial_pattern": "The `## Approved By` section in the discovery artefact is populated — it is not empty and not absent. A model doing a shallow H-GOV check ('is Approved By populated?') will pass H-GOV. The H-GOV AC4 rule specifically catches engineer-only entries: all names in the section carry engineering role titles. The rule requires at least one non-engineering approver (PM, product owner, business stakeholder). Both names in the section are clearly engineering roles.",
  "failure_modes_to_watch": ["Shallow presence-only check (populated therefore passes)", "Role-label blindness (does not categorise 'Lead Engineer' and 'Tech Lead' as engineering roles)", "H-GOV AC4 not applied (knows H-GOV exists but only checks for non-blank, not for non-engineer)"]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below.

---

### Story artefact

**Story ID:** ham.6
**Feature:** Hamilton Core Banking DR Failover — Web UI session layer
**Epic reference:** artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-1-session-and-auth.md

---

## Story: GitHub OAuth session token refresh handler

**As a** Hamilton operations team member using the web UI,
**I want** my GitHub OAuth session token automatically refreshed when I am actively using the interface,
**So that** I am not logged out mid-transaction due to token expiry and forced to re-authenticate from scratch.

## Benefit Linkage

**Metric moved:** M4 (Operator session interruption rate ≤ 1% during active DR operations — baseline: 8% token expiry during 30-min operations windows)
**How:** The current implementation does not refresh tokens. When the GitHub token expires (typically after 8 hours) during a DR activation window, the operator loses session state and must log in again. This story adds proactive refresh to eliminate expiry-driven interruptions.

## Architecture Constraints

- Token refresh handler at `src/web-ui/routes/session-refresh.js` — POST `/api/session/refresh`.
- Token is stored in `req.session.accessToken` (canonical field name per D37 coding standard). Handler reads `req.session.accessToken`, exchanges it with GitHub OAuth token refresh endpoint, and writes the new token back to `req.session.accessToken`.
- Session data uses `express-session` with `resave: false`, `saveUninitialized: false` — no changes to session configuration.
- The GitHub OAuth refresh call must not be proxied via the web UI backend in a way that exposes the raw client secret. The refresh uses `GITHUB_CLIENT_SECRET` from process environment — never forwarded to the browser.
- Injectable adapter rule (D37) applies: the GitHub refresh API call must be injectable for testing. Expose `setGitHubRefreshFn(fn)` on the module. Default stub must throw (not return empty/null).

## Dependencies

- **Upstream:** ham.4 (initial OAuth login flow) must be complete. This story extends the session layer established in ham.4.
- **Downstream:** ham.7 (payment status transitions) uses session tokens from the same session; depends on this story for reliable token availability.

## Acceptance Criteria

**AC1:** Given a valid unexpired `req.session.accessToken` exists, when POST `/api/session/refresh` is called, then the GitHub OAuth token refresh endpoint is called with the current token, the response token is written back to `req.session.accessToken`, and a 200 response with `{ refreshed: true }` is returned.

**AC2:** Given `req.session.accessToken` is absent or null, when POST `/api/session/refresh` is called, then the handler returns 401 with `{ error: "No active session" }` — no refresh attempt is made.

**AC3:** Given the GitHub OAuth refresh call returns a non-2xx response, when POST `/api/session/refresh` is called, then the handler returns 502 with `{ error: "Token refresh failed", status: <upstream_status> }` — the session token is left unchanged.

**AC4:** Given `setGitHubRefreshFn(mockFn)` is called with a mock implementation, when POST `/api/session/refresh` is invoked in a test, then `mockFn` is called instead of the real GitHub OAuth endpoint — confirms the injectable adapter is in use.

**AC5:** Given the production wiring module `server.js`, when the server starts, then `setGitHubRefreshFn` is called with the real GitHub OAuth refresh implementation — the adapter is wired to a real implementation (not the throwing stub default) before the server handles any requests.

## Out of Scope

- Proactive background refresh (timer-based pre-emptive refresh before expiry) — reactive refresh on demand only for MVP.
- Refresh token rotation (GitHub does not currently support OAuth refresh token rotation for the GitHub Apps model used here).
- Frontend auto-trigger of refresh (the browser client can call this endpoint on a 401 from any API call; the trigger logic is out of scope for this story).

## NFRs

NFRs: None — reviewed 2026-05-12

## Complexity

Complexity: 1 (well understood; injectable adapter pattern established)

## Scope Stability

Stable

---

### Test plan summary

**Test plan artefact:** artefacts/2026-04-15-hamilton-dr-failover/test-plans/ham.6-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: valid token → GitHub refresh called, session updated, 200 returned | Full | — |
| AC2 | T2: no session token → 401 returned, no refresh called | Full | — |
| AC3 | T3: GitHub returns 503 → handler returns 502 with upstream status | Full | — |
| AC4 | T4: mock adapter injected → mock called, not real GitHub endpoint | Full | Injectable adapter pattern confirmed |
| AC5 | T5: server.js wiring test — `setGitHubRefreshFn` called at startup with real implementation | Full | — |

**Test plan gap table:** No gaps.

---

### Review report summary

**Review artefact:** artefacts/2026-04-15-hamilton-dr-failover/review/ham.6-review.md

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1: AC3 error response should include the downstream error message from GitHub (if available) to aid debugging, not just the HTTP status code. | B — AC completeness | MEDIUM | Open — operator acknowledged in /decisions; deferred to post-MVP |

**No HIGH findings.**

---

### Discovery artefact — approval section

**Discovery artefact:** artefacts/2026-04-15-hamilton-dr-failover/discovery.md

```
## Approved By

Dr. James Hamilton — Lead Engineer — 2026-05-01
Marcus Webb — Tech Lead — 2026-05-02
```

---

## Expected verdict

**Verdict:** BLOCKED

**Hard block that fires:** H-GOV (AC4 — engineer-only entries)

**Reason:** The `## Approved By` section in the discovery artefact is populated with two named entries. It is not empty (AC2) and not absent (AC3). However, both entries carry engineering role titles: "Lead Engineer" and "Tech Lead". H-GOV AC4 states: all entries in `## Approved By` are engineering roles → H-GOV FAIL. At least one named non-engineering approver (e.g. product owner, business stakeholder) is required.

**What a correct model output looks like:**
> ❌ **BLOCKED — 1 hard block failed**
>
> H-GOV FAIL — Approved By contains engineer-only entries
> The discovery artefact's `## Approved By` section has two entries: "Dr. James Hamilton — Lead Engineer" and "Marcus Webb — Tech Lead". Both are engineering roles. H-GOV requires at least one named non-engineering approver (product owner, business stakeholder, or equivalent).
> Resolution: Add a named non-engineering approver to the `## Approved By` section in the discovery artefact before re-running /definition-of-ready.

**What a failing model output looks like (false positive):**
> H-GOV ✅ — Approved By section is populated with two named entries (Dr. James Hamilton and Marcus Webb).

## Adversarial signal

The section is populated with full names, roles, and dates — it looks complete and professional. A model that applies H-GOV as a presence-only check ("is the section non-empty?") will pass it. The AC4 rule is easy to overlook because it is a sub-case of H-GOV that triggers only when entries are present but role types are homogenous. The model must read and classify the role titles, not just check for non-blank content.
