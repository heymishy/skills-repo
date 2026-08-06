# Decision Log: cross-surface-state-sync

**Feature:** Cross-Surface State Sync Between pipeline-state.json and Web-UI Journeys
**Discovery reference:** artefacts/2026-08-07-cross-surface-state-sync/discovery.md
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |

---

## Log entries

---
**2026-08-07 | SCOPE | /discovery**
**Decision:** MVP scope is real, automatic, bidirectional sync — not a read-only drift detector.
**Alternatives considered:** A read-only drift detector as the MVP, measuring how often the two systems actually disagree before committing to a fix.
**Rationale:** Operator explicitly chose to commit to the full mechanism now rather than measure the problem's frequency first. Logged as a real, deliberate choice — the "what could make this not worth building" risk in this discovery's Assumptions section remains honestly unresolved (whether this generalizes beyond solo-operator dogfooding), which a drift detector would have addressed more cheaply.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If, once built, real usage shows this mechanism rarely or never fires (because no one actually works the same feature from both surfaces), reconsider whether the investment was justified — not as a reason to remove it, but as a calibration signal for future architecture-reconsideration discoveries.
---

---
**2026-08-07 | ASSUMPTION | /clarify**
**Decision:** Feature-slug string matching is a sufficient correlation key for the sync mechanism, provided the design always propagates the originating side's slug rather than requiring two independently-chosen slugs to coincidentally match.
**Alternatives considered:** A more robust explicit cross-reference (e.g. storing a `journeyId` field directly on the `pipeline-state.json` feature entry, or a `pipelineStateSlug` field on the journey row) instead of relying on slug-string equality.
**Rationale:** Confirmed via direct code inspection: `journey.js`'s `_slugify()` is a deterministic lowercase-dasherize function, and `das-s1`'s own dual-write already commits artefacts under the journey's own slug (`artefacts/<journey.featureSlug>/...`). The realistic scenario is a feature originating on one surface, with sync creating the corresponding entry on the other using that exact slug — not two independently-typed names needing to coincidentally match.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct code inspection during /clarify)
**Revisit trigger:** If a future scenario emerges where the same conceptual feature is genuinely, independently initiated on both surfaces with different human-chosen names, revisit whether an explicit cross-reference field is needed instead of slug matching.
---

---
**2026-08-07 | ARCH | /clarify**
**Decision:** The web-UI-to-pipeline-state.json sync direction is asynchronous/best-effort with a retry/reconciliation safety net — distinct from `das-s1`'s already-synchronous artefact commit, which stays blocking since it gates real stage completion.
**Alternatives considered:** A fully synchronous bidirectional sync, where the web UI's stage-completion request blocks on both the artefact commit (already required by `das-s1`) and a second commit updating `pipeline-state.json`.
**Rationale:** `das-s1` already adds ~2 seconds of synchronous latency for its own artefact commit. A second synchronous commit for `pipeline-state.json` would roughly double that, and the two files can't easily be combined into one atomic commit via the simple GitHub Contents API (would require the lower-level Git Data API — trees/blobs/commits — a materially more complex mechanism). Cross-surface consistency can tolerate a few seconds of propagation lag without affecting the requesting operator's own action; only the operator's own artefact durability needs to be synchronous.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via direct comparison against `das-s1`'s already-shipped design during /clarify)
**Revisit trigger:** If the async propagation's lag ever causes a real, observed reconciliation failure (e.g. an operator making a decision based on stale `pipeline-state.json` data within that lag window), reconsider whether the sync needs to be synchronous after all, or whether the lag window needs to be bounded more tightly.
---

---
**2026-08-07 | ARCH | /definition (Step 1.5 — architecture constraints scan)**
**Decision:** The web-UI-to-pipeline-state.json async/best-effort sync direction (per the earlier ARCH decision above) is implemented as a bounded in-request retry only — a small, fixed number of retry attempts within the original authenticated request's lifetime, using the live session token already present. No token or credential is stored for later background retry. If retries are exhausted, the gap is logged for css-s4's reconciliation safety net to pick up on a future live request.
**Alternatives considered:** Storing the session token (or a scoped derivative) so a background job could retry later without the original request being open.
**Rationale:** ADR-020 requires the authenticated user's own OAuth token for any GitHub Contents API write to `pipeline-state.json` — a requirement naturally satisfied only within the original request's lifetime. Storing a token for later background use would satisfy the retry mechanism but introduces a new credential-storage/security surface that ADR-020 never anticipated and that conflicts with `product/constraints.md` #12's "credentials are structural, never persisted in the agent's environment" principle. Bounded in-request retry keeps the mechanism within ADR-020's existing compliance boundary.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If in-request retry proves insufficient in practice (a high rate of exhausted retries reaching css-s4's reconciliation log), reconsider a token-storage approach with an explicit new security review, rather than silently degrading the reconciliation safety net's effectiveness.
---

