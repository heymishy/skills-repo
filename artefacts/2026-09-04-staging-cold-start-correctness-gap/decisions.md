# Decisions: purge-e2e-tenants tolerates Neon cold-start and gets a scheduled backstop

---

## RISK-ACCEPT: AC4 (real on-schedule execution) cannot be verified by a local automated test

**Date:** 2026-09-04
**Context:** The new `purge-e2e-tenants-scheduled.yml` workflow's own `schedule: cron:` trigger only fires inside GitHub Actions' real scheduler -- there is no local harness that can simulate a cron trigger actually firing.
**Decision:** AC4's own shape (file exists, has a cron trigger, invokes the right script against the right secret) is covered by an automated test (T7). Its actual on-schedule execution is confirmed post-merge, either by waiting for the first real scheduled window or by triggering it manually via `workflow_dispatch` immediately after merge.
**Rationale:** Matches the precedent already established in CLAUDE.md's B2 rule for CSS-layout-dependent ACs, and the same pattern already used this session for `sdsb-s1` and `cpco-s1`'s own GitHub-native-behaviour-dependent ACs -- the correctness of the behaviour cannot be observed without the real external system (GitHub Actions' own scheduler), so a manual post-merge check is the right verification method, not a gap to leave silently unaddressed.

---

## Design correction: connection retry made non-fatal, not a hard pre-flight gate

**Date:** 2026-09-04
**Context:** The first implementation pass added `connectWithRetry` as a hard pre-flight check before the existing find/purge logic -- if all 3 retries failed, the whole operation aborted via the outer catch block. Running the existing regression suite (`tests/check-alrf-s11-purge-e2e-tenants.js`) immediately surfaced that this broke two tests asserting the CLI degrades gracefully (prints `[dry-run]`/`Purged` with zero tenants found, never throws) even against a completely unreachable `DATABASE_URL` -- a pre-existing, intentional tolerance built into `findE2eTenantIds`'s own per-query `try/catch { continue }` design, which the new pre-flight gate bypassed entirely.
**Decision:** The retry is now best-effort only -- if all 3 attempts fail, execution falls through into the existing find/purge logic exactly as it ran before this story, rather than aborting.
**Rationale:** A retry mechanism added to help a *recoverable* problem (a slow cold start) must never make an *unrecoverable* problem (a genuinely bad connection string) behave worse than it did before. The existing tolerant design was already correct for the permanent-failure case; this story only needed to add a chance of recovery for the transient case, not replace the existing fallback.
