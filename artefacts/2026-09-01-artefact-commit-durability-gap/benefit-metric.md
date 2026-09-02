## Benefit Metric: Completed Stages Can Silently Lack Durable Git Backing

**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md (Approved — Hamish King, Platform Owner, 2026-09-02)
**Date defined:** 2026-09-02
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a reliability/observability fix to an existing platform mechanism (`das-s1`'s stage-completion commit-writer), not a hypothesis test about tooling, process, or team capability. No Tier 2 meta-metrics apply. No named regulatory or compliance obligation is in play, so no Tier 3 metrics apply either — this is a platform-reliability initiative measured entirely on Tier 1 terms, with the platform's own developer/tech-lead personas (per `product/mission.md`) as the users whose value is being protected.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: AC2 Guard Correctness

| Field | Value |
|-------|-------|
| **What we measure** | Whether a stage-completion artefact-commit failure — once `ownerRepoForFeature` has successfully resolved a real repo link — blocks `completeStage()` and surfaces a clear operator-facing error, exactly as `das-s1`'s own AC2 specifies. Verified by dedicated regression tests exercising all 3 outcome paths (resolved+succeeded, resolved+failed, genuinely-no-repo), not by inference. |
| **Baseline** | 0% — no dedicated test today proves AC2's block-and-error behaviour actually fires on a real commit failure; this session's live investigation of `new-feature-af17f555` (continuously linked to a repo-connected product, yet its 8 stages' artefacts never reached git with no operator-visible error) is direct evidence the guard is not functioning as specified today. |
| **Target** | 100% — all 3 outcome paths covered by tests that pass, confirming AC2's contract is restored: the specific failure mode that let `new-feature-af17f555`'s commits vanish silently is identified, fixed, and has a regression test that would have caught it. |
| **Minimum validation signal** | The one confirmed-live failure mode (whichever of `ownerRepoForFeature` resolution vs. `commitArtefact` execution is root-caused during implementation) is fixed and regression-tested, even if a theoretically-possible but unobserved third failure mode is not yet separately covered. |
| **Measurement method** | `node scripts/run-all-tests.js` output for the new test file(s); a dedicated regression test per outcome path is the pass/fail signal, not a percentage computed from production traffic. |
| **Feedback loop** | If the fix's own regression tests cannot force a genuine `commitArtefact`/`ownerRepoForFeature` failure to confirm AC2's block-and-error path (e.g. only mockable, not exercisable against a real failure condition), that gap must be disclosed in the story's DoD rather than silently assumed correct — matching this repo's own established convention (`ep1-s5`'s PostHog-failure test, `ep1-s6`'s stage-navigation from/to test) for testing fire-and-forget/error-path code. |

### Metric 2: Distinguishable Signal Coverage

| Field | Value |
|-------|-------|
| **What we measure** | Percentage of code paths through `das-s1`'s stage-completion commit-writer call site that emit one of the 3 distinguishable `_logCrossChannelEvent` outcomes (`artefact_commit_succeeded`, `artefact_commit_failed`, `artefact_commit_skipped`) with `featureSlug`, `stage`, `outcome`, and `reason` (when skipped/failed). |
| **Baseline** | 0% — today, zero of the 3 outcomes are logged distinguishably; the call site's existing catch-and-continue behaviour (`journey.js` lines ~2439–2444) produces an identical, silent result for a genuine no-repo skip and a resolution failure. |
| **Target** | 100% — every code path through the commit-on-completion call site emits exactly one of the 3 distinguishable event types, reusing `ep1-s6`'s shared `_logCrossChannelEvent` helper (per `decisions.md`, no parallel logging mechanism). |
| **Minimum validation signal** | The two most common cases — genuine skip and success — are covered and confirmed live in production logs within 2 weeks of deploy; the failure case is code-path-tested even if a real failure hasn't yet occurred to confirm it live (same acceptable-gap framing the discovery itself used). |
| **Measurement method** | Dedicated unit tests asserting emission on each of the 3 code paths (mirroring `ep1-s6`'s `check-ep1-s6-instrumentation.js` pattern); a live grep of production `stdout` logs for `[cross-channel] {"eventType":"artefact_commit_` post-deploy, reviewed weekly for the first 4 weeks by the metric owner. |
| **Feedback loop** | If, 2 weeks post-deploy, only the "skipped" outcome has ever appeared in production logs (no "succeeded" case observed), investigate whether the signal itself is wired into the wrong call site or condition — do not assume the absence of "succeeded" events is itself evidence the fix is broken without checking whether any stage has actually completed for a repo-connected product in that window. |

### Metric 3: Manual-Audit Elimination

| Field | Value |
|-------|-------|
| **What we measure** | Whether the question "does stage X of feature Y have durable git backing?" is answerable directly from the new signal (log line or queryable field) without touching the GitHub API — the exact manual process (`gh api .../contents/...`, `gh pr list --search`, `git log --all`) this session had to perform by hand. |
| **Baseline** | 0% — today this question is only answerable via the manual multi-step GitHub cross-check this session performed for `new-feature-af17f555`. |
| **Target** | 100% of stages completed after this ships are answerable from the signal alone, verified against `new-feature-af17f555`'s own already-confirmed gap as the acceptance case (once the fix ships, a fresh test feature's stage completion should show a `succeeded` or `skipped` event immediately, with no need to touch `gh api`). |
| **Minimum validation signal** | At least one real post-deploy stage completion for a repo-connected product is confirmed answerable from the signal alone, cross-checked once manually via GitHub to prove the signal and reality agree — establishing trust in the signal before treating it as sufficient going forward. |
| **Measurement method** | Manual verification step included in the story's own DoD: complete one real stage for a repo-connected test feature post-deploy, confirm the signal correctly reports the outcome, and separately confirm via `gh api` that the actual GitHub state matches what the signal reported. |
| **Feedback loop** | If the signal and the manual GitHub cross-check ever disagree, the signal itself has a bug and is not yet trustworthy as a replacement for manual auditing — do not close this metric as met until they agree on at least one real case. |

<!-- All 3 metrics trace to this discovery's single MVP scope (root-cause + fix AC2's guard, plus the distinguishing signal) — expect a single story or a small, tightly-coupled pair of stories at /definition, not a large story count, given Complexity is likely 1-2 per this repo's estimation model. -->

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — AC2 Guard Correctness | acdg-s1 | Covered |
| Metric 2 — Distinguishable Signal Coverage | acdg-s2 | Covered |
| Metric 3 — Manual-Audit Elimination | acdg-s2 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach (exactly which of `ownerRepoForFeature` or `commitArtefact` is broken, and how the fix is structured) — that is `/definition`'s and the implementation plan's job, per the discovery's own still-open assumption
- Sprint targets or velocity — these metrics are outcome-based (does the guard work, is the signal trustworthy), not output-based (lines of code, tasks closed)
