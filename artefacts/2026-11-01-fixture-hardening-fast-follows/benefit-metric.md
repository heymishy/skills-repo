## Benefit Metric: Fixture Hardening Fast-Follows

**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Date defined:** 2026-11-01
**Metric owner:** Hamish King, Platform Owner (solo-operator posture — same precedent as `test-fixture-hardening-continuation`)
**Reviewers:** Hamish King, Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

Same reasoning as the parent `test-fixture-hardening-continuation` benefit-metric: this is not a pilot or hypothesis test about tooling/process separate from product value. The personas named in discovery.md (developer/engineer running the inner loop, developer maintaining the fixture-usage-check scripts, platform maintainer) are this platform's own primary personas. The metrics below are Tier 1 product metrics for the skills platform itself.

Tier 3 (compliance/risk-reduction) does not apply — this feature is test-tooling/CI-workflow-only (no production data path, no regulated data), per `discovery.md`'s Constraints section.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: `run-all-tests.js` concurrency cap

| Field | Value |
|-------|-------|
| **What we measure** | The production concurrency value `run-all-tests.js`'s pool phase uses (currently `Math.max(1, Math.ceil(os.cpus().length / 3))`) |
| **Baseline** | 3 on the 8-core reference machine (confirmed at `tfhc-s9`'s own DoD, 2026-11-01) |
| **Target** | As high as the NFR-budget sweep allows without reintroducing contention-flakes — ideally `os.cpus().length - 1` or higher |
| **Minimum validation signal** | Any increase above the current cap of 3, confirmed stable across 3+ full-suite runs with no new contention-induced failures beyond the already-accepted residual category |
| **Measurement method** | Direct code read of the production call site in `run-all-tests.js`, cross-checked against repeated local full-suite runs |
| **Feedback loop** | If the sweep finds the budgets can't be fixed without redesigning a file's own test logic (out of scope for a quick fix), the cap stays at 3 and this metric records `at-risk` with the reason — not a failure, a genuine finding |

### Metric 2: Real CI `Unit test chain` step duration

| Field | Value |
|-------|-------|
| **What we measure** | The `Unit test chain` step's wall-clock duration in the `Lint, typecheck, test, build` GitHub Actions job, isolated via `gh api repos/heymishy/skills-repo/actions/jobs/<id>` step timestamps |
| **Baseline** | 124s (confirmed on PR #1048, `tfhc-s9`) |
| **Target** | A further reduction proportional to whatever concurrency cap increase Metric 1 achieves |
| **Minimum validation signal** | Any measurable reduction below 124s on the first PR from this batch's performance story, with no new CI failures |
| **Measurement method** | Same `gh api` job-step-timing technique already proven at `tfhc-s9`'s own DoD, run on the performance story's own PR |
| **Feedback loop** | If CI shows no improvement despite a higher local cap (e.g. the CI runner has fewer cores than the dev machine), record the real runner-core-count constraint and treat it as a legitimate finding, not a failure of this story |

### Metric 3: `journeys.js` shared-fixture adoption

| Field | Value |
|-------|-------|
| **What we measure** | Count of `journeys.js`-touching test files, among the 31 current total, using the shared fixture (`tests/helpers/journeys-fixture.js`) vs. hand-rolling their own session object |
| **Baseline** | 1 of 31 (confirmed at `tfhc-s7`, 2026-10-31) |
| **Target** | 6-9 of 31 after this batch (a further 5-8 files migrated) |
| **Minimum validation signal** | At least 3 further files migrated, full suite stays green throughout |
| **Measurement method** | `scripts/check-journeys-fixture-usage.js`, re-run and grep-count cross-checked at `/review` |
| **Feedback loop** | If migrating a file breaks its own assertions in a way not explained by a real bug, treat it as a fixture ergonomics gap — revisit the canonical shape before migrating further files, same precedent as `tsir`/`tfhc`'s own earlier walking-skeleton stories |

### Metric 4: `products.js` shared-fixture adoption

| Field | Value |
|-------|-------|
| **What we measure** | Count of files calling `products.js` route handlers directly that use a shared fixture vs. hand-roll their own inline object |
| **Baseline** | 0 of N (N confirmed at `tfhc-s5`'s own spike, exact count to be re-confirmed at `/definition` since the spike's own count may need a fresh re-read) |
| **Target** | 1 migrated as proof-of-pattern within this batch |
| **Minimum validation signal** | The proof-of-pattern migration's existing assertions pass unchanged, and a new structural check (same shape as `check-journeys-fixture-usage.js`) correctly flags a hand-rolled file and passes the migrated one |
| **Measurement method** | New structural check, grep-count cross-checked at `/review` |
| **Feedback loop** | Same as Metric 3's — an ergonomics gap found during migration gets investigated before scaling, not papered over |

### Metric 5: Fixture-usage-check script count

| Field | Value |
|-------|-------|
| **What we measure** | Number of distinct, near-duplicate fixture-usage-check script implementations in `scripts/` |
| **Baseline** | 3 (`check-journey-fixture-usage.js`, `check-skills-fixture-usage.js`, `check-journeys-fixture-usage.js`) |
| **Target** | 1 shared factory (`scripts/lib/make-fixture-usage-check.js`) + 3 thin call sites, zero behaviour change |
| **Minimum validation signal** | All existing regression fixtures for all 3 scripts (including the `tfhc-s7`-era windowed-match fix's own dedicated fixtures) still pass unchanged after the refactor |
| **Measurement method** | Full test-suite run before and after the refactor; diff the 3 scripts' own test outputs to confirm identical verdicts |
| **Feedback loop** | Any behaviour change (even an improvement) found during the refactor is a scope deviation requiring its own decision, not silently folded into "just a refactor" |

### Metric 6: CI `deploy-group` cancellation incidence

| Field | Value |
|-------|-------|
| **What we measure** | Count of PRs in this repo whose Scenario A/B E2E job is cancelled due to the `deploy-group` concurrency-eviction pattern (confirmed via the job's own "Canceling since a higher priority waiting request for deploy-group exists" annotation) |
| **Baseline** | Observed 3+ times in the `fixture-divergence-closure` epic alone (`tfhc-s7`, `tfhc-s8`, `tfhc-s9` PRs) |
| **Target** | 0 going forward, or an automatic rerun closes the gap within the same PR's own check run when it still occurs |
| **Minimum validation signal** | The fix (narrower-but-still-correct scoping, or an auto-retry wrapper) survives at least 2 subsequent PRs with either zero cancellations or a confirmed automatic recovery |
| **Measurement method** | GitHub Actions run history / job annotations on subsequent PRs, same `gh run view`-based technique already used to diagnose the root cause |
| **Feedback loop** | If the fix doesn't hold across those 2 PRs, that's evidence the narrower-scoping approach doesn't fully address the platform limitation — escalate to the explicitly out-of-scope ephemeral-environments alternative as a future discovery, not silently re-attempt the same fix |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| `run-all-tests.js` concurrency cap (m1) | NFR-budget sweep story | Covered |
| Real CI `Unit test chain` step duration (m2) | NFR-budget sweep story | Covered |
| `journeys.js` shared-fixture adoption (m3) | Mechanical fixture/DRY batch story | Covered |
| `products.js` shared-fixture adoption (m4) | Mechanical fixture/DRY batch story | Covered |
| Fixture-usage-check script count (m5) | Mechanical fixture/DRY batch story | Covered |
| CI `deploy-group` cancellation incidence (m6) | CI concurrency-cancellation fix story | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
