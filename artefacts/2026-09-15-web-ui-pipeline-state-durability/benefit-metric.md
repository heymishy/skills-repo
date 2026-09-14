## Benefit Metric: Web UI Pipeline-State Durability

**Discovery reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/discovery.md
**Date defined:** 2026-09-15
**Metric owner:** Hamish King — Operator
**Reviewers:** Hamish King — Operator

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes
This initiative directly validates the "seamless move between web UI and Claude Code" hypothesis this session set out to test — a tooling/process capability, not a user-facing product feature in its own right.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Pipeline-state accuracy for web-UI-originated features

| Field | Value |
|-------|-------|
| **What we measure** | Whether `.github/pipeline-state.json` on `origin/master` contains an entry for a feature that was created/progressed through the production web UI, matching its real stage |
| **Baseline** | 0% — confirmed by direct testing on 2026-09-14/15: two independent web-UI-originated features (a real 13-story feature and a throwaway test feature), both fully absent from pipeline-state.json despite completing multiple real stages |
| **Target** | 100% — every web-UI stage completion (discovery approval, benefit-metric, design, definition, review, DoR) that succeeds also produces a correct pipeline-state.json entry, durably committed to `origin/master` |
| **Minimum validation signal** | A single new feature created end-to-end through the web UI, verified present and stage-accurate in `.github/pipeline-state.json` after pulling `origin/master` fresh |
| **Measurement method** | Manual verification (as performed this session): create/progress a feature via the web UI, `git fetch origin master`, inspect the resulting pipeline-state.json entry directly |
| **Feedback loop** | If writes still fail under real production conditions (e.g. concurrent-edit conflicts occur more often than assumed), the operator reviews the failure-surfacing signal (see Metric 2) and decides whether the concurrency-retry strategy needs strengthening before considering this shipped |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: Silent-failure elimination for governed state writes

| Field | Value |
|-------|-------|
| **Hypothesis** | A governed write path that can fail (network, API rate limit, stale concurrency token) must surface that failure somewhere an operator will actually see it — a server-side-only log line is equivalent to no signal at all, as directly observed this session for both the pipeline-state write failure itself and, separately, for the `ltd-s1` LLM-truncation incident earlier this week |
| **What we measure** | Whether a deliberately-forced write failure (e.g. a simulated stale `sha`) produces a signal outside the server's own console log |
| **Baseline** | 0 — today's `pipeline_state_write_failed` log entry is genuinely invisible; no operator has ever seen one despite it firing on every single production write attempt to date |
| **Target** | A forced failure produces a signal an operator can find without SSH/log access — at minimum a durable, queryable event (e.g. a PostHog capture, consistent with this session's own precedent), ideally something closer to real-time |
| **Minimum signal** | The failure is at least captured somewhere queryable after the fact — not necessarily real-time-alerted, but findable |
| **Measurement method** | Manual: force a conflict (two concurrent writes to the same feature), confirm the resulting failure (if the retry strategy is exhausted) is visible via the chosen signal channel |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Pipeline-state accuracy | wsd-s1, wsd-s2 | Covered |
| Meta Metric 1 — Silent-failure elimination | wsd-s2 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /design and /definition
- Sprint targets or velocity — these metrics are outcome-based, not output-based
