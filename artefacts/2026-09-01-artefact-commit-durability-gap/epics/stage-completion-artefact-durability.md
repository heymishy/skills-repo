## Epic: Operators Can Trust That a Completed Stage's Artefact Is Durably Committed — Or Are Told Clearly When It Isn't

**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-01-artefact-commit-durability-gap/benefit-metric.md
**Slicing strategy:** Risk-first

<!-- Risk-first chosen because the exact failure mode behind das-s1's AC2 guard
     not functioning as specified is genuinely unknown until the actual
     ownerRepoForFeature/commitArtefact implementations are read during
     implementation -- the highest-uncertainty piece (root-cause + fix) is
     tackled first, and the signal-coverage story is built on top of the
     now-understood, now-fixed code path rather than in parallel with it. -->

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    JOURNEY[routes/journey.js\\nstage-completion call site]\n    EXPORT[adapters/export-data-source.js\\nownerRepoForFeature]\n    WRITER[adapters/artefact-commit-writer.js\\ncommitArtefact]\n    XCHAN[routes/journey.js\\n_logCrossChannelEvent]\n    POSTHOG[modules/posthog-server.js]\n    JOURNEY --> EXPORT\n    JOURNEY --> WRITER\n    JOURNEY --> XCHAN\n    XCHAN --> POSTHOG\n    XCHAN -. stdout .-> LOGS[server stdout]"}}---

## Goal

When a journey stage completes, the operator can trust — without ever having to manually cross-check GitHub — that the artefact either genuinely committed to the connected repository, genuinely and correctly skipped because no repository is connected, or blocked completion with a clear, actionable error. Today, a commit failure can occur silently: the stage still shows as "completed," the operator sees no error, and the only way to discover the gap is a manual, multi-step GitHub audit (exactly what this session had to perform for `new-feature-af17f555`). When this epic is complete, that silent failure mode no longer exists, and every outcome is both correctly enforced and independently verifiable from a log line.

## Out of Scope

- **Retroactive backfill** of artefacts for features already affected by this gap (including `new-feature-af17f555`'s own 8 missing artefacts) — a bounded, one-off data-repair task, not a general reconciliation mechanism this epic needs to build.
- **An operator-facing UI indicator** for durability status — this epic delivers a checkable server-side signal (log line + PostHog event); a dashboard or in-UI badge is a natural follow-on, not required to close the detectability gap.
- **Auditing every other stage-completion or artefact-write path** in the codebase for equivalent silent-failure patterns — scoped specifically to `das-s1`'s commit-on-completion mechanism.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| AC2 Guard Correctness | 0% (no regression test proves the block-and-error path fires on a real failure) | 100% of 3 outcome paths regression-tested | Story 1 root-causes and fixes the actual failure mode, with a dedicated regression test per path |
| Distinguishable Signal Coverage | 0% (no logged distinction between outcomes) | 100% of commit-writer code paths emit a distinguishable event | Story 2 wires all 3 outcomes through the shared `_logCrossChannelEvent` helper |
| Manual-Audit Elimination | 0% (only answerable via manual GitHub cross-check) | 100% of post-fix stage completions answerable from the signal alone | Story 2's signal, verified against a real post-deploy case in DoD |

## Stories in This Epic

- [ ] Fix the silent artefact-commit failure in stage-completion (AC2 guard) — acdg-s1
- [ ] Add a distinguishable durability signal for stage-completion commits — acdg-s2

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This touches an existing production safety guard (`das-s1`'s AC2) whose current behaviour is only partially understood until implementation investigates the real failure mode — a human should review the PR before merge, consistent with every story in this repo's recent `new-feature-af17f555` epic. Not High: the fix is narrowly scoped, additive/corrective (not a redesign), and covered by regression tests before merge.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the exact failure mode (ownerRepoForFeature resolution vs.
     commitArtefact execution) is a known unknown until code is read during
     implementation. Bounded scope and clear success criteria keep this from
     being a 3. -->

## Scope Stability

**Stability:** Stable

<!-- The OUTCOME is well-bounded (fix the guard, add the signal) even though
     the exact code change within acdg-s1 depends on implementation-time
     investigation -- this is a known unknown within a stable boundary, not
     an unstable requirement. -->
