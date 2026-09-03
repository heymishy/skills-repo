# Benefit Metric: Archive Completed Features Out of pipeline-state.json

**Discovery reference:** artefacts/2026-09-03-pipeline-state-archive-completed-features/discovery.md
**Date defined:** 2026-09-03
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is an internal platform-tooling initiative (reducing merge-conflict friction and file-growth risk on this repo's own `pipeline-state.json`), not a hypothesis about agentic tooling capability or process validation — standard product metrics only, where "product" here is this repo's own delivery pipeline infrastructure, matching the established pattern for prior internal-tooling stories (`pcr-s1`, `psms-s1`).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Live pipeline-state.json size

| Field | Value |
|-------|-------|
| **What we measure** | The byte size of `.github/pipeline-state.json` on `master`, measured directly via file size — not a proxy. |
| **Baseline** | 1.34MB / 237 features (2026-09-03). |
| **Target** | Stays at or below ~500KB on an ongoing basis, indefinitely — never grows unbounded again. |
| **Minimum validation signal** | A single successful archive run that brings the live file under 600KB (allows some margin below the 500KB target for the first real run, before the ongoing enforcement mechanism has had time to prove itself over multiple cycles). |
| **Measurement method** | A file-size check, either as a standalone CI step or read directly from `ls -la .github/pipeline-state.json` — checked by the metric owner weekly for the first month post-launch, then monthly once the enforcement mechanism (Metric 3) is confirmed stable. |
| **Feedback loop** | If the live file exceeds 500KB with the enforcement mechanism reporting itself as healthy (i.e. it ran recently but the file is still large — e.g. N=30 is too generous for current delivery volume), the metric owner decides whether to lower N or introduce a secondary trigger. If the file exceeds 500KB *because* the enforcement mechanism itself is not running, that is a Metric 3 failure, not a Metric 1 one — escalate there instead. |

### Metric 2: Merge-conflict frequency on pipeline-state.json

| Field | Value |
|-------|-------|
| **What we measure** | The count of commits in this repo's git history that explicitly resolve a `pipeline-state.json` merge conflict, identified via `git log --all --oneline -i --grep="pipeline-state.*conflict\|conflict.*pipeline-state"` (the same query used to establish the baseline). |
| **Baseline** | 6 confirmed conflict-resolution commits across this repo's full history as of 2026-09-03 (`5d393e3b`, `d1d1de9a`, `7a1fe5e2`, `43b5e3d1`, `349e7e2e`, `d7cff366`), including one explicit same-session recurrence (`res-s1`/`res-s2`, PR #780). |
| **Target** | Zero new confirmed conflict-resolution commits in the 90 days following this feature's own deployment, measured against a comparable-volume 90-day window from before it shipped. |
| **Minimum validation signal** | No *new same-session recurrence* of the failure mode (the specific pattern `d7cff366` recorded — the same conflict hitting twice within one session) — this was the sharpest, most concrete evidence of real pain, and avoiding a repeat of it is the lowest bar that still counts as genuine improvement. |
| **Measurement method** | Re-run the same git-log query monthly for the first 90 days post-launch; the metric owner compares the new-conflict count against a normalized rate (conflicts per N delivered features) rather than a raw count, since delivery volume itself varies month to month. |
| **Feedback loop** | If new conflicts keep occurring at the same or a higher rate despite the live file staying small (Metric 1 on target), the root cause may not have been file size after all — revisit the discovery's own resolved assumption about size vs. general concurrent-write race pattern, and consider whether `pcr-s1`/`psms-s1`'s own merge-resolution logic itself needs further work, separate from this feature. |

### Metric 3: Time since last successful archive run (enforcement health)

| Field | Value |
|-------|-------|
| **What we measure** | The `archivedAt` timestamp inside `.github/pipeline-state-archive.json`, compared against the current date — the enforcement mechanism's own proof-of-life, directly targeting the exact failure mode that killed the prior archive mechanism (a manual trigger nobody remembered to keep running). |
| **Baseline** | ~113 days as of 2026-09-03 (last run: 2026-05-13; never repeated since). |
| **Target** | Never exceeds the chosen cron interval (proposed: weekly, to be confirmed at /definition) by more than one missed cycle — i.e. no silent, multi-month gap like the one that defines today's baseline. |
| **Minimum validation signal** | At least one automatic (non-manually-triggered) successful archive run within 30 days of this feature shipping — proves the scheduled workflow genuinely fires without a human remembering to invoke it, the one thing the prior mechanism never demonstrated even once. |
| **Measurement method** | The CI gate itself (see discovery.md MVP Scope) reads this timestamp on every PR and is the primary, always-on measurement — no separate manual check needed once it ships. Until the gate exists, the metric owner checks the timestamp manually at the same cadence as Metric 1. |
| **Feedback loop** | If the scheduled workflow silently stops firing (the exact prior failure mode), the CI gate is designed to catch it within one gate-checked PR — if a gap is found, the metric owner runs the archive script manually as an immediate remediation and separately investigates why the schedule failed (Action minutes exhausted, workflow disabled, a bug introduced by an unrelated change, etc.). |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Live pipeline-state.json size | *(populated at /definition)* | Pending |
| Metric 2 — Merge-conflict frequency | *(populated at /definition)* | Pending |
| Metric 3 — Time since last successful archive run | *(populated at /definition)* | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at /definition
- Implementation approach (the exact keep-N script design, the specific CI gate check, the cron cadence) — decided at /definition and already partly captured in discovery.md's own MVP Scope and Assumptions
- Sprint targets or velocity — these metrics are outcome-based (file size, conflict rate, enforcement uptime), not output-based (lines of code, PRs merged)
