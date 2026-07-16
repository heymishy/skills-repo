# Discovery: Product Rollup & Aggregation Layer — Product-Level Health from Feature-Level Artefacts

**Status:** Draft — awaiting approval
**Created:** 2026-07-16
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent)

---

## Problem Statement

The framework's source of truth stops at the feature-slug boundary. Each `artefacts/[feature-slug]/` folder is internally governed — DoR/DoD gates, hash-verified SKILL.md instruction execution, structured trace logs — but nothing above that boundary exists as a durable, versioned artefact. With 49 features currently tracked in `pipeline-state.json`, there is no way to answer, without manually reading and mentally aggregating dozens of individual feature entries: What is our aggregate discovery scope across the whole product? How do features group into epics or a broader taxonomy? What is our aggregate test coverage and DoD completion rate?

Two informal mechanisms exist today but neither closes this gap. Within this repo, `dashboards/pipeline-viz.html`'s `renderSummary(features)` function already computes a live summary bar across every feature on every page load (feature counts by health/stage, story counts, release-ready counts) — but it is recomputed client-side at render time, is not versioned, is not hash-verified, has no staleness tracking, and omits aggregate test-coverage and DoD-status-specific rollups entirely. Across repos, `scripts/fleet-aggregator.js` plus the fleet registry (`fleet/squads/*.json`) already aggregates pipeline-state stage/health across multiple repositories, writing `fleet-state.json` — a genuinely different axis (org-wide fleet health across teams/repos) rather than a within-one-repo, cross-feature product rollup, but the closest existing precedent for the remote-fetch mechanism this discovery needs (see MVP Scope).

An operator or stakeholder wanting a governed, evidence-backed product-level health view has no artefact to point to today — only a live dashboard snapshot with no audit trail.

## Who It Affects

- **The Founder/Operator (Hamish King), acting as both delivery lead and business stakeholder:** currently has to open the dashboard and mentally aggregate across 49 (and growing) individual feature cards to answer "how healthy is the product overall," with no persisted record of that aggregate view at any point in time.
- **A non-engineering stakeholder or regulated-enterprise auditor reviewing the platform's own delivery evidence (the audience ADR-003's hash-verification exists to serve):** needs a product-level rollup that is itself derived and hash-verified — the same evidentiary standard the platform already applies at feature level — not a hand-maintained dashboard or a live-only browser computation with no artefact trail.
- **A future multi-squad or multi-product consumer of this framework:** as the fleet registry already anticipates cross-repo aggregation, a within-repo product rollup is the natural companion layer squads will expect once they have more than a handful of features.

## Why Now

The trigger is accumulated scale, not a single event: `pipeline-state.json` now tracks 49 features, several using the epic-nested `epics[].stories[]` structure, spanning a single session's own work this week (2026-07-15/16) that touched 5 short-track stories across 2 separate feature slugs plus a larger epic (`2026-07-09-beta-readiness-infra`). The existing informal aggregation (the dashboard's live summary bar) has not scaled with this — it shows counts, not a governed rollup with DoD/test-coverage detail, taxonomy grouping, or freshness signalling. The operator explicitly identified this gap as worth closing now, ahead of the framework growing to a scale where the absence of a product-level view becomes a harder problem to retrofit.

## MVP Scope

