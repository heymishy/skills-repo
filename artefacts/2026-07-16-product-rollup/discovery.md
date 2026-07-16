# Discovery: Product Rollup & Aggregation Layer — Product-Level Health from Feature-Level Artefacts

**Status:** Draft — awaiting approval
**Created:** 2026-07-16
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent)

---

## Repo-state grounding (read this first — several assumptions in the originating prompt do not match current repo state)

Per the operator's explicit instruction to ground this discovery in actual repo state before drafting, the following was directly investigated. Several findings contradict the originating prompt's framing and are flagged here rather than silently reconciled.

**1. The primitives list does not match what the prompt assumed.** The canonical, current list (`docs/concepts/README.md`) is seven primitives: Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter. The prompt's framing named six — "Skill, Surface adapter, Pipeline state, Eval suite, Learnings log, Context graph" — omitting Assurance gate and Model evaluation entirely, and including Context graph as if it were already an established peer primitive. **Context graph is not yet an approved primitive.** It exists only as `artefacts/2026-07-13-context-graph-primitive/discovery.md`, with `Status: Clarified — awaiting approval` and an empty `Approved by` field — itself still at the discovery stage, unapproved, as of this writing. The new Product primitive this discovery scopes would be the eighth primitive added to an established list of seven — not a peer of a not-yet-real sixth.

**2. The pipeline diagram has no "post-merge" or "platform-governance" lane, and DoD/trace are classified as outer-loop stages, not a separate group.** `dashboards/pipeline-viz.html`'s actual stage ordering:
- `OUTER_LOOP_STAGE_ORDER`: ideation → discovery → benefit-metric → definition → spike → review → test-plan → definition-of-ready → **definition-of-done → trace** → release-pending → released
- `INNER_LOOP_STAGE_ORDER`: branch-setup → implementation-plan → subagent-execution → implementation-review → verify-completion → branch-complete

There is no "post-merge" or "platform-governance" grouping as a named lane anywhere in the diagram source. DoD and trace are simply the last two stages of the single outer-loop sequence. This matters for where `/product-sync` slots into the diagram (see Scope section below) — the prompt's framing of a distinct "post-merge/platform-governance skill group" does not correspond to an existing structure to slot alongside.

**3. `/trace`, `/improve`, and `/definition-of-done` do not share one trigger pattern — this is the most significant contradiction found.** The prompt's core design decision assumes `/product-sync` should use "the same trigger pattern as the existing DoD/trace/improve group (fires on feature state change, not on a schedule or manual edit)." Investigating each individually:
- `/trace` (`skills/trace/SKILL.md`): triggers include `"on PR open (CI trigger)"` — genuinely event-driven, closest to "fires on feature state change."
- `/improve` (the improvement-agent, `.github/workflows/improvement-agent-schedule.yml`): triggers are `schedule: cron: '0 3 * * 1'` (weekly, Monday 03:00 UTC) **plus** `push: branches: [master]` **plus** `workflow_dispatch` (manual). This is a scheduled+push+manual trigger, not a pure state-change trigger.
- `/definition-of-done` (`skills/definition-of-done/SKILL.md`): its entry condition is a precondition check ("PR is merged... DoD artefact exists"), not itself a CI-triggered event. No dedicated GitHub Actions workflow was found that automatically invokes `/definition-of-done` — it appears to be operator- or agent-invoked once its preconditions are satisfied, the same way this session's own retroactive DoD work was performed manually.

There is no single "DoD/trace/improve" trigger pattern to mirror. `/product-sync`'s actual trigger mechanism is an open design decision this discovery needs to make explicitly, not inherit from a precedent that does not exist as described.

