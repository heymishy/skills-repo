# Discovery: Product Rollup & Aggregation Layer — Product-Level Health from Feature-Level Artefacts

**Status:** Draft — awaiting approval
**Created:** 2026-07-16
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent)

---

## Problem Statement

The framework's source of truth stops at the feature-slug boundary. Each `artefacts/[feature-slug]/` folder is internally governed — DoR/DoD gates, hash-verified SKILL.md instruction execution, structured trace logs — but nothing above that boundary exists as a durable, versioned view. When the operator runs `/discovery`, `/definition`, or any other outer-loop skill for a new feature, that run has no concept of the product it's actually extending — no awareness of the product's current shape, its existing functional surface, or how the new feature fits into or changes that shape. Each feature is planned and delivered as if it were the only thing that exists, not as an addition to a cohesive, evolving whole.

The web UI already has real product infrastructure to build on: `/products` lists a tenant's products, `/products/:id` (`src/web-ui/routes/products.js`, `_renderProductView`) shows a product's connected features with a `featureCount` and a link to `/products/:id/kanban`. But this is a bare list, not a shape — it shows how many features exist, not what the product currently *does*, what state it's in in aggregate (DoD completion, test coverage, discovery scope), or how those features group into a coherent functional or architectural taxonomy. An operator adding a new feature today has no view, in the product they're actually adding to, of what already exists — and no way to see, after adding it, how the product's overall shape has changed.

**Grounding correction (2026-07-17, operator review):** an earlier draft of this discovery cited two "existing informal aggregation mechanisms" as relevant prior art — `dashboards/pipeline-viz.html`'s client-side summary bar, and `scripts/fleet-aggregator.js`'s cross-repo aggregation. Both were confirmed, on operator review, to be *not* relevant to this problem. `pipeline-viz.html` is a legacy, static, git-native dashboard with zero references anywhere in `src/web-ui/` (confirmed directly — no route, no include, no link) — it has never been part of the SaaS web UI and is not something a real product operator or tenant would ever see. `fleet-aggregator.js` was introduced 2026-04-11, three weeks before the SaaS web UI's own first commit (2026-05-03, `src/web-ui/server.js`) — it is an early, pre-web-UI, git-native concept for aggregating across squads' repos, not a mechanism this product's own users interact with. Neither is real prior art for a SaaS-product-facing rollup; both are noted here only so a future reader doesn't rediscover them and mistake them for active parts of the product.

## Who It Affects

- **The Founder/Operator (Hamish King), acting as both delivery lead and product owner:** currently has no way, when starting a new feature or reviewing the product overall, to see what the product's current shape actually is — its existing functional surface, its aggregate delivery health, or how a new feature changes that shape. Today this requires manually reading and mentally aggregating across however many features `/products/:id` lists.
- **A non-engineering stakeholder or regulated-enterprise auditor reviewing the platform's own delivery evidence (the audience ADR-003's hash-verification exists to serve):** needs a product-level rollup that is itself derived and hash-verified — the same evidentiary standard the platform already applies at feature level — visible in the actual product UI, not a hand-aggregated summary.
- **A future tenant of the SaaS platform with more than a handful of features under one product:** the same "list of features with no shape" gap exists for every tenant using `/products/:id` today, not just this platform's own dogfooding case — closing this gap benefits any product on the platform, not only skills-framework's own self-referential use.

## Why Now

The trigger is the imminent beta launch, not accumulated scale. As the platform moves from building individual features toward a real beta launch, the operator needs to reason about and present the product as a cohesive whole — what it does, its current health, its shape — not as a disparate list of feature slugs. A product that cannot show its own shape is not launch-ready in the way a product that can is. The second, compounding driver is the operator's explicit intent to dogfood the SaaS platform using its own development: skills-framework itself becomes a product of the platform it builds, and it needs the same product-shape view every other tenant would get — this is also the fastest way to validate the mechanism works, since the operator can see it against real, familiar data before any other tenant relies on it.

## MVP Scope