1. **"Product" is the existing `products` table row — not a new primitive.** Per the operator's 2026-07-16 decision, this MVP unifies with the existing SaaS domain object (`src/web-ui/server.js`'s Postgres `products` table, with GitHub repo association columns `repo_provider`/`repo_owner`/`repo_name` added by `prc-s1.1`, and a standards-hierarchy set of columns — `mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails` — added by `psh-s3`, mirroring this platform's own `product/*.md` files) rather than introducing a competing entity. A product row's existing repo-association columns are the reference to "which repo's `pipeline-state.json` this product rolls up" — no new manifest schema is needed for that part. What IS new: minimal additional product-level metadata for rollup purposes (optional epic/taxonomy grouping definitions) as new columns or a linked table, and the rollup mechanism itself (item 2). This was initially considered a possible naming collision with the existing `products` table; on review, unifying the two is the intended design — a tenant's "product" already *is* a repo, and if that repo runs this pipeline, its own `pipeline-state.json` is the natural rollup target for that same entity.
2. **skills-framework registers itself as a product in its own `products` table** for the self-referential dogfooding case — a new consideration surfaced by the unification decision above. This platform repo needs its own product row (with `repo_owner`/`repo_name` pointing at itself) for `/product-sync` to have a consistent single code path for both "a tenant's connected repo" and "this platform's own repo."
3. **A new skill, provisionally `/product-sync`**, that (a) resolves a product row's connected repo, (b) fetches that repo's `pipeline-state.json` — for a remote tenant repo this needs a fetch mechanism equivalent to `scripts/fleet-aggregator.js`'s existing `fetchPipelineState(url)`, generalized from "one entry per registered squad" to "one entry per product row's connected repo"; for the self-referential case (item 2), this is simply a local file read — and (c) regenerates a computed rollup view from each referenced feature's stage, health, dorStatus, dodStatus, `testPlan.{totalTests,passing}`, acTotal, acVerified, and prStatus (the actual fields confirmed present in this repo's own `pipeline-state.json` today, across its 49 tracked features). Never hand-edited, always re-derivable, matching the platform's own ADR-003 evidentiary standard.
4. **Rollup views computed and versioned**, covering at minimum: overall discovery scope across the product's connected repo's features, epic/feature taxonomy grouping (using the product-level metadata's grouping definitions, if provided), aggregate test coverage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features, with per-feature detail available, not just a single blended percentage), and aggregate DoD status (count of features at each stage, with dodStatus breakdown).
5. **Explicit staleness signalling**: the rollup artefact records the pipeline-state `updatedAt` (or trace/commit reference) of each referenced feature at the time `/product-sync` last ran. If a referenced feature's state has changed since that recorded value, the rollup is stale and must say so visibly — not silently serve outdated data. Note that trace files (`workspace/traces/*.jsonl`) are not directly keyed by feature slug — they are per-CI-run records identified by timestamp/trigger/hash, correlated to a feature only via matching `prRef`/`commitSha` — so `/product-sync` reading "each referenced feature's trace files" is not a trivial 1:1 join; staleness detection should key off `pipeline-state.json`'s own `updatedAt` field rather than attempting a trace-file join in the MVP.
6. **`/product-sync`'s trigger mechanism is decided explicitly in this discovery**, not inherited from an assumed shared pattern. Checking each candidate precedent directly: `/trace` triggers on PR open (CI-driven, the closest existing example of "fires on feature state change"); the improvement-agent (`/improve`) runs on a weekly cron plus push-to-master plus manual dispatch — not a pure state-change trigger; `/definition-of-done` has no dedicated auto-invoking workflow at all — it is precondition-gated and operator- or agent-invoked once its preconditions are satisfied. There is no single existing "post-merge" trigger pattern to mirror. Given `/trace`'s CI-on-PR-open trigger is the closest precedent, and given the trace-correlation gap noted in item 5, the recommended MVP mechanism is: `/product-sync` runs on-demand (mirroring `/definition-of-done`'s own precondition-gated precedent) plus opportunistically whenever a referenced feature reaches a DoD-relevant stage transition during an active session — with automatic CI-triggered sync deferred as a V1+ enhancement.

## Out of Scope

- **The legacy ingestion pipeline** (`/reverse-engineer` → `/modernisation-decompose` → feature-candidate → `/discovery`) — a separate discovery, run second per the operator's own explicit sequencing, with its own consumer needs (see that discovery's own Scope section for the one cross-reference point: whether feature-candidate provenance becomes a rollup field here).
- **Web UI / visual design of the dashboard** — this discovery scopes the data model and sync mechanism (`/product-sync`); presentation is a follow-on `/definition`/`/ideate` pass. `pipeline-viz.html` already exists as a rendering surface and is the most likely landing place for these views, but that integration work is explicitly deferred. The existing `products` table's own UI (`/products/new` et al.) is the more likely eventual landing place for a per-product rollup view specifically, but that integration is equally deferred.
- **Cross-product comparison** (aggregating across multiple product rows) — single-product rollup only for MVP. The fleet registry already covers a genuinely different cross-repo aggregation need (squad-level, not product-level), so multi-product comparison is deferred as an unlikely-to-be-needed V2+ concern, not merely an MVP cut.
- **Repo access/authentication for fetching a tenant's connected repo's `pipeline-state.json`** — `fleet-aggregator.js`'s existing squad-registration model (each squad's own `pipelineStateUrl`) assumes a publicly-reachable or pre-authorized URL; a tenant's private repo introduces a real credential/access question this discovery does not resolve. Flagged as a new open risk below, not silently assumed solvable.

## Assumptions and Risks

**Resolved (2026-07-16):** whether "Product" should be a new primitive or unified with the existing `products` table — the operator confirmed unification, with skills-framework registering itself as a product for the self-referential case (MVP scope items 1-2). No longer an open assumption.

