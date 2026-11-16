# sps-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/sps-s1-session-persistence` (commits 4b598e286 red tests plus the client test seam, f3b408eeb implementation).

## Result

8 of 9 acceptance criteria (AC) verified by automated tests that have run. AC9 (live: still signed in after a later deploy, with the secret set) can only be observed after the operator sets `SESSION_ENCRYPTION_KEY` and two deploys happen.

## Tests

- `tests/check-sps-s1-encrypted-session-token.js`: 9 passed, 0 failed. Written first and run red with only a client test seam added to the adapter: T1, T2, T4, T6a and T8 failed for the right reason (the token was stripped, never stored or restored; the key-status function did not exist); T3, T6b and T7 passed before the change as invariants (a stripped session cannot leak a token across ids; with no key the real `authGuard` redirects; logout deletes the key). Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5, T6a and T6b AC6, T7 AC7, T8 the no-secret-in-logs NFR.
- The tests drive the real adapter over a recording double of the `@upstash/redis` client (its own calls: `set` with `{ ex }`, `get`, `del`, `scan`), the real `sessionMiddleware` and the real `authGuard`; the key and token are random test values.
- A test-writing mistake found and fixed on the way: a text replace also altered the login helper's `Object.assign`, which made T6a fail for the wrong reason; restored and re-run.
- AC8: the existing tests that could have pinned token stripping pass unchanged: `check-p3.2-redis-session-adapter` 17/17, `check-srf-s1-session-redis-fallback` 7/7, `check-lab-s1.3-provider-registry` 29/29, `check-p3.3-persistence-survival` 18/18, `check-sec2-redis-scan` 10/10, `check-a4-session-store-state` 5/5, `check-bri-s2.3-upstash-staging-instance` 5/5, `check-s0.4-resume-redis-session` 21/21. This is because the design as built keeps `_sanitiseForRedis` and passes the token to the adapter as a separate argument (see `decisions.md`, refined entry). The only existing-test edit is the title of AC2 in `check-p3.2-redis-session-adapter.js` (its assertion is unchanged and still true).

## Changed from the contract (recorded)

The contract said `persistSession` would hand the adapter the full session and that existing tests would be edited. As built, `persistSession` still hands over sanitised data and passes the token as a third argument, so no existing assertion changed. `.env.example` gains a commented `SESSION_ENCRYPTION_KEY` line; `server.js` calls `logKeyStatus(console)` once when Redis is configured.

## Full suite

862 files, 5 failed, all known baseline failures: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1), `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`, and `tests/check-p4-enf-second-line.js` (passes alone, exit 0). The suite's side effect on `artefacts/test-slug/ideate.md` was reverted.

## Open (operator)

- AC9: generate a 32-byte base64 key yourself (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`) and set it as the Fly secret `SESSION_ENCRYPTION_KEY` on staging, then production; never paste it into chat. Setting a secret restarts the app, so this signs people out once. Sign in, trigger a later deploy, reload: expect to still be signed in. If signed out, check the logs for the one-line warning that the key was not read.
- At DoD: add the changed token-at-rest rule as a repo-level ADR note in `.github/architecture-guardrails.md`.

## Staging observation (2026-11-16, operator-set key, agent-observed, read-only)

- Operator set `SESSION_ENCRYPTION_KEY` on `wuce-staging` (44-character base64, generated locally, never shown), signed in at `/dashboard`, then ran `fly apps restart wuce-staging`.
- After the restart, a GET of `/dashboard` from the same browser tab answered 200 with the signed-in page and no redirect to sign-in; `/version` reported commit `95da0f4` (PR #1120). Before the key was set, a restart signed everyone out.
- The one-line "SESSION_ENCRYPTION_KEY is missing" warning was not present in `fly logs --no-tail` (operator check).
- Verdict: AC9 (sessions survive a restart or deploy) observed on staging. Production observation still outstanding (needs the key set on `skills-framework`, a sign-in and a restart or deploy).
