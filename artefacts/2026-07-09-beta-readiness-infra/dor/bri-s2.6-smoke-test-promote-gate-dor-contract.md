# DoR Contract Proposal: Add staging smoke test + manual promote gate to prod

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.6-smoke-test-promote-gate-test-plan.md
**Date:** 2026-07-10

---

## What will be built

A smoke-test job that runs the currently-available `@mocked`-tagged Playwright suite against the staging URL after the seed step (S2.4/S2.5), reporting a clear pass/fail result. A promote job gated behind (a) a `needs:` dependency on the smoke-test job succeeding, and (b) either a `workflow_dispatch` manual trigger or a GitHub Actions `environment:` requiring Hamish's explicit reviewer approval. A red suite structurally skips the promote job (GitHub Actions' native `needs:` behaviour, with no `if: always()` override). A rollback runbook (`docs/rollback-runbook.md`) documents concrete, copy-pasteable commands to identify and redeploy the previous known-good `wuce-prod` release.

## What will NOT be built (explicit exclusions)

- No automated rollback on post-promote failure detection (per story Out of Scope) — rollback is manual-but-documented
- No staging-of-staging rehearsal tier (per story Out of Scope) — one staging tier is sufficient for MVP
- No live execution of a real rollback as part of verification — deliberately never live-tested (see Coverage gaps); verified via documented dry-run/walkthrough instead
- No expansion of the `@mocked` suite's actual content — that is Epic 3's scope; this story only builds the gate mechanics around whatever suite exists at any given time

## AC → Test-approach table

| AC | Test approach |
|----|----------------|
| AC1 — available `@mocked` suite runs against staging, reports clear pass/fail | Unit: T1 (job runs Playwright `--grep @mocked` against staging URL after seed step), T2 (pass/fail status is real — no `continue-on-error`, ordered before promote). Manual: Scenario 1 |
| AC2 — green suite still requires explicit manual approval | Unit: T3 (promote job requires `workflow_dispatch` or `environment:` gate), T4 (`--app wuce-prod` only inside the gated promote job). Manual: Scenario 2 — confirm named human reviewer in GitHub Settings → Environments (External-dependency, acknowledged) |
| AC3 — red suite structurally blocks promote | Unit: T5 (`needs:` dependency on smoke-test job), T6 (no `if: always()` override). Manual: Scenario 3 |
| AC4 — documented, usable rollback path | Unit: T7 (runbook file exists), T8 (concrete `fly releases`/`fly deploy --image` commands present, not narrative). Manual: Scenario 4 — documented dry-run/walkthrough, never a live rehearsal (Untestable-by-nature, acknowledged) |
| NFR-Performance | Config-level proxy: `timeout-minutes` on the smoke-test job at/below 10 (coordinated with epic's Metric 6 target); real measured runtime is a partial gap until Epic 3's suite has meaningful size |
| NFR-Security | T3 (workflow-level gate) + manual confirmation that the named reviewer is Hamish, not a service account |

## Assumptions

- **Cross-epic dependency (disclosed, not hidden):** This story's AC1 depends on at least bri-s3.1 (Epic 3, mock LLM gateway) existing to provide a real `@mocked` suite to run. Per `epic-2-staging-environment.md`'s "Cross-epic dependency" note (added 2026-07-09, post-/review) and this story's own Architecture Constraints, S2.6 cannot reach DoD strictly before Epic 3 begins — only S2.1–S2.5 are fully independent of Epic 3. The test plan's T1/T2 test the gate mechanics (does a job run `--grep @mocked` against staging and report pass/fail) independent of how many specs currently carry that tag, so the gate itself can be implemented and unit-tested now; full end-to-end demonstration of AC1 against a real suite is sequenced after bri-s3.1 lands.
- T5/T6's promote-job structure depends on S2.5's staging deploy pipeline already existing as the trigger point (S2.5 is DoR-ready per this same batch).
- The Neon cold-start timeout budget (10 seconds, corrected 2026-07-09 per S2.2) is the reference figure the smoke test must tolerate without false-failing.

## Estimated touch points

- `.github/workflows/*.yml` (modified or new — smoke-test job + promote job, extending S2.5's pipeline)
- `docs/rollback-runbook.md` (new file)
- `tests/` — new test file for T1–T8 (e.g. `tests/check-bri-s2.6-smoke-test-promote-gate.js`)
- GitHub repo Settings → Environments (not a repo file — reviewer assignment, covered by manual Scenario 2)

## Contract Review

Checked against the story's 4 ACs and the test plan's AC Coverage table — no mismatch found. The cross-epic dependency is explicitly disclosed at both the epic level and the story level, and the test plan's own Test Gaps table treats it as a structural, acknowledged sequencing condition (gate mechanics testable now; full-suite demonstration sequenced after bri-s3.1) — not a hidden or uncovered gap. No hard block from contract review. Per task scope, this dependency does not fail H3/H8 — it is treated as an acknowledged, sequenced dependency.
