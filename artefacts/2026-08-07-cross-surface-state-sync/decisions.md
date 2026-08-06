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
