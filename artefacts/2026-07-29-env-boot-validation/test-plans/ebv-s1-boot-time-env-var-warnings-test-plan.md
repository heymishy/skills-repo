## Test Plan: Warn at boot time for silently-misconfigured-but-optional env vars

**Story reference:** artefacts/2026-07-29-env-boot-validation/stories/ebv-s1-boot-time-env-var-warnings.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | PLATFORM_TENANT_ID missing warns with concrete consequence | 2 | — | — | — | — | 🟢 |
| AC2 | ADMIN_GITHUB_LOGINS missing/empty warns with concrete consequence | 3 | — | — | — | — | 🟢 |
| AC3 | anthropic provider + missing ANTHROPIC_API_KEY warns | 3 | — | — | — | — | 🟢 |
| AC4 | copilot provider warns about per-user token risk | 2 | — | — | — | — | 🟢 |
| AC5 | fully-configured environment emits zero warnings | 1 | — | — | — | — | 🟢 |

---

## Coverage gaps

None — all 5 ACs are fully unit-testable via direct calls to the new function with an injected env-var map (matching `posthog-config.js`'s own established `envVars` parameter-injection pattern for testability, rather than mutating real `process.env` in tests).

---

## Test Data Strategy

**Source:** Synthetic env-var maps (plain JS objects), matching `posthog-config.js`'s `resolvePostHogApiKey(envName, envVars)` injection pattern.
**PCI/sensitivity in scope:** No — no secret values involved, only variable presence/absence.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Env map missing `PLATFORM_TENANT_ID` | Fixture | None | |
| AC2 | Env map with `ADMIN_GITHUB_LOGINS` unset, and separately set to `''`/whitespace-only | Fixture | None | 2 variants |
| AC3 | Env map with `SKILL_EXECUTOR_PROVIDER` unset (default) and explicitly `'anthropic'`, both missing `ANTHROPIC_API_KEY` | Fixture | None | 2 variants |
| AC4 | Env map with `SKILL_EXECUTOR_PROVIDER: 'copilot'` | Fixture | None | |
| AC5 | Env map with all vars correctly set | Fixture | None | |

### Gaps

None.

---

## Unit Tests

### U1 — PLATFORM_TENANT_ID missing emits a warning naming it (AC1)

- **Verifies:** AC1
- **Precondition:** Env map with `PLATFORM_TENANT_ID` absent
- **Action:** Call the new warning-check function with that env map and a captured logger
- **Expected result:** A warning is logged that includes the string `PLATFORM_TENANT_ID` and the phrase "self-registration"
- **Edge case:** No

### U2 — PLATFORM_TENANT_ID present emits no warning for it (AC1 regression)

- **Verifies:** AC1
- **Precondition:** Env map with `PLATFORM_TENANT_ID` set to a non-empty value
- **Action:** Call the function
- **Expected result:** No warning mentioning `PLATFORM_TENANT_ID` is logged
- **Edge case:** Yes

### U3 — ADMIN_GITHUB_LOGINS unset emits a warning naming it (AC2)

- **Verifies:** AC2
- **Precondition:** Env map with `ADMIN_GITHUB_LOGINS` absent
- **Action:** Call the function
- **Expected result:** A warning is logged that includes `ADMIN_GITHUB_LOGINS` and the phrase "admin/credits" (or equivalent concrete consequence text)
- **Edge case:** No

### U4 — ADMIN_GITHUB_LOGINS set to whitespace/empty-after-split also warns (AC2)

- **Verifies:** AC2
- **Precondition:** Env map with `ADMIN_GITHUB_LOGINS: '  ,  ,'` (present but resolves to zero real logins after trim/split/filter)
- **Action:** Call the function
- **Expected result:** Same warning as U3 — an all-empty-after-parsing value is treated the same as unset, not silently accepted as "configured"
- **Edge case:** Yes

### U5 — ADMIN_GITHUB_LOGINS present with a real value emits no warning (AC2 regression)

- **Verifies:** AC2
- **Precondition:** Env map with `ADMIN_GITHUB_LOGINS: 'someuser'`
- **Action:** Call the function
- **Expected result:** No warning mentioning `ADMIN_GITHUB_LOGINS`
- **Edge case:** Yes

### U6 — anthropic (default) provider + missing ANTHROPIC_API_KEY warns (AC3)

- **Verifies:** AC3
- **Precondition:** Env map with `SKILL_EXECUTOR_PROVIDER` absent (default), `ANTHROPIC_API_KEY` absent
- **Action:** Call the function
- **Expected result:** A warning naming both `SKILL_EXECUTOR_PROVIDER`/anthropic default and `ANTHROPIC_API_KEY`
- **Edge case:** No

### U7 — explicit anthropic provider + missing ANTHROPIC_API_KEY warns (AC3)

- **Verifies:** AC3
- **Precondition:** Env map with `SKILL_EXECUTOR_PROVIDER: 'anthropic'`, `ANTHROPIC_API_KEY` absent
- **Action:** Call the function
- **Expected result:** Same warning as U6
- **Edge case:** Yes

### U8 — anthropic provider + ANTHROPIC_API_KEY present emits no warning (AC3 regression)

- **Verifies:** AC3
- **Precondition:** Env map with `SKILL_EXECUTOR_PROVIDER: 'anthropic'`, `ANTHROPIC_API_KEY: 'sk-real-value'`
- **Action:** Call the function
- **Expected result:** No warning mentioning `ANTHROPIC_API_KEY`
- **Edge case:** Yes

### U9 — copilot provider always warns about the per-user token caveat (AC4)

- **Verifies:** AC4
- **Precondition:** Env map with `SKILL_EXECUTOR_PROVIDER: 'copilot'`
- **Action:** Call the function
- **Expected result:** A warning naming `copilot` and stating the per-user/per-request Copilot-license caveat, regardless of whether `ANTHROPIC_API_KEY` happens to also be set
- **Edge case:** No

### U10 — copilot provider does NOT also emit the anthropic/ANTHROPIC_API_KEY warning (AC3/AC4 interaction)

- **Verifies:** AC3, AC4
- **Precondition:** Env map with `SKILL_EXECUTOR_PROVIDER: 'copilot'`, `ANTHROPIC_API_KEY` absent
- **Action:** Call the function
- **Expected result:** Only the copilot-caveat warning (U9) is emitted — not also a spurious "ANTHROPIC_API_KEY missing" warning, since the anthropic provider isn't active
- **Edge case:** Yes

### U11 — fully-configured environment emits zero warnings (AC5)

- **Verifies:** AC5
- **Precondition:** Env map with `PLATFORM_TENANT_ID`, `ADMIN_GITHUB_LOGINS` (real value), `ANTHROPIC_API_KEY` all set, `SKILL_EXECUTOR_PROVIDER` unset
- **Action:** Call the function
- **Expected result:** Zero warnings logged
- **Edge case:** No

---

## Integration Tests

None — the function is a pure, injectable-env-map function (matching `posthog-config.js`'s own pattern); there is no live integration seam beyond the unit tests above. The real-world confirmation is observing `flyctl logs` on the next staging/production deploy for a genuinely misconfigured var.

---

## NFR Tests

None beyond the story's own stated NFRs (no new NFR-specific test needed — Audit is covered by every unit test's message-content assertion).

---

## Out of Scope for This Test Plan

- Testing the real `server.js` boot sequence end-to-end (spawning a real process and reading stdout) — the function itself is fully unit-testable via env-map injection; wiring it into `server.js`'s existing boot block is a one-line call, consistent with how `validateRequiredEnvVars()` itself is not separately integration-tested beyond its own unit tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Cannot prove this actually gets noticed by an operator reading `flyctl logs` in practice | Behavioural/human-attention outcome, not a code property | Same class of gap as `pmec-s1`'s own accepted gap this session — confirmed by the next real misconfiguration incident (or lack thereof) going forward |