[ASSUMPTION] Fetching a tenant's private repo's `pipeline-state.json` for a remote product rollup has a working credential/access mechanism — unconfirmed, requires /clarify before scope is locked. `fleet-aggregator.js`'s existing model assumes each squad's `pipelineStateUrl` is reachable without per-request tenant credentials; most tenant repos on this SaaS platform are private, so the rollup mechanism needs either a stored per-product access token (a new credential-handling surface, per `product/constraints.md` #12's "credentials are structural" standard) or a different fetch approach (e.g. the product's own connected GitHub App installation, if one already exists from the repo-connection flow). This is a materially different mechanism than local-file-read for the self-referential case and needs its own design pass.

[ASSUMPTION] `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design, given no existing CI workflow currently auto-invokes `/definition-of-done` either (the closest post-merge precedent) — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is fully automatic CI-triggered sync from day one, the trace-file-to-feature-slug correlation gap (MVP scope item 5) becomes an MVP blocker rather than a deferred V1+ item.

[ASSUMPTION] Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages — unconfirmed, requires /clarify before scope is locked. These two methods produce materially different numbers when features have very different total test counts (e.g. a 200-test feature at 90% and a 5-test feature at 100% blend very differently than a simple average would suggest), and the choice affects what the rollup number actually communicates.

**Risk:** If the product row's rollup metadata and `/product-sync`'s output are not both hash-verified in the same way feature-level artefacts already are, this reopens exactly the traceability gap ADR-003 exists to close — a rollup that looks authoritative but isn't independently auditable would be worse than no rollup at all for a regulated-enterprise audience, since it would appear to carry the same evidentiary weight as the rest of the platform without actually having it.

**Risk:** With 49 features and growing, if `/product-sync` re-reads and re-computes from full `pipeline-state.json` on every invocation without any incremental/scoped-read mechanism, sync cost will grow linearly with total feature count regardless of how many features a given product's connected repo actually has — worth a performance note at `/definition` time, not necessarily an MVP blocker given today's scale.

## Directional Success Indicators

**Product-level rollup exists as a real, re-derivable artefact.** Baseline: `[UNKNOWN BASELINE]` — no product-level rollup artefact exists today; the only comparable signal is the live, unpersisted dashboard summary bar, which cannot serve as a numeric baseline since it has never been captured as a point-in-time record. Target: a versioned rollup artefact exists and is demonstrably re-derivable (running `/product-sync` twice with no intervening feature changes produces byte-identical output). Measured via: manual verification at first `/product-sync` run, matching this platform's existing convention of proving re-derivability for other primitives (e.g. the SKILL.md hash-verification proof pattern).

**Staleness is visible, not silent, when a referenced feature changes after the last sync.** Baseline: 0% — no existing mechanism detects or surfaces rollup staleness today, since no rollup exists. Target: 100% of referenced-feature state changes post-sync are detected and surfaced as a visible staleness flag on the next rollup view render. Measured via: a scripted test that advances a referenced feature's `pipeline-state.json` entry after a `/product-sync` run and confirms the rollup view flags itself stale.

**Operator time-to-answer for "what's our aggregate DoD/test-coverage status" drops from manual aggregation to a single artefact read.** Baseline: `[UNKNOWN BASELINE]` — no existing instrumentation measures how long a manual cross-feature aggregation currently takes; this would need to be sampled from a real session (e.g. timing how long this session's own end-of-session outer-loop review took to manually establish "5 short-track stories, all now at DoD" across 2+ separate feature folders) rather than estimated here. Establishing this baseline is itself a candidate `/benefit-metric` measurement task, not a number to fabricate at discovery time.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — explicitly named in the originating brief as the non-negotiable reason the Product manifest must be derived, not hand-authored. Confirmed as a real, existing repo-wide standard (`product/constraints.md` #5: "Every SKILL.md file, POLICY.md file, and composed standards document delivered to an agent must be versioned and produce a deterministic hash"). The Product rollup artefact should follow the same evidentiary pattern.
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — directly relevant: "Can the CI gate verify this independently of what the agent says?" applies to `/product-sync`'s own re-derivability claim; the staleness-detection mechanism should be a structural check (comparing recorded vs. current feature `updatedAt` values), not an instruction asking the agent to remember to flag staleness.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — applies to `/product-sync`'s own future implementation as a conversational skill, consistent with `/discovery`'s own protocol.
- **The canonical primitives list is currently seven** (`docs/concepts/README.md`): Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter. "Context graph" is not yet an approved primitive — `artefacts/2026-07-13-context-graph-primitive/discovery.md` remains at `Status: Clarified — awaiting approval` with an empty `Approved by` field. The Product primitive this discovery scopes would be the eighth addition to that list of seven, not a peer of a not-yet-real sixth or a "post-merge/platform-governance" grouping — `dashboards/pipeline-viz.html`'s actual `OUTER_LOOP_STAGE_ORDER` treats `definition-of-done` and `trace` as the last two stages of one single outer-loop sequence, with no distinct post-merge lane in the diagram source.
- **`context.yml`'s `meta.regulated` is `false`** for this repo currently — no compliance-framework-specific constraint applies to this discovery's scope. Confirmed directly, not assumed.
- **No fabricated budget/timeline constraint** — none was stated by the operator, and none is invented here.

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement (the naming question is resolved — see Assumptions and Risks). Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- Fetching a tenant's private repo's `pipeline-state.json` for a remote product rollup has a working credential/access mechanism (a stored per-product token, or reuse of an existing GitHub App installation from the repo-connection flow).
- `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design, given no existing CI workflow currently auto-invokes `/definition-of-done` either.
- Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification. The credential/access assumption should be resolved first — it determines whether the remote-repo rollup case is buildable at all in this MVP, or needs its own separate access-model story first.

## Contributors

- Hamish King — Founder/Operator
- Claude (agent) — Discovery drafting, repo-state grounding investigation

## Reviewers

- [Pending]

## Approved By

[Pending]

---

**Next step:** Human review and approval → /benefit-metric

<!-- Feature slug: 2026-07-16-product-rollup (proposed — confirm or rename) -->
