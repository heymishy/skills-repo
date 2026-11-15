## Definition of Ready: Keep people signed in across deploys by storing the login token encrypted

**Story reference:** artefacts/2026-11-16-session-persistence/stories/sps-s1-persist-login-across-deploys.md
**Test plan reference:** artefacts/2026-11-16-session-persistence/test-plans/sps-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-session-persistence/dor/sps-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** One new utility module, two edited source files, one example-config line, one new test file and a named set of edited existing tests; all 9 acceptance criteria (AC) map to a named test or a named live scenario. The contract's exclusion list (OAuth login, `authGuard`, cookie settings, the TTL, tenant isolation, new dependencies, Postgres storage, silent re-login, key rotation tooling, skill-session Redis) has zero test assertions against it, and every touched file is one the tests need (B1/D1 check: no touched file appears in the exclusion list). The edited existing tests are listed in the contract so the "token never written to Redis" expectation is superseded deliberately, not silently.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied, as for the earlier short-track stories in this repo.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a signed-in person using the platform (and the operator checking a deploy in a browser)" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 9 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6a and T6b, AC7 T7, AC8 edited tests, AC9 live scenario 9 |
| H4 | Out of scope populated | ✅ | 5 exclusions |
| H5 | Benefit linkage | ✅ (short-track) | Removes the sign-out after every deploy |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | No review ran |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC9 live-only, acknowledged |
| H9 | Architecture Constraints populated | ✅ | Names ADR-009, ADR-011, ADR-025 (not engaged); the supersession of the 2026-07-22 decision is stated |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No AC depends on CSS layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Security, reliability, performance in the story |
| H-ADAPTER | Injectable adapter (D37) | ✅ | The Redis adapter is already wired in `server.js`; the wiring test (T6a) asserts behaviour through the real middleware and `authGuard`, not just that a function was assigned |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI markup changes; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (3 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1, W2, W3 | ✅ | |
| W4 | ⚠️ Pending operator | Scenario 9 needs the operator to set `SESSION_ENCRYPTION_KEY` on staging and production and to observe a later deploy; the agent never sees the key |
| W5 | ⚠️ Accepted | Security-posture change: a live GitHub token will exist (encrypted) in the third-party Redis. Mitigations: AES-256-GCM, per-write nonce, session-id binding, key separate from `SESSION_SECRET`, fail-safe to signed out, 24-hour TTL. Accepted by the operator's explicit choice on 2026-11-16 |
| W6 | ⚠️ Accepted | Rotating the key signs everyone out once |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Medium** - authentication path and a changed security posture, but the design is small, fail-safe and fully test-covered. The operator has made the design decision (recorded in the story); the operator reviews and merges the PR; no other named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-session-persistence/stories/sps-s1-persist-login-across-deploys.md
Test plan: artefacts/2026-11-16-session-persistence/test-plans/sps-s1-test-plan.md
Contract: artefacts/2026-11-16-session-persistence/dor/sps-s1-dor-contract.md
Goal: write tests/check-sps-s1-encrypted-session-token.js (T1 to T8, T6a, T6b, T7) first and confirm T1, T2, T6a FAIL for the right reason (the token is stripped today); then implement token-crypto.js and the adapter and middleware changes; then edit the existing tests that pinned stripping. No scope beyond the 9 ACs.
Constraints:
- AES-256-GCM, random 12-byte nonce per write, session id as additional authenticated data, key from SESSION_ENCRYPTION_KEY (base64, exactly 32 bytes). Any failure (no key, bad key, wrong key, corrupt, tampered, unknown version) means no token and no throw. Never log the token, the key or any ciphertext part.
- The plaintext accessToken must never appear in the value written to Redis. With no key, behaviour is exactly today's (token stripped) plus one startup warning line.
- Use Node's built-in crypto only; no new npm dependency. Do not touch OAuth login, authGuard, cookie settings, the TTL or skill-session-redis.js.
- Edit only the existing tests that assert stripping and only their stripping assertions; list each one you edit in the evidence file.
- Do not generate or write any real key anywhere. Tests generate a random key in memory.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges; no production deploy; the operator sets the Fly secret.
Oversight level: Medium - operator reviews and merges the PR.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** operator review and merge of the PR (design decision already recorded 2026-11-16); W4, W5 and W6 advisory and accepted.
