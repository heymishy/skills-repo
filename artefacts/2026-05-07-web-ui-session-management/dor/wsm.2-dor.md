# Definition of Ready: Collaborative sessions (wsm.2)

**Story reference:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.2-collaborative-sessions.md
**Test plan reference:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.2-test-plan.md
**Verification script:** artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.2-test-plan.md (plain-language section)
**Review report:** Short-track — no formal review run. Zero HIGH findings.
**NFR profile:** artefacts/2026-05-07-web-ui-session-management/nfr-profile.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-08

---

## Contract Proposal

**What will be built:**
- Journey GET endpoint extended: unauthenticated requests redirect to GitHub OAuth login (`302 /auth/github`).
- `ownerId` stored on the journey at creation time (from `req.session.login` — the GitHub login returned by OAuth).
- Turn POST endpoint ownership check: if `req.session.login !== journey.ownerId`, return 403.
- Journey state endpoint (`GET /api/journey/:id/state`): returns current journey turns, currentStage, and viewer count. Available to any authenticated user with the journey ID.
- Viewer sync: `GET /api/journey/:id/events` SSE endpoint (or `GET /api/journey/:id/poll` polling ≤5s interval) — pushes state updates to viewers when the owner completes a turn.
- User count indicator: journey state response includes `{ activeUsers: number }`. Counts are updated when users connect/disconnect from the SSE stream (or on each poll response). Users are considered disconnected after 30 seconds of inactivity.
- Concurrent turn protection: if a turn is already in progress for a journey (tracked by `journey.turnInProgress = true`), a second POST to the turn endpoint returns 409.
- 30-minute idle: journey transitions to `status: "idle"` after 30 minutes of no turn activity. Journey is NOT destroyed — state preserved, retrievable.

**What will NOT be built:**
- Per-user turn history (all users see the same journey state).
- Invitation or access control beyond "authenticated + has journey URL".
- Explicit disconnect notification (passive timeout only).
- Real-time collaborative editing of artefacts.

**How each AC will be verified:**

| AC | Test | Type |
|----|------|------|
| AC1 — viewer sync ≤5s | T4: owner submits turn, assert viewer state updated within 5s | Integration |
| AC2 — shareable URL auth | T1: GET journey URL unauthenticated, assert 302 to /auth/github | Integration |
| AC3 — viewer 403 on turn | T3: authenticated non-owner POSTs turn, assert 403 | Integration |
| AC4 — user count indicator | T5: 2 users connect, assert activeUsers:2 in state response | Integration |
| AC5 — concurrent turn 409 | T6: second turn POST while first in progress, assert 409 | Integration |
| AC6 — idle survival | T7: no activity for 30 min (mock clock), assert journey retrievable with status:idle | Integration |
| AC7 — ownership server-side | T8: request body with ownerId:fake, assert 403 (ownership from session, not body) | Security |

**Assumptions:**
- **Depends on wsm.1** — session persistence must be in place for shareable URLs to be meaningful (a viewer hitting the URL on a fresh server load would get state from disk).
- `req.session.login` is set by the GitHub OAuth callback handler (existing code).
- The SSE or polling approach is implementation choice — the test verifies the outcome (update visible within 5s), not the mechanism.

**Estimated touchpoints:**
- `src/web-ui/routes/journey.js` — add auth check, ownership check, viewer sync endpoint, user count tracking, concurrent turn guard
- `src/web-ui/server.js` — wire new SSE/poll endpoint

---

## Contract Review

✅ **Contract review passed** — ownership enforced server-side from session (not body). Auth check on all journey endpoints. 409 prevents concurrent turn corruption. Viewer sync mechanism is implementation-choice (SSE or poll). Idle survives: 30-min clock is tested with a mock.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As an **operator or viewer with a journey URL**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T1, T3–T8 cover all 7 ACs |
| H4 | Out-of-scope populated | ✅ PASS | Per-user history, invitation, explicit disconnect, collaborative editing excluded |
| H5 | Benefit linkage | ✅ PASS | "Multi-user delivery collaboration rate" named |
| H6 | Complexity rated | ✅ PASS | Complexity 3, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | Short-track — no review run; 0 HIGH findings |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.1–7, wsm.1 are code deps. `schemaDepends: []` |
| H9 | Architecture constraints populated | ✅ PASS | Ownership from session login, server-side ownerId, 409 concurrency guard |
| H-E2E | CSS-layout ACs | ✅ PASS (N/A) | No CSS-layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ PASS | nfr-profile.md present; NFR-sec-ownership-serverside, NFR-sec-viewer-restriction, NFR-perf-viewer-sync, NFR-perf-viewer-fanout |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling; no PII beyond session-level operator text |
| H-NFR-profile | NFR profile presence | ✅ PASS | artefacts/2026-05-07-web-ui-session-management/nfr-profile.md exists |
| H-GOV | Approved By | ✅ PASS | Hamis — Platform operator / product owner — 2026-05-07 |
| H-ADAPTER | Injectable adapter wiring | ✅ PASS (N/A) | No new injectable adapters introduced |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | NFR-sec-ownership-serverside, NFR-sec-viewer-restriction, NFR-perf-viewer-sync in nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | Short-track — no review run | — |
| W4 | Verification script reviewed | ✅ | Plain-language steps reviewed by Hamis | — |
| W5 | UNCERTAIN gaps | ✅ | Viewer sync mechanism (SSE vs poll) is implementation-choice; test verifies outcome only — acknowledged | Hamis |

---

## Oversight Level

**Oversight:** High
**Rationale:** Complexity 3. Introduces multi-user access, ownership enforcement, and concurrent turn protection. Security constraints (ownership server-side, 403 for viewers) must be correct. Depends on wsm.1 being complete.

🔴 **High oversight** — sign-off: Hamis (sole operator and product owner).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes — requires wsm.1 to be merged and on master first
Story: Collaborative sessions — artefacts/2026-05-07-web-ui-session-management/stories/wsm.2-collaborative-sessions.md
Test plan: artefacts/2026-05-07-web-ui-session-management/test-plans/wsm.2-test-plan.md

Goal:
Make every test in tests/check-wsm2-collaborative-sessions.js pass (all currently fail).
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Dependencies:
- wsm.1 must be merged before implementing wsm.2. If session-store.js does not exist, stop and add a PR comment.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Add auth check to GET /api/journey/:id: unauthenticated → 302 /auth/github. Use req.session.login (set by OAuth callback).
- ownerId stored at journey creation: journey.ownerId = req.session.login (server-side only).
- Turn ownership check: if req.session.login !== journey.ownerId → 403. Never accept ownerId from request body (T8 asserts this).
- Viewer sync: implement SSE at GET /api/journey/:id/events OR polling at GET /api/journey/:id/poll (≤5s interval). Test asserts update visible within 5s — choose the simpler mechanism.
- User count: journey.activeUsers increments on SSE connect or poll; decrements after 30s inactivity timeout.
- Concurrent turn guard: set journey.turnInProgress=true at POST start, clear in finally block. Return 409 if already true when request arrives.
- Idle: after 30 minutes of no turn activity, set journey.status='idle'. Journey must still be retrievable (T7 uses a mock clock — export setNow(fn) for test isolation).
- Architecture: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes — named approver
**Signed off by:** Hamis — Platform operator / product owner — 2026-05-08
