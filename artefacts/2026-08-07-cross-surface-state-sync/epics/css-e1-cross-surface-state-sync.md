## Epic: Pipeline-state.json and web-UI journeys stay in automatic agreement

**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Benefit-metric reference:** artefacts/2026-08-07-cross-surface-state-sync/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When a feature is tracked from both surfaces — the CLI harness's `pipeline-state.json` and a web-UI journey's own Postgres-backed stage record — an operator advancing either side sees the other side reflect that advance automatically, without a manual sync click. If the two sides genuinely disagree (both advanced independently since the last sync), `pipeline-state.json`'s value wins, the journey's record is corrected to match, and the disagreement is visibly logged rather than silently discarded. The correlation is always by feature slug, propagated from whichever side originates a feature — never two independently-typed slugs expected to coincidentally match.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    CLI[bin/skills gate-advance] --> GATEMAP[src/enforcement/gate-map.js]\n    GATEMAP --> SYNC1[NEW css-s1: src/sync/pipeline-state-to-journey-sync.js]\n    SYNC1 --> PGJ[(Postgres: journeys)]\n    JROUTE[src/web-ui/routes/journey.js handlePostGateConfirm] --> DASWRITER[das-s1: artefact-commit-writer.js]\n    JROUTE --> SYNC2[NEW css-s2: src/web-ui/adapters/pipeline-state-commit-writer.js]\n    SYNC2 --> GHAPI[GitHub Contents API]\n    GHAPI --> PSJSON[(pipeline-state.json)]\n    SYNC1 --> RESOLVER[NEW css-s3: src/sync/conflict-resolver.js]\n    SYNC2 --> RESOLVER\n    RESOLVER --> SYNCLOG[(Postgres: sync_log)]\n    RESOLVER --> PGJ\n    RECON[NEW css-s4: src/sync/reconciliation.js] --> SYNCLOG\n    RECON --> SYNC2"}}---

## Out of Scope

- **Changing the stage/gate vocabulary on either side** — the two systems already use compatible terms; this epic connects them, it does not redefine either one.
- **Syncing features that exist on only one side** — nothing to reconcile when there is no corresponding record on the other surface.
- **Retroactively backfilling already-existing historical divergence** — this epic is forward-looking (new advances going forward), not a migration of past state.
- **Persisting or storing the authenticated user's OAuth token for later background use** — resolved at Step 1.5 architecture-constraints scan: the web-UI-to-`pipeline-state.json` write direction uses a bounded in-request retry only, within the original authenticated request's lifetime. No token storage, no background job holding credentials.
- **Products with no connected repo** — this mechanism is inherently scoped to repo-connected products (per `das-s2`'s "repo required for new products" direction); a product with no connected repo has nothing to sync `pipeline-state.json` to.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Automatic cross-surface agreement rate | 0% | 100% of phase-boundary advances propagate automatically | css-s1 proves the mechanism one-directionally for a single gate type; css-s2 completes bidirectionality; css-s4 extends coverage to the full gate/stage vocabulary and adds the reconciliation safety net for the cases that don't propagate synchronously |
| Conflict-resolution correctness (no silent overwrites) | N/A — no mechanism exists | 100% of detected conflicts resolved to pipeline-state.json's value and logged | css-s3 implements conflict detection, canonical resolution, and mandatory logging |

## Stories in This Epic

- [ ] css-s1 — Automatically reflect a CLI-side gate advance on the corresponding web-UI journey, for one gate type
- [ ] css-s2 — Automatically reflect a web-UI journey stage completion in pipeline-state.json, using the authenticated user's own token
- [ ] css-s3 — Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it
- [ ] css-s4 — Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This epic writes to two systems of record automatically (a git-committed audit file and a database), on behalf of the operator, without them clicking a manual sync action each time. That warrants a human review at PR for each story, but does not require full manual implementation — the mechanism reuses established, already-reviewed patterns (`mtrr-s1`'s `ownerRepoForFeature`, `das-s1`'s Contents-API commit pattern), which lowers risk relative to genuinely new infrastructure.

## Complexity Rating

**Rating:** 3

<!-- High ambiguity: this is a new cross-surface integration with real technical unknowns going in — the ADR-020 in-request-retry design (resolved directionally at /definition, but not yet implementation-proven), the slug-correlation edge cases, and the conflict-detection logic all need proof before the full vocabulary is covered. -->

## Scope Stability

**Stability:** Unstable

<!-- This epic is explicitly sequenced after das-s1/das-s2 merge (currently blocked on the GitHub Actions platform outage) — the connected-repo requirement and dual-write commit pattern this epic extends are not yet shipped. Implementation should not begin until that dependency clears. -->