---
**2026-08-07 | DESIGN | /definition (Step 4 — story decomposition, ADR-026 reuse-check)**
**Decision:** css-s2 and css-s3 share one new Postgres entity, `sync_log` (feature_slug, tenant_id, entry_type ['gap'|'conflict'], pipeline_state_value, journey_value, resolved_value, created_at), rather than two separate near-identical tables for reconciliation gaps and conflicts.
**Alternatives considered:** Two separate tables (one for reconciliation gaps, one for conflicts); reusing the existing `journeys.data` JSONB column to append log entries instead of a new table.
**Rationale:** No existing entity (`journeys`, `product_rollups`) covers an append-only audit-log concept — a new entity is genuinely needed, per the ADR-026 reuse-check. A single shared table with an `entry_type` discriminator avoids the anti-pattern this repo's own architecture-guardrails.md warns against (duplicating near-identical structures across files), since both gap and conflict entries record the same shape (feature slug, divergent values, resolution, timestamp).
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via ADR-026 reuse-check prompt during /definition)
**Revisit trigger:** If gap and conflict entries diverge significantly in shape as css-s2/css-s3 are implemented (e.g. conflict entries need fields gap entries never do), reconsider splitting into two tables rather than forcing an awkward shared shape.
---

---
**2026-08-07 | SLICE | /definition (Step 2 — slicing strategy)**
**Decision:** Walking skeleton slicing strategy — css-s1 establishes the thinnest end-to-end path (CLI→web-UI, one gate type), css-s2 completes bidirectionality, css-s3 adds conflict correctness, css-s4 extends to full gate-vocabulary coverage plus the reconciliation safety net. One epic (css-e1), not split across multiple epics, since total story count (4) is well under the ~8-story single-epic threshold.
**Alternatives considered:** Vertical slice (one story per gate/stage type, each fully bidirectional); risk-first (tackle the ADR-020 in-request-retry mechanism first in isolation); user journey (sequence stories by a maintainer's chronological cross-surface workflow).
**Rationale:** This is a new cross-surface integration with real unknowns going in (ADR-020 token-lifetime resolution, slug-correlation edge cases, conflict-detection logic) — walking skeleton proves the mechanism end-to-end for one gate type before committing to full-vocabulary coverage, which is the standard fit for "new architecture/integration needing proof before detail."
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None — slicing strategy is fixed once story decomposition begins per `/definition`'s own convention.
---

---
**2026-08-07 | DESIGN | /review Run 1, finding 1-M1 (css-s1)**
**Decision:** The CLI→web-UI sync direction (css-s1) is synchronous — the journey's `completedStages` field is updated before the CLI `gate-advance` command exits, not as a background or deferred action. This is distinct from the reverse direction (css-s2), which is asynchronous/best-effort by explicit discovery-level decision.
**Alternatives considered:** Making the CLI→web-UI direction asynchronous/best-effort as well, for symmetry with css-s2.
**Rationale:** Discovery's MVP scope explicitly carved out only the web-UI→pipeline-state.json direction as asynchronous, reasoning specifically from ADR-020's live-token requirement — a constraint that does not apply to the CLI→web-UI direction (no GitHub Contents API write, no per-request token lifetime concern). A CLI process is not under the same request-latency pressure a web-UI request is; synchronous execution is simpler, has no correctness downside identified, and matches the "triggered automatically at the phase-boundary moment" language discovery uses for the general case (as opposed to the specific async carve-out named only for the reverse direction).
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via /review Run 1 finding resolution, 2026-08-07)
**Revisit trigger:** If Postgres write latency from within the CLI process becomes a measured, real friction point for operators (per css-s1's own NFR budget, set at `/test-plan`), reconsider making this direction asynchronous too.
---

---
**2026-08-07 | RISK-ACCEPT | /review Run 1, finding 1-M1 (css-s4)**
**Decision:** Accept that css-s4's reconciliation safety net has no eventual-consistency guarantee if no future live, authenticated web-UI request ever touches the same feature again after a css-s2 in-request retry is exhausted — the logged gap persists indefinitely in that scenario.
**Alternatives considered:** A scheduled background reconciliation job that doesn't depend on a future live request (rejected — would require a stored credential or a service-account write, which conflicts with ADR-020 and the earlier resolved Step 1.5 decision against credential storage).
**Rationale:** This is a direct, foreseeable consequence of the "bounded in-request retry only, no stored credentials" decision (Step 1.5, /definition) — a real limitation the operator should knowingly accept, not an oversight. The benefit-metric's own 90% minimum validation signal, measured over the first 4 weeks of real usage, is the mechanism that will surface whether this residual risk is actually costly in practice or merely theoretical.
**Made by:** Hamish King — Platform maintainer / Product owner (confirmed via /review Run 1 finding resolution, 2026-08-07)
**Revisit trigger:** If the benefit-metric's own 4-week measurement (per `benefit-metric.md`'s Metric 1 feedback loop) shows the 90% minimum signal is missed, and reconciliation-log review attributes the shortfall to abandoned-feature gaps specifically (not other causes), reconsider a scheduled reconciliation approach with an explicit new security review for credential handling.
---
