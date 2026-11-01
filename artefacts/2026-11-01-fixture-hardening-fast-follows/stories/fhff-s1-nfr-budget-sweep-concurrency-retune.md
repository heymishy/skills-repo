## Story: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Epic reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/epics/test-infra-fast-follow-batch.md
**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Benefit-metric reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer or AI coding agent running the inner loop**,
I want **the 4 known contention-sensitive wall-clock NFR tests (`check-rb-s3-harness-agnostic-instructions.js`, `check-cat-s4-features-page-integration.js`, `check-cat-s1-core-trace-builder.js`, `check-bri-s2.2-neon-staging-branch.js`) fixed so they tolerate concurrent execution, and `run-all-tests.js`'s production concurrency cap re-tuned as high as that allows**,
So that **the full-suite feedback loop gets faster on every PR than the conservative cap `tfhc-s9` had to ship with, without reintroducing the contention-flakiness that cap was chosen to avoid**.

## Benefit Linkage

**Metric moved:** `run-all-tests.js` concurrency cap (m1), Real CI `Unit test chain` step duration (m2)
**How:** Fixing the 4 known fragile files removes the specific reason the cap was throttled to `Math.max(1, Math.ceil(os.cpus().length / 3))`; re-tuning the cap upward directly reduces both the local full-suite wall-clock time and the real CI `Unit test chain` step duration, the same relationship `tfhc-s9` already proved (lowering the cap from `-2` to `/3` cost real-world speed to buy NFR-budget safety — this story aims to buy back as much of that speed as the sweep genuinely allows).

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. No applicable guardrail found against test-NFR-budget or `run-all-tests.js` concurrency-tuning scope (confirmed at `/definition`, same finding as `tfhc-s9`'s own Category E review).

## Dependencies

- **Upstream:** None — the precondition this story depends on (a correctness-safe concurrent runner) was already closed by `tfhc-s9`.
- **Downstream:** None named yet.

## Acceptance Criteria

**AC1:** Given each of the 4 known fragile files (`rb-s3`, `cat-s4`, `cat-s1`, `bri-s2.2`), When its own wall-clock NFR assertion is investigated and fixed (a threshold widen only if genuinely justified by real contended-run-time evidence gathered during this story, or a redesign if a widen would mean "never fails"), Then each file passes consistently (0 failures) across at least 5 repeated full-suite runs at the story's own new, higher concurrency cap.

> **Resolution (2026-11-01, Task 2 investigation — see decisions.md):** All 4 files were genuinely investigated across 16 real full-suite runs at concurrency 4–8. `cat-s4` and `bri-s2.2` needed no fix (never failed at any tested level). `rb-s3` and `cat-s1` were deferred via AC5 below — `rb-s3` fails 100% of the time at every concurrency above 3 with no narrow safe-widen window, and fixing it alone would not be sufficient since `tfhc-s9`'s own test file also breaks above concurrency 3 (out of this story's scope). AC1's "new, higher concurrency cap" premise did not hold — see AC2's resolution.

**AC2:** Given AC1's own findings, When the production concurrency cap in `run-all-tests.js` is re-tuned, Then it is set to the highest value empirically confirmed stable across those repeated runs, replacing the current `Math.max(1, Math.ceil(os.cpus().length / 3))`.

> **Resolution (2026-11-01, Task 2 investigation — see decisions.md):** The highest value empirically confirmed stable across the repeated runs is the current value itself (3 on the 8-core reference machine) — no concurrency above 3 was stable without also breaking `tfhc-s9`'s own test file. AC2 is satisfied as a genuine empirical confirmation that 3 is already optimal, not by a numeric increase. `getPoolConcurrency()`'s return value is unchanged from Task 1's extraction. `m1`/`m2` (benefit-metric.md) report "no safe increase found" as the real, honest outcome of this story's investigation.

**AC3:** Given the new cap, When the full local suite is run at least 3 times, Then no file other than the already-known, already-accepted residual-risk category (a file that passes standalone but occasionally flakes under load) shows a new or different failure.

> **Resolution (2026-11-01 — see decisions.md):** Trivially satisfied — since AC2's resolution keeps the cap unchanged at 3, there is no new cap to introduce a new failure. Confirmed by Task 1's own full-suite run (818 files, 4 known failures, no new ones) and Task 2's 2 comparison runs at the current concurrency 3.

**AC4:** Given the new cap is merged, When the real CI `Unit test chain` step duration is measured on this story's own PR (same `gh api repos/heymishy/skills-repo/actions/jobs/<id>` technique already proven at `tfhc-s9`'s own DoD), Then it shows a measurable reduction below the confirmed 124s baseline.

> **Resolution (2026-11-01 — see decisions.md):** AC4's premise does not hold given AC2's resolution — with no cap change, there is no mechanism by which real CI duration would measurably reduce. AC4 is NOT met as originally written. This is logged as a genuine negative result (same honesty standard as AC1/AC2's own resolutions), not silently dropped: `m2` (benefit-metric.md) will report "no change — cap-increase premise did not hold" rather than a reduction. The real CI measurement step itself (Task 3/DoD) is still worth running once, to confirm duration stays flat (not regressed) rather than to show an improvement.

**AC5:** Given the sweep finds that fixing one of the 4 files would require widening its threshold enough that it would never meaningfully fail (not a real NFR anymore), When this is found, Then that specific file's fix is deferred as a named follow-up and logged in `decisions.md` rather than merged with an unsafe, meaningless threshold.

> **Resolution (2026-11-01, Task 2 investigation — see decisions.md):** Triggered for both `rb-s3` (no safe widen exists at any tested concurrency) and `cat-s1` (a safe widen exists in isolation, but is a no-op since the cap isn't moving). Both logged as RISK-ACCEPT entries in `decisions.md`.

## Out of Scope

- Redesigning any of the 4 files' own test logic beyond what's needed to fix their wall-clock contention-sensitivity — no unrelated refactoring.
- Any new parallelization mechanism (sharding, a different test framework) — this story only re-tunes the existing cap.
- Fixing any additional fragile file discovered beyond the 4 named, if the sweep's own "more files may surface" risk (named in discovery.md's Assumptions, and already confirmed to materialise once via `bri-s2.2`) materialises again, that gets logged as a scope decision, not silently absorbed into this story's own bounded work.
- Touching any file other than the 4 named NFR-budget files and `scripts/run-all-tests.js` itself.

## NFRs

- **Performance:** Real CI `Unit test chain` step duration measurably reduces below the confirmed 124s baseline (m2); the production concurrency cap (m1) increases above the current value of 3, confirmed stable across repeated local runs.
- **Security:** None identified — no new production code path, test-tooling/CI-measurement-only.
- **Accessibility:** N/A — no UI.
- **Audit:** N/A — no audit-relevant surface.

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

<!-- Rating 3, not 2, because the actual fix complexity for rb-s3/cat-s4/cat-s1 is genuinely unknown per /clarify's own explicit finding -- this is the epic's own highest-uncertainty story, consistent with the risk-first slicing strategy placing it first. Scope stability Unstable for the same reason: the "more fragile files may surface" risk is real, evidenced (tfhc-s9 hit this twice), and could require a scope conversation mid-implementation. -->

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