1. **"Product" is designated as a named primitive — without any new code.** The `products` table, its web UI (`/products`, `/products/:id`, `/products/:id/kanban`), and its repo-association columns (`repo_provider`/`repo_owner`/`repo_name`, added by `prc-s1.1`) and standards-hierarchy columns (`mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails`, added by `psh-s3`) already exist and are already in production use. This MVP does not introduce a new entity — it formally adds "Product" to the canonical primitives list (`docs/concepts/README.md`, currently seven: Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter) as a documentation/governance change, recognizing what already exists in code rather than building something net-new.
2. **skills-framework registers itself as a product in its own `products` table** for the self-referential dogfooding case named in Why Now. This platform repo needs its own product row (with `repo_owner`/`repo_name` pointing at itself) so the rollup mechanism has one consistent code path for both "this platform's own repo" and, later, "a tenant's connected repo."
3. **A new skill, provisionally `/product-sync`**, that regenerates a computed rollup view from a product's connected repo's `pipeline-state.json`: each feature's stage, health, dorStatus, dodStatus, `testPlan.{totalTests,passing}`, acTotal, acVerified, and prStatus (the actual fields confirmed present in this repo's own `pipeline-state.json` today). **For this MVP, the mechanism reads the connected repo's `pipeline-state.json` directly** — for the self-referential case (item 2) that is simply a local file read of this same repo. This MVP does not assume or build toward `fleet-aggregator.js`'s remote-fetch model: that script is a pre-web-UI, git-native design (see Problem Statement) that predates this platform having a persistent database layer at all. If and when a real tenant's product spans a separate repo the platform doesn't have local filesystem access to, that is a materially different, database-backed problem — most likely a stored per-product sync record in the same Postgres schema `/products` already uses — and is explicitly deferred (see Out of Scope) rather than assumed solvable by generalizing an outdated script.
4. **Rollup views computed, versioned, and rendered in the web UI** — extending the existing `/products/:id` page (`_renderProductView` in `src/web-ui/routes/products.js`), not `dashboards/pipeline-viz.html`, which is confirmed disconnected from the SaaS web UI entirely (see Problem Statement). Views cover at minimum: overall discovery scope across the product's features, epic/feature taxonomy grouping (using product-level metadata's grouping definitions, if provided), aggregate test coverage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features, with per-feature detail available, not just a single blended percentage), and aggregate DoD status (count of features at each stage, with dodStatus breakdown). **Any new UI construction for this view should use the `/frontend-design` skill**, consistent with how UI work elsewhere in this platform is built.
5. **Explicit staleness signalling**: the rollup view records the pipeline-state `updatedAt` of each referenced feature at the time `/product-sync` last ran. If a referenced feature's state has changed since that recorded value, the rollup is stale and must say so visibly in the UI — not silently serve outdated data.
6. **`/product-sync`'s trigger mechanism**: given this MVP's scope is a local read of the connected repo's own `pipeline-state.json` (item 3), the simplest correct mechanism is on-demand invocation (mirroring `/definition-of-done`'s own precondition-gated precedent — no dedicated CI workflow currently auto-invokes it either) plus opportunistic re-sync whenever a referenced feature reaches a DoD-relevant stage transition during an active session. Fully automatic CI-triggered sync is deferred as a V1+ enhancement once real usage shows it's needed.

## Out of Scope