**4. Informal cross-feature aggregation already exists, at two different levels — neither is the rollup this discovery scopes, but both are directly relevant prior art.**
- **Within-repo, ephemeral:** `dashboards/pipeline-viz.html`'s `renderSummary(features)` function already computes a live summary bar across every feature in `pipeline-state.json` on every page load — total feature count, blocked/at-risk/moving/needs-human/processing counts, total story count, release-ready count. This is real, but computed client-side at render time, not persisted as a versioned artefact, has no staleness tracking, includes no aggregate test-coverage percentage or DoD-status-specific rollup, and has no epic/taxonomy grouping view.
- **Cross-repo, org-wide:** `scripts/fleet-aggregator.js` + the fleet registry (`fleet/squads/*.json`) already aggregates pipeline-state stage/health **across multiple repositories** (each squad's own `pipelineStateUrl`), writing `fleet-state.json`. This is a genuinely different axis — org-wide fleet health across teams/repos, using each squad's own feature-level state as a single point — not a within-one-repo, cross-feature product rollup. The new Product primitive should be positioned as complementary to this (a single repo's internal rollup), not a duplicate or a replacement.

Neither existing mechanism computes aggregate test coverage %, persists a versioned/hash-verified rollup artefact, or provides an epic/feature taxonomy view — so this discovery's scope is genuinely additive, but must explicitly reference both existing mechanisms rather than presenting the gap as if nothing exists today.

**5. Resolved (2026-07-16, operator decision): "Product" is deliberately the same entity as this repo's existing SaaS `products` table — this is a unification, not a naming collision.** Initial grounding found `src/web-ui/server.js` creating a real Postgres `products` table (`CREATE TABLE IF NOT EXISTS products`), with routes for GitHub repo association (`src/web-ui/modules/product-repo.js`: `repo_provider`, `repo_owner`, `repo_name` columns, added by `prc-s1.1`) and a standards hierarchy (`mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails` columns, added by `psh-s3`) — the exact same fields this platform's own `product/mission.md`/`roadmap.md`/`tech-stack.md`/`constraints.md` hold for itself. This was initially flagged as a likely naming collision; on operator review, it was confirmed as the intended design: a tenant's "product" already *is* a repo, and if that repo runs this pipeline, its own `pipeline-state.json` is the natural rollup target for that same entity — not a second, separately-named thing. **The operator's explicit decision (2026-07-16): both cases are served by one unified mechanism** — a tenant's product rollup (reading the product row's `repo_owner`/`repo_name`, then fetching that repo's `pipeline-state.json`) and this platform repo's own dogfooding rollup (the degenerate case of "a product whose repo happens to be this one") are the same mechanism, not two. This requires skills-framework to register itself as a product in its own `products` table for the self-referential case — a genuine new consideration, not previously anticipated, flagged in MVP scope below. The cross-repo fetch mechanism (grounding finding 4's fleet-aggregator) is the closest existing precedent: `scripts/fleet-aggregator.js` already fetches a remote `pipelineStateUrl` per registered squad — the product-rollup mechanism needs the equivalent capability, scoped to one product's own connected repo rather than a whole fleet registry.

**6. Feature-level pipeline-state.json schema, confirmed directly (49 features currently tracked).** Feature-level fields actually present: `slug`, `name`, `track`, `stage`, `health`, `updatedAt`, `discoveryArtefact`, `benefitMetricArtefact`, `metrics`, `slicingStrategy`, `nfrProfileArtefact`, `guardrails`, `stories` (or `epics[].stories[]` for epic-nested features). Story-level fields actually present: `id`, `slug`, `name`, `stage`, `health`, `reviewStatus`, `highFindings`, `updatedAt`, `epicSlug`, `prStatus`, `prUrl`, `dorStatus`, `dodStatus`, `releaseReady`, plus (confirmed via this session's own direct use) `testPlan.{status,totalTests,passing}`, `acTotal`, `acVerified`. This is the real, current basis for "which fields need rolling up" — grounded, not assumed.

**7. Trace files are not directly keyed by feature slug.** `workspace/traces/*.jsonl` (16 files currently) are per-CI-run records, filenamed by timestamp + trigger + a hash (e.g. `2026-04-11T21-33-02-002Z-ci-84f82370.jsonl`), containing fields like `status`, `trigger`, `prRef`, `commitSha`, `startedAt` — correlating a trace file to a specific feature slug requires matching `prRef`/`commitSha` against that feature's own recorded PR, not a direct lookup. `/product-sync` reading "each referenced feature slug's... trace files" is not a trivial 1:1 join today — this is a real design constraint, not a formality.

**8. Minor: the discovery skill's own template reference is stale.** `skills/discovery/SKILL.md` states the output conforms to `.github/templates/discovery.md`; the real, current path is `templates/discovery.md` (no `.github/` prefix). Noted for completeness; does not affect this discovery's content.

None of the above findings block this discovery from proceeding — the underlying problem (no product-level view above the feature-slug boundary) is real and confirmed. But the MVP scope, trigger design, and primitive naming below are shaped by what was actually found, not by the prompt's original assumptions.

---

## Problem Statement

The framework's source of truth stops at the feature-slug boundary. Each `artefacts/[feature-slug]/` folder is internally governed — DoR/DoD gates, hash-verified SKILL.md instruction execution, structured trace logs — but nothing above that boundary exists as a durable, versioned artefact. With 49 features currently tracked in `pipeline-state.json`, there is no way to answer, without manually reading and mentally aggregating dozens of individual feature entries: What is our aggregate discovery scope across the whole product? How do features group into epics or a broader taxonomy? What is our aggregate test coverage and DoD completion rate? A live, ephemeral summary bar exists in `pipeline-viz.html` (see grounding finding 4), but it is recomputed client-side on every page load, is not versioned, is not hash-verified, and omits test-coverage and DoD-status-specific rollups entirely. An operator or stakeholder wanting a governed, evidence-backed product-level health view has no artefact to point to — only a live dashboard snapshot with no audit trail.

## Who It Affects

- **The Founder/Operator (Hamish King), acting as both delivery lead and business stakeholder:** currently has to open the dashboard and mentally aggregate across 49 (and growing) individual feature cards to answer "how healthy is the product overall," with no persisted record of that aggregate view at any point in time.
- **A non-engineering stakeholder or regulated-enterprise auditor reviewing the platform's own delivery evidence (the audience ADR-003's hash-verification exists to serve):** needs a product-level rollup that is itself derived and hash-verified — the same evidentiary standard the platform already applies at feature level — not a hand-maintained dashboard or a live-only browser computation with no artefact trail.
- **A future multi-squad or multi-product consumer of this framework:** as the fleet registry (grounding finding 4) already anticipates cross-repo aggregation, a within-repo product rollup is the natural companion layer squads will expect once they have more than a handful of features.

## Why Now

The trigger is accumulated scale, not a single event: pipeline-state.json now tracks 49 features, several using the epic-nested `epics[].stories[]` structure, spanning a single session's own work this week (2026-07-15/16) that touched 5 short-track stories across 2 separate feature slugs plus a larger epic (`2026-07-09-beta-readiness-infra`). The existing informal aggregation (the dashboard's live summary bar) has not scaled with this — it shows counts, not a governed rollup with DoD/test-coverage detail, taxonomy grouping, or freshness signalling. The operator explicitly identified this gap as worth closing now, ahead of the framework growing to a scale where the absence of a product-level view becomes a harder problem to retrofit.

## MVP Scope

1. **"Product" is the existing `products` table row — not a new primitive.** Per the operator's 2026-07-16 decision (grounding finding 5), this MVP unifies with the existing SaaS domain object rather than introducing a competing entity. A product row's existing `repo_owner`/`repo_name`/`repo_provider` columns are the reference to "which repo's `pipeline-state.json` this product rolls up" — no new manifest schema is needed for that part. What IS new: minimal additional product-level metadata for rollup purposes (optional epic/taxonomy grouping definitions) as new columns or a linked table, and the rollup mechanism itself (item 2).
2. **skills-framework registers itself as a product in its own `products` table** for the self-referential dogfooding case — a genuinely new consideration surfaced by the unification decision, not previously anticipated. This platform repo needs its own product row (with `repo_owner`/`repo_name` pointing at itself) for `/product-sync` to have a consistent single code path for both "a tenant's connected repo" and "this platform's own repo," per the operator's "both, unified" decision.
3. **A new skill, provisionally `/product-sync`**, that (a) resolves a product row's connected repo, (b) fetches that repo's `pipeline-state.json` — for a remote tenant repo this needs a fetch mechanism equivalent to `scripts/fleet-aggregator.js`'s existing `fetchPipelineState(url)` (grounding finding 4), generalized from "one entry per registered squad" to "one entry per product row's connected repo"; for the self-referential case (item 2), this is simply a local file read — and (c) regenerates a computed rollup view from each referenced feature's stage, health, dorStatus, dodStatus, testPlan.{totalTests,passing}, acTotal, acVerified, prStatus. Never hand-edited, always re-derivable, matching the platform's own ADR-003 evidentiary standard.
4. **Rollup views computed and versioned**, covering at minimum: overall discovery scope across the product's connected repo's features, epic/feature taxonomy grouping (using the product-level metadata's grouping definitions, if provided), aggregate test coverage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features, with per-feature detail available, not just a single blended percentage), and aggregate DoD status (count of features at each stage, with dodStatus breakdown).
5. **Explicit staleness signalling**: the rollup artefact records the pipeline-state `updatedAt` (or trace/commit reference) of each referenced feature at the time `/product-sync` last ran. If a referenced feature's state has changed since that recorded value, the rollup is stale and must say so visibly — not silently serve outdated data.
6. **`/product-sync`'s trigger mechanism is decided explicitly in this discovery** (see grounding finding 3), not inherited from a nonexistent shared pattern: given `/trace`'s CI-on-PR-open trigger is the closest existing precedent for "fires on feature state change," and given the trace-file-to-feature-slug correlation gap (grounding finding 7), the recommended MVP mechanism is: `/product-sync` runs on-demand (manually invoked, mirroring `/definition-of-done`'s own precedent of being precondition-gated rather than CI-triggered) plus opportunistically whenever a referenced feature reaches a DoD-relevant stage transition during an active session — with automatic CI-triggered sync deferred as a V1+ enhancement once the trace-correlation gap (finding 7) is resolved.

## Out of Scope

- **The legacy ingestion pipeline** (`/reverse-engineer` → `/modernise-decompose` → feature-candidate → `/discovery`) — a separate discovery, run second per the operator's own explicit sequencing, with its own consumer needs (see that discovery's own Scope section for the one cross-reference point: whether feature-candidate provenance becomes a rollup field here).
- **Web UI / visual design of the dashboard** — this discovery scopes the data model and sync mechanism (`/product-sync`); presentation is a follow-on `/definition`/`/ideate` pass. Note: `pipeline-viz.html` already exists as a rendering surface and is the most likely landing place for these views, but that integration work is explicitly deferred. The existing `products` table's own UI (`/products/new` et al.) is the more likely eventual landing place for a per-product rollup view specifically, but that integration is equally deferred.
- **Cross-product comparison** (aggregating across multiple product rows) — single-product rollup only for MVP. Given the fleet registry (grounding finding 4) already covers a genuinely different cross-repo aggregation need (squad-level, not product-level), multi-product comparison is deferred as an unlikely-to-be-needed V2+ concern, not merely an MVP cut.
- **Repo access/authentication for fetching a tenant's connected repo's `pipeline-state.json`** — `fleet-aggregator.js`'s existing squad-registration model (each squad's own `pipelineStateUrl`) assumes a publicly-reachable or pre-authorized URL; a tenant's private repo introduces a real credential/access question this discovery does not resolve. Flagged as a new open risk (see Assumptions), not silently assumed solvable.

## Assumptions and Risks

**Resolved (2026-07-16):** whether "Product" should be a new primitive or unified with the existing `products` table — the operator confirmed unification, with skills-framework registering itself as a product for the self-referential case (MVP scope items 1-2). No longer an open assumption.

[ASSUMPTION] Fetching a tenant's private repo's `pipeline-state.json` for a remote product rollup has a working credential/access mechanism — unconfirmed, requires /clarify before scope is locked. `fleet-aggregator.js`'s existing model assumes each squad's `pipelineStateUrl` is reachable without per-request tenant credentials; most tenant repos on this SaaS platform are private, so the rollup mechanism needs either a stored per-product access token (a new credential-handling surface, per `product/constraints.md` #12's "credentials are structural" standard) or a different fetch approach (e.g. the product's own connected GitHub App installation, if one already exists from the repo-connection flow). This is a materially different mechanism than local-file-read for the self-referential case and needs its own design pass.

[ASSUMPTION] `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design, given no existing CI workflow currently auto-invokes `/definition-of-done` either (the closest post-merge precedent) — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is fully automatic CI-triggered sync from day one, the trace-file-to-feature-slug correlation gap (grounding finding 7) becomes an MVP blocker rather than a deferred V1+ item.

[ASSUMPTION] Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages — unconfirmed, requires /clarify before scope is locked. These two methods produce materially different numbers when features have very different total test counts (e.g. a 200-test feature at 90% and a 5-test feature at 100% blend very differently than a simple average would suggest), and the choice affects what the rollup number actually communicates.

**Risk:** If the product row's rollup metadata and `/product-sync`'s output are not both hash-verified in the same way feature-level artefacts already are, this reopens exactly the traceability gap ADR-003 exists to close — a rollup that looks authoritative but isn't independently auditable would be worse than no rollup at all for a regulated-enterprise audience, since it would appear to carry the same evidentiary weight as the rest of the platform without actually having it.

**Risk:** With 49 features and growing, if `/product-sync` re-reads and re-computes from full pipeline-state.json on every invocation without any incremental/scoped-read mechanism, sync cost will grow linearly with total feature count regardless of how many features a given product's connected repo actually has — worth a performance note at `/definition` time, not necessarily an MVP blocker given today's scale.

## Directional Success Indicators

**Product-level rollup exists as a real, re-derivable artefact.** Baseline: `[UNKNOWN BASELINE]` — no product-level rollup artefact exists today; the only comparable signal is the live, unpersisted dashboard summary bar, which cannot serve as a numeric baseline since it has never been captured as a point-in-time record. Target: a versioned rollup artefact exists and is demonstrably re-derivable (running `/product-sync` twice with no intervening feature changes produces byte-identical output). Measured via: manual verification at first `/product-sync` run, matching this platform's existing convention of proving re-derivability for other primitives (e.g. the SKILL.md hash-verification proof pattern).

**Staleness is visible, not silent, when a referenced feature changes after the last sync.** Baseline: 0% — no existing mechanism detects or surfaces rollup staleness today, since no rollup exists. Target: 100% of referenced-feature state changes post-sync are detected and surfaced as a visible staleness flag on the next rollup view render. Measured via: a scripted test that advances a referenced feature's pipeline-state.json entry after a `/product-sync` run and confirms the rollup view flags itself stale.

**Operator time-to-answer for "what's our aggregate DoD/test-coverage status" drops from manual aggregation to a single artefact read.** Baseline: `[UNKNOWN BASELINE]` — no existing instrumentation measures how long a manual cross-feature aggregation currently takes; this would need to be sampled from a real session (e.g. timing how long this session's own end-of-session outer-loop review took to manually establish "5 short-track stories, all now at DoD" across 2+ separate feature folders) rather than estimated here. Establishing this baseline is itself a candidate `/benefit-metric` measurement task, not a number to fabricate at discovery time.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — explicitly named in the originating brief as the non-negotiable reason the Product manifest must be derived, not hand-authored. Confirmed as a real, existing repo-wide standard (`product/constraints.md` #5: "Every SKILL.md file, POLICY.md file, and composed standards document delivered to an agent must be versioned and produce a deterministic hash"). The Product rollup artefact should follow the same evidentiary pattern.
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — directly relevant: "Can the CI gate verify this independently of what the agent says?" applies to `/product-sync`'s own re-derivability claim; the staleness-detection mechanism should be a structural check (comparing recorded vs. current feature `updatedAt` values), not an instruction asking the agent to remember to flag staleness.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — applies to `/product-sync`'s own future implementation as a conversational skill, consistent with `/discovery`'s own protocol.
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
