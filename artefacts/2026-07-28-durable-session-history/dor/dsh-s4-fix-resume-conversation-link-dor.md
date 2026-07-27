# Definition of Ready: dsh-s4 — Fix "Resume conversation" to always resolve to a real conversation view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | |
| H2 | ≥3 ACs in G/W/T | ✅ | 4 |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage names a metric | ✅ | Direct fix — the literal originally-reported bug |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM (1 LOW carried) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Same reasoning as dsh-s2 |
| H9 | Architecture Constraints, no Cat E HIGH | ✅ | ADR-025/026/027 cited |
| H-E2E | Layout-dependent gap check | ✅ | No layout-dependent AC — the real-staging E2E scenario here exists for restart-survival fidelity, not CSS layout |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | |
| H-ADAPTER | N/A | ✅ N/A | No new adapter |

---

## Warnings

All resolved (same basis as dsh-s1/s2/s3).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s4 — Fix "Resume conversation" to always resolve to a real conversation view — artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md

Goal:
Make every test in the test plan pass, including the new real-staging
Playwright spec (tests/e2e/dsh-s4-resume-conversation-survives-restart.spec.js).

Constraints:
- Change ONLY the href computed in routes/features.js's
  _resolveResumeLinksForFeature / renderArtefactIndexHtml call site — point it
  at /journey/:journeyId/stage/:stageName (dsh-s3's route) instead of
  /skills/:skillName/sessions/:sessionId/chat. Do not build a new page.
- New staging-safe test-only endpoint POST /test/evict-skill-session — reuse
  the EXISTING _isTestEndpointAllowed() gate (server.js) exactly as dss-s1
  established (NODE_ENV=test OR a matching E2E_STAGING_AUTH_STUB_SECRET-style
  header) — do not invent a new gating mechanism. It must delete exactly one
  named sessionId from the in-memory _sessionStore Map only — never touch
  Redis or Postgres.
- The AC2 Playwright spec deliberately runs against REAL wuce-staging (not the
  local ephemeral webServer) — use tests/e2e/fixtures/staging-auth.js's
  uniqueEmail(), matching the existing Scenario A/B convention. This creates a
  real e2e-test-* tagged tenant; do NOT add any custom cleanup logic — the
  existing always()-gated purge step (scripts/purge-e2e-tenants.js, wired into
  e2e.yml's Scenario jobs per alrf-s11/alrf-s12) already handles it.
- Add the new spec to the existing staging E2E CI job set (Scenario A or B,
  whichever fits better) as a CI-blocking check — do not create a new,
  separate CI job/workflow for one spec file.
- AC4 (turns genuinely unavailable) reuses dsh-s3's own AC2 fallback behaviour
  unmodified — do not re-implement it here.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
