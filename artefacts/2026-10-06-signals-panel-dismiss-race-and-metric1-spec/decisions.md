# Decisions: signals-panel dismiss-race fix and Metric 1 timing spec

## Short-track exemption (2026-10-06)

**Context:** Both stories are real follow-ups explicitly named in `artefacts/2026-10-04-signals-panel-triage-ux/dod/sptu-s3-dod.md`'s own DoD Observations and Follow-up actions (2026-10-06), at the operator's explicit request ("Do both follow ups please").
**Decision:** Handled as short-track stories (`/test-plan → /definition-of-ready → coding agent`) — `spdr-s1` is a one-line UI robustness fix, `spdr-s2` is a bounded test-infrastructure addition reusing an already-established seeding pattern. Neither is a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent for this exact class of situation (`tvpf-s1`, `dswf-s1`, `wswda-s1`).
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## Architectural choice: extend /test/seed-signals rather than add a second seed endpoint (2026-10-06, spdr-s2)

**Context:** `spdr-s2`'s timing spec needs a fixture with a realistic type/date mix (some `parse-error`, some dated non-`parse-error`) that the existing `/test/seed-signals` endpoint cannot produce (it only generates a uniform `count` of identical `type: 'note'`, `timestamp: null` signals).
**Decision:** Extend `/test/seed-signals` to accept an optional `signals` array in its POST body for full custom control, falling back to the existing uniform generator when absent (backward compatible).
**Rationale:** A second, near-identical seed endpoint would duplicate the existing one's own `NODE_ENV=test` guard and `setSignalsSource()` wiring for no real benefit; extending the existing one is the smaller, more consistent change, and this repo's own established `cdg.6`-style convention favours reusing an existing seam over inventing a parallel one. Verified both existing callers (`ep2-s1-signals-panel.spec.js`, `ep2-s3-signals-pagination.spec.js`) only ever pass `{ count }`, never `{ signals }`, so the fallback path is exactly what they already exercise — no behavioural change for them (AC4).
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## Scope note: spdr-s2 does not replace sptu-s3-dod.md's own real measurement (2026-10-06)

**Context:** `sptu-s3-dod.md`'s Metric 1 signal (210.5s, real repo data, Claude-in-Chrome) and `spdr-s2`'s own Playwright spec (seeded fixture, sub-15s regression guard) answer different questions.
**Decision:** Both are kept as distinct, clearly-labelled evidence. `spdr-s2`'s spec result is NOT written into `sptu-s3-dod.md`'s own Metric Signal row as a replacement number — it is referenced from `spdr-s2`'s own DoD only, with an explicit cross-reference.
**Rationale:** Conflating a deterministic-fixture regression-guard number with the real-backlog human-facing metric would overclaim precision in one direction (fixture data isn't the real distribution) and underclaim it in the other (the real measurement has caveats a repeatable fixture test removes) — keeping them separate is the honest choice, consistent with this session's own evidence-tier discipline.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## RISK-ACCEPT: pre-existing worker-parallel race between ep2-s1 and ep2-s3's own specs, discovered incidentally (2026-10-06, spdr-s2)

**Context:** While verifying spdr-s2's AC4 (existing /test/seed-signals callers unaffected), running ep2-s1-signals-panel.spec.js and ep2-s3-signals-pagination.spec.js together with Playwright's default 2-worker parallelism reproduced a real failure (ep2-s1 expected 24 fixture signals, got 50 real ones) — both specs share one module-level setSignalsSource/_signalsSourceOverride in the single shared webServer process, and ep2-s3's own /test/reset-signals-source call can race ep2-s1's seed-then-navigate sequence. Confirmed pre-existing and unrelated to this story: both specs pass individually in isolation, and neither spec's own file nor the shared override/reset logic was touched by spdr-s2's extension (which only adds a new, unexercised-by-them signals array branch).
**Decision:** Acknowledge as pre-existing and out of scope for spdr-s2. Not fixed here.
**Rationale:** A real fix (e.g. per-spec state isolation, or a shared mutex around seed/reset) is a larger design change to this repo's own Playwright fixture-seeding convention, affecting every spec that uses setSignalsSource, not something a single story's own DoD should absorb. Logged as a real /improve candidate: the full npm run test:e2e CI job (.github/workflows/e2e.yml line 83) runs the entire tests/e2e/ directory with default (non-1) worker parallelism, so this race is latent in real CI today, not merely a local artifact — worth a dedicated investigation.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), found during spdr-s2's own AC4 verification, 2026-10-06.
