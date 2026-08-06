# Discovery: Cross-Surface State Sync Between pipeline-state.json and Web-UI Journeys

**Status:** Approved
**Created:** 2026-08-07
**Approved by:** Hamish King — Platform maintainer / Product owner — 2026-08-07 (approved after /clarify)
**Author:** Copilot (Claude Code)

---

## Problem Statement

`.github/pipeline-state.json` (this CLI harness's stage/gate tracking — discovery through DoD, git-committed, versioned) and a journey's own `completedStages` field (the hosted web UI's own stage tracking, Postgres-backed) are two independently-maintained progress records for what can be the same conceptual feature. They are correlated only by a fragile mechanism: `src/web-ui/modules/product-rollup.js`'s `mergeFeatureSources()` matches journeys to `pipeline-state.json` entries by comparing `featureSlug` strings, feeding a read-only dashboard rollup cache (`product_rollups` table) that is refreshed only on-demand (a manual "Sync" button), one-directionally (`pipeline-state.json` → dashboard view). Nothing flows the other way — a web-UI-driven journey never writes to `pipeline-state.json` at all, confirmed via direct code inspection (no call site was found anywhere in `src/web-ui/` writing to that file or triggering the CLI's own `bin/skills advance`/`gate-advance` mechanism). An operator working the same feature from both surfaces — as happens today for this repo's own dogfooding work — has no guarantee the two ever agree, and no mechanism forces or even detects disagreement.

## Who It Affects

**Hamish King / platform maintainers**, right now the only people straddling both surfaces for this repo's own meta-work (using the CLI harness to run this repo's own outer loop, while the hosted web UI's own journeys track products that may include this repo itself, via `registerSelfAsProduct`'s self-registration). By extension, any future team that delivers some features via this CLI harness and others via the hosted web UI, or the same feature via both at different times, once real external adopters exist.

## Why Now

This tension became concrete rather than theoretical specifically because of this session's own work: `mtrr-s1` and `das-s1` built real git-commit mechanisms so that web-UI-driven journeys now write actual artefact files into a connected repo — meaning a web-UI journey and a CLI-tracked feature can now share the exact same underlying git history for the same feature slug, while their own progress-tracking records remain entirely disconnected. This is also a natural extension of the surface-adapter architecture line already active in this repo (ADR-005, ADR-007, ADR-013), which has so far addressed governance *mechanism* parity across surfaces but never state *storage* reconciliation.

## MVP Scope

Real, automatic, bidirectional sync between a journey's stage/status fields and the corresponding `pipeline-state.json` feature/story entry, correlated by feature slug — **always propagating the originating side's slug** rather than requiring two independently-chosen slugs to coincidentally match (resolved via `/clarify`: the realistic case is a feature originating on one surface, with sync creating/updating the corresponding entry on the other using that exact slug). When either side advances — a CLI-side `bin/skills advance`/`gate-advance` call, or a web-UI journey completing a stage/gate — the other side is updated to match, triggered automatically at the phase-boundary moment. The web-UI-to-pipeline-state.json direction is **asynchronous/best-effort with a retry/reconciliation safety net** (resolved via `/clarify`: `das-s1` already makes stage-completion synchronously commit the artefact itself; a second synchronous commit for `pipeline-state.json` would roughly double that latency, and the operator's own action shouldn't wait on cross-surface propagation) — distinct from the artefact commit, which correctly stays synchronous since it gates real stage completion. On a genuine conflict (both sides advanced differently since the last sync), `pipeline-state.json`'s value is treated as canonical (git-committed, versioned, audit-trailed, matching this platform's own ADR-003 stance on hash-verified state as the trustworthy audit record) and the journey's Postgres record is corrected to match, with the conflict logged rather than silently overwritten.

## Out of Scope

- **Changing the stage/gate vocabulary on either side** — the two systems already use compatible terms; this discovery is about connecting them, not redefining either one.
- **Syncing features that exist on only one side** — nothing to reconcile when there's no corresponding record on the other surface.
- **Retroactively backfilling already-existing historical divergence** — this MVP is forward-looking (new advances going forward), not a migration of past state.

## Assumptions and Risks

All 2 originally-flagged assumptions were resolved via `/clarify` — see Clarification log below. No open `[ASSUMPTION]` lines remain.

**Risk (a real design hazard, not just unconfirmed):** `pipeline-state.json` is only reachable via a connected repo, using `mtrr-s1`'s `ownerRepoForFeature` resolution mechanism. For any product with no connected repo, there is nothing to sync to — this mechanism is inherently scoped to repo-connected products, which is exactly the direction `das-s2`'s "repo required for new products" gate is already pushing toward. This is a real, load-bearing dependency on that other feature's own scope, not a coincidental overlap.

**What could make this not worth building:** if in practice no real team (as opposed to Hamish's own solo dogfooding pattern) ever actually works the same feature from both surfaces, this mechanism may be solving a problem that doesn't generalize to real future customers. This is being built anyway per the explicit choice to commit to full-pipeline treatment rather than validate the drift rate first — worth remaining honest about this risk even though the scope decision has already been made.

## Directional Success Indicators

**Automatic agreement rate.** Baseline: 0% — today, nothing writes back automatically in either direction; the only existing mechanism is a manual, one-directional dashboard sync. Target: 100% of phase-boundary advances on either side are reflected on the other without any manual action. Measured via: an integration test that advances one side and asserts the other reflects it with no operator intervention.

**Conflict-resolution correctness.** Baseline: `[UNKNOWN BASELINE]` — no conflict-resolution mechanism exists today, so there is no current behaviour to compare against. Target: when a genuine conflict is detected, `pipeline-state.json`'s value is written to the journey side and the conflict is logged — never a silent overwrite with no record. Measured via: a test that manufactures a conflict and asserts both the resolution and the log entry.

## Constraints

- **Team capability:** Solo maintainer — the sync mechanism's design should reuse existing read/write paths (`mtrr-s1`'s `ownerRepoForFeature`, the existing GitHub Contents API commit pattern from `das-s1`/`sign-off-writer.js`) rather than inventing new infrastructure.
- **Dependency:** Builds on `das-s1`/`das-s2` (dual-write artefact durability, repo-required gate for new products) as its foundation — this sync mechanism only works for repo-connected products, which `das-s2` is making the norm for new products going forward.
- **Sequencing:** Should not begin implementation until `das-s1`/`das-s2` are merged, since this discovery's own MVP scope explicitly depends on their shipped behaviour (the connected-repo requirement, the dual-write commit pattern to extend).

## Contributors

- Hamish King — Platform maintainer / Product owner

## Reviewers

- Hamish King — Platform maintainer / Product owner

## Approved By

Hamish King — Platform maintainer / Product owner — 2026-08-07 (approved after /clarify)

---

## Clarification log

[2026-08-07] Clarified via /clarify:
- Q: Is feature-slug string matching a sufficient correlation key for the new bidirectional sync? A: Confirmed sufficient, provided the design always propagates the originating side's slug rather than requiring two independently-chosen slugs to coincidentally match. Grounded in `journey.js`'s `_slugify()` (a deterministic lowercase-dasherize function) and `das-s1`'s own dual-write already committing artefacts under the journey's own slug — the realistic case is one surface originating a feature, with sync creating the corresponding entry on the other surface using that exact slug.
- Q: Can automatic sync at phase boundaries avoid adding synchronous GitHub-API latency/failure risk to the web UI's user-facing request path? A: Resolved by making the web-UI-to-pipeline-state.json sync direction asynchronous/best-effort with a retry/reconciliation safety net, distinct from `das-s1`'s already-synchronous artefact commit (which correctly stays blocking since it gates real stage completion). Avoids compounding latency; cross-surface consistency can tolerate a few seconds of propagation lag without affecting the requesting operator's own action.

---

**Next step:** Human review and approval → /benefit-metric