- **The legacy ingestion pipeline** (`/reverse-engineer` → `/modernisation-decompose` → feature-candidate → `/discovery`) — a separate discovery, run second per the operator's own explicit sequencing, with its own consumer needs (see that discovery's own Scope section for the one cross-reference point: whether feature-candidate provenance becomes a rollup field here).
- **Multi-repo product support** (a product whose connected repo is not locally readable — e.g. a tenant's separate private repo) — this MVP's `/product-sync` mechanism (item 3) is scoped to a locally-readable `pipeline-state.json`. Extending to a genuinely remote repo needs its own design pass, most likely built on the existing Postgres schema rather than `fleet-aggregator.js`'s git-native, pre-web-UI pattern — deferred until a real multi-repo product exists to design against, not assumed solvable now.
- **`dashboards/pipeline-viz.html` integration** — this legacy static dashboard has no connection to the SaaS web UI today and this MVP does not create one; the rollup view lives in `/products/:id` instead (MVP scope item 4).
- **Cross-product comparison** (aggregating across multiple product rows) — single-product rollup only for MVP.

## Assumptions and Risks

**Resolved (2026-07-16):** whether "Product" should be a new primitive or unified with the existing `products` table — the operator confirmed unification, with skills-framework registering itself as a product for the self-referential case (MVP scope items 1-2). No longer an open assumption.

**Resolved (2026-07-17):** whether `pipeline-viz.html` or `fleet-aggregator.js` are relevant existing mechanisms to build on — operator confirmed both are legacy/unused and not part of the live SaaS product; the rollup view instead extends the existing `/products/:id` web UI page, and the sync mechanism is a local read rather than a generalization of `fleet-aggregator.js`'s remote-fetch model. No longer an open question.

[ASSUMPTION] A database-backed design (extending the existing Postgres `products`/`journeys` schema) is the right direction for eventual multi-repo product support, rather than any git-native pattern — unconfirmed, not needed for this MVP since no multi-repo product exists yet, but worth stating explicitly so a future design pass doesn't default back to `fleet-aggregator.js`'s pattern by habit.

[ASSUMPTION] `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design for beta launch — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is fully automatic CI-triggered sync from day one, this becomes an MVP-in-scope item rather than a deferred one.

[ASSUMPTION] Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages — unconfirmed, requires /clarify before scope is locked. These two methods produce materially different numbers when features have very different total test counts (e.g. a 200-test feature at 90% and a 5-test feature at 100% blend very differently than a simple average would suggest), and the choice affects what the rollup number actually communicates.

**Risk:** If the product rollup view's underlying data is not hash-verified in the same way feature-level artefacts already are, this reopens exactly the traceability gap ADR-003 exists to close — a rollup that looks authoritative but isn't independently auditable would be worse than no rollup at all for a regulated-enterprise audience.

**Risk:** Building this against skills-framework's own dogfooded product row first (item 2) is a real validation, but it's a single, unusually large and unusually well-instrumented product (49+ features). A beta tenant with a much smaller or differently-shaped product may expose rollup-view assumptions (e.g. around taxonomy grouping) that this platform's own dogfooding data doesn't surface — worth naming as a limit of what this MVP's own validation proves.

## Directional Success Indicators

**The operator can see the product's current shape in the web UI before starting a new feature.** Baseline: 0 — `/products/:id` today shows a bare feature list and count, no shape/health rollup. Target: `/products/:id` renders a rollup view (discovery scope, taxonomy grouping, aggregate test coverage, aggregate DoD status) for skills-framework's own dogfooded product row. Measured via: direct review of the rendered page against a real `/product-sync` run.

**Staleness is visible, not silent, when a referenced feature changes after the last sync.** Baseline: 0% — no existing mechanism detects or surfaces rollup staleness today, since no rollup exists. Target: 100% of referenced-feature state changes post-sync are detected and surfaced as a visible staleness flag in the `/products/:id` rollup view. Measured via: a scripted test that advances a referenced feature's `pipeline-state.json` entry after a `/product-sync` run and confirms the rollup view flags itself stale.

**skills-framework's own product page is live before beta launch.** Baseline: 0 — skills-framework has no product row today. Target: skills-framework registers itself as a product (MVP scope item 2) and its own `/products/:id` page shows an accurate, re-derivable rollup of its own 49+ tracked features, serving as the first real dogfooding proof ahead of beta. Measured via: direct observation, recorded in this feature's own `decisions.md`.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — the Product rollup view's underlying data must be derived, not hand-authored, following the same evidentiary pattern already required of feature-level artefacts (`product/constraints.md` #5: "Every SKILL.md file, POLICY.md file, and composed standards document delivered to an agent must be versioned and produce a deterministic hash").
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — the staleness-detection mechanism should be a structural check (comparing recorded vs. current feature `updatedAt` values), not an instruction asking the agent to remember to flag staleness.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — applies to `/product-sync`'s own future implementation as a conversational skill.
- **Frontend/UI work must land in the SaaS web UI (`src/web-ui/`), not `dashboards/pipeline-viz.html`.** The rollup view extends the existing `/products/:id` page. `pipeline-viz.html` has zero references anywhere in `src/web-ui/` (confirmed directly) and is not part of the live product. Use the `/frontend-design` skill for any new UI construction.
- **The canonical primitives list is currently seven** (`docs/concepts/README.md`): Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter. "Context graph" is not yet an approved primitive — `artefacts/2026-07-13-context-graph-primitive/discovery.md` remains at `Status: Clarified — awaiting approval` with an empty `Approved by` field. Naming "Product" a primitive (MVP scope item 1) adds an eighth entry to that list, documenting an existing entity, not introducing a competing one.
- **`context.yml`'s `meta.regulated` is `false`** for this repo currently — no compliance-framework-specific constraint applies to this discovery's scope. Confirmed directly, not assumed.
- **No fabricated budget/timeline constraint** — none was stated by the operator beyond the imminent beta launch named in Why Now.

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement (the naming question and the pipeline-viz/fleet-aggregator relevance question are both resolved — see Assumptions and Risks). Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design for beta launch, or whether fully automatic CI-triggered sync is expected from day one.
- Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

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
