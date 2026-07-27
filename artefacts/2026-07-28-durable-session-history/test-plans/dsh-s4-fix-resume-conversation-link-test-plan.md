# Test Plan: Fix "Resume conversation" to always resolve to a real conversation view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Epic reference:** artefacts/2026-07-28-durable-session-history/epics/dsh-e1-durable-session-history.md
**Test plan author:** Copilot
**Date:** 2026-07-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Link href points at dsh-s3's route | 1 | — | — | — | — | 🟢 |
| AC2 | Real restart-survival: session evicted from memory, still renders via durable path | — | — | 1 (real staging) | — | — | 🟢 |
| AC3 | Still-in-memory case unregressed | 1 | — | — | — | — | 🟢 |
| AC4 | Falls back to artefact-only when turns genuinely unavailable | — | — | — | — | — | 🟢 — identical to dsh-s3's AC2, reused not re-implemented |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic for AC1/AC3 (fake journey/feature fixtures). For AC2: a real `e2e-test-*` tagged tenant created against real deployed `wuce-staging`, matching the existing Scenario A/B convention (`tests/e2e/fixtures/staging-auth.js`'s `uniqueEmail()`).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — the `e2e-test-*` tenant created for AC2's scenario is cleaned up automatically by the existing always()-gated purge step already wired into `e2e.yml`'s Scenario A/B jobs (alrf-s11/alrf-s12); no new cleanup mechanism is needed.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|------------------|-------|
| AC1 | A feature fixture with a completed stage and a resolvable session | Inline fixture | None | |
| AC2 | A real, freshly-created `e2e-test-*` tenant on staging; a real completed stage (driven through the mock LLM gateway); a new staging-safe test-only endpoint to evict the session from memory | `tests/e2e/fixtures/staging-auth.js`; new `/test/evict-skill-session` endpoint | None | Real staging, real Postgres — this is the one scenario in the epic that deliberately does NOT use the local ephemeral pattern, because the whole point is proving the real restart-survival guarantee |
| AC3 | Same fixture as AC1, with an in-memory session present | Inline fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### "Resume conversation" link's href points at the stage-view route, not the raw chat route

- **Verifies:** AC1
- **Precondition:** A feature's artefact-index page has a completed stage with a resolvable `sessionId`
- **Action:** Render `/features/:slug`
- **Expected result:** The "Resume conversation" `<a>` tag's `href` matches `/journey/:journeyId/stage/:stageName`, not `/skills/:skillName/sessions/:sessionId/chat`
- **Edge case:** No

### Still-in-memory case renders correctly (no regression)

- **Verifies:** AC3
- **Precondition:** The stage's session is still resident in the current process's in-memory store
- **Action:** Follow the updated link
- **Expected result:** Page renders correctly via dsh-s3's route, same as the already-working AC1/AC2 behaviour dsh-s3 already covers for the in-memory case
- **Edge case:** No

---

## Integration Tests

None beyond the unit tests above for AC1/AC3 — the real integration concern (does this survive a real restart against real infrastructure) is deliberately elevated to the E2E tier below, not tested at a lower fidelity here, since a fake-db proxy would understate the actual claim being made.

---

## E2E Tests (Playwright, real staging — Scenario-style)

### AC2 (the core guarantee): "Resume conversation" survives real session eviction against real staging

- **Verifies:** AC2 — this is the literal bug the operator originally reported, and the one scenario in this epic judged to need real infrastructure rather than a local proxy (see discovery/decisions for the reasoning)
- **Spec file:** `tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js`
- **Fixture:** `tests/e2e/fixtures/staging-auth.js`'s `uniqueEmail()` — creates a real, uniquely-tagged `e2e-test-*` tenant
- **New test infrastructure required (part of this story's implementation scope):** `POST /test/evict-skill-session` — a new staging-safe test-only endpoint, gated by the existing `_isTestEndpointAllowed()` convention (`dss-s1`'s pattern: `NODE_ENV=test` OR a matching `E2E_STAGING_AUTH_STUB_SECRET`-style header), that deletes exactly one named `sessionId` from the server's in-memory `_sessionStore` Map only — leaving Redis and Postgres untouched. This precisely simulates "this session is gone from memory" (the real post-restart condition) without requiring a disruptive full Fly app restart mid-CI-run.
- **Setup:** Create a real tenant; drive a real stage to completion through the mock LLM gateway (so a real `session_turns` row is written by dsh-s1's real, deployed code); call `/test/evict-skill-session` for that session
- **Action:** Follow the "Resume conversation" link
- **Expected result:** The page renders the real conversation (sourced from the real Postgres round-trip via dsh-s2's real, deployed read function) — never "Session not found"
- **Why real staging, not the local ephemeral pattern:** This is the one claim in the epic that is specifically about surviving real infrastructure (a real Fly-hosted process, real Postgres, real Redis-delete-on-completion timing) — a local, no-database proxy would prove a materially weaker claim than what this story exists to fix
- **Cleanup:** None required beyond what already exists — the `e2e-test-*` tagged tenant this test creates is picked up by the existing always()-gated purge step in the Scenario job it's added to (per alrf-s11/alrf-s12); no new cleanup work needed
- **CI wiring:** Added to the existing staging E2E CI job set (alongside Scenario A/B) as a CI-blocking check — exact job placement decided at implementation time, following the established Scenario A/B pattern rather than inventing a new one

---

## NFR Tests

None — confirmed with story owner. No new NFRs beyond what dsh-s2/dsh-s3 already specify.

---

## Out of Scope for This Test Plan

- AC4 — identical to dsh-s3's AC2 fallback behaviour; reused, not re-implemented or re-tested here.
- Any test of the archive/rehydrate path — dsh-s6's own test plan covers that; this story only calls the same read function dsh-s6 also extends.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The new `/test/evict-skill-session` endpoint is itself new test infrastructure, not yet reviewed as its own story | It's small and directly scoped to this AC's verification need, matching the size/shape of existing test-only endpoints (`/test/session`, `/test/seed-board-journey`) | Implemented and reviewed as part of this story's own PR, following the same staging-safe gating convention already established and audited by `dss-s1` |
