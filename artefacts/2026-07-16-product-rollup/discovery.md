# Discovery: Product Rollup & Aggregation Layer — Product-Level Health from Feature-Level Artefacts

**Status:** Approved
**Created:** 2026-07-16
**Approved by:** Hamish King — Founder/Operator — 2026-07-17
**Author:** Claude (agent)

---

## Problem Statement

The framework's source of truth stops at the feature-slug boundary. Each `artefacts/[feature-slug]/` folder is internally governed — DoR/DoD gates, hash-verified SKILL.md instruction execution, structured trace logs — but nothing above that boundary exists as a durable, versioned view. When the operator runs `/discovery`, `/definition`, or any other outer-loop skill for a new feature, that run has no concept of the product it's actually extending: no awareness of the product's current shape, its existing functional surface, or how the new feature changes that shape. Each feature is planned and delivered as if it were the only thing that exists, not as an addition to a cohesive, evolving whole.

The web UI already has real product infrastructure to build on: `/products` lists a tenant's products, and `/products/:id` (`src/web-ui/routes/products.js`, `_renderProductView`) shows a product's connected features with a `featureCount` and a link to `/products/:id/kanban`. But this is a bare list, not a shape — it shows how many features exist, not what the product currently does, what state it's in in aggregate (DoD completion, test coverage, discovery scope), or how those features group into a coherent functional or architectural taxonomy. An operator adding a new feature today has no view, in the product they're actually adding to, of what already exists — and no way to see, after adding it, how the product's overall shape has changed.

## Who It Affects

- **The Founder/Operator (Hamish King), acting as both delivery lead and product owner:** currently has no way, when starting a new feature or reviewing the product overall, to see what the product's current shape actually is — its existing functional surface, its aggregate delivery health, or how a new feature changes that shape. Today this requires manually reading and mentally aggregating across however many features `/products/:id` lists.
- **A non-engineering stakeholder or regulated-enterprise auditor reviewing the platform's own delivery evidence (the audience ADR-003's hash-verification exists to serve):** needs a product-level rollup that is itself derived and hash-verified — the same evidentiary standard the platform already applies at feature level — visible in the actual product UI, not a hand-aggregated summary.
- **A future tenant of the SaaS platform with more than a handful of features under one product:** the same "list of features with no shape" gap exists for every tenant using `/products/:id` today, not just this platform's own dogfooding case — closing this gap benefits any product on the platform, not only skills-framework's own self-referential use.

## Why Now

The trigger is the imminent beta launch. As the platform moves from building individual features toward a real beta launch, the operator needs to reason about and present the product as a cohesive whole — what it does, its current health, its shape — not as a disparate list of feature slugs. A product that cannot show its own shape is not launch-ready in the way a product that can is. The second, compounding driver is the operator's explicit intent to dogfood the SaaS platform using its own development: skills-framework itself becomes a product of the platform it builds, and it needs the same product-shape view every other tenant would get — this is also the fastest way to validate the mechanism works, since the operator can see it against real, familiar data before any other tenant relies on it.

## MVP Scope

1. **"Product" is designated as a named primitive, with no new code required.** The `products` table, its web UI (`/products`, `/products/:id`, `/products/:id/kanban`), and its repo-association columns (`repo_provider`/`repo_owner`/`repo_name`, added by `prc-s1.1`) and standards-hierarchy columns (`mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails`, added by `psh-s3`) already exist and are already in production use. This MVP formally adds "Product" to the canonical primitives list (`docs/concepts/README.md`, currently seven: Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter) as a documentation/governance change, recognising what already exists in code rather than building something net-new.
2. **skills-framework registers itself as a product in its own `products` table**, for the dogfooding case named in Why Now. This platform repo gets its own product row (with `repo_owner`/`repo_name` pointing at itself), giving the rollup mechanism one consistent code path for both "this platform's own repo" and, later, "a tenant's connected repo."
3. **A new skill, provisionally `/product-sync`**, regenerates a computed rollup view from a product's connected repo's `pipeline-state.json`: each feature's stage, health, dorStatus, dodStatus, `testPlan.{totalTests,passing}`, acTotal, acVerified, and prStatus — the fields already present in this repo's own `pipeline-state.json` today. For this MVP the mechanism reads the connected repo's `pipeline-state.json` directly — for the self-referential case (item 2) that's a local file read of this same repo. Multi-repo product support, where the connected repo isn't locally readable, is a materially different, later problem (see Out of Scope).
4. **Rollup views computed, versioned, and rendered in the web UI**, extending the existing `/products/:id` page. Views cover at minimum: overall discovery scope across the product's features, epic/feature taxonomy grouping, aggregate test coverage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features, with per-feature detail available, not just a single blended percentage), and aggregate DoD status (count of features at each stage, with dodStatus breakdown). Any new UI construction for this view uses the `/frontend-design` skill, consistent with how UI work elsewhere in this platform is built.
5. **Explicit staleness signalling**: the rollup view records each referenced feature's pipeline-state `updatedAt` at the time `/product-sync` last ran. If a referenced feature's state has changed since that recorded value, the rollup is stale and says so visibly in the UI — it never silently serves outdated data.
6. **`/product-sync` runs on-demand**, plus opportunistically whenever a referenced feature reaches a DoD-relevant stage transition during an active session. Fully automatic CI-triggered sync is deferred as a V1+ enhancement once real usage shows it's needed.

## Out of Scope

- **The legacy ingestion pipeline** (`/reverse-engineer` → `/modernisation-decompose` → feature-candidate → `/discovery`) — a separate discovery, with its own consumer needs (see that discovery's own Scope section for the one cross-reference point: whether feature-candidate provenance becomes a rollup field here).
- **Multi-repo product support** (a product whose connected repo isn't locally readable — e.g. a tenant's separate private repo) — this MVP's `/product-sync` mechanism is scoped to a locally-readable `pipeline-state.json`. Extending to a genuinely remote repo needs its own design pass, most likely built on the existing Postgres schema, deferred until a real multi-repo product exists to design against.
- **Cross-product comparison** (aggregating across multiple product rows) — single-product rollup only for MVP.

## Assumptions and Risks

[ASSUMPTION] A database-backed design (extending the existing Postgres `products`/`journeys` schema) is the right direction for eventual multi-repo product support — not needed for this MVP since no multi-repo product exists yet, but worth stating explicitly so a future design pass has a starting direction.

[ASSUMPTION] `/product-sync`'s on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable design for beta launch — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is fully automatic CI-triggered sync from day one, this becomes an MVP-in-scope item rather than a deferred one.

[ASSUMPTION] Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages — unconfirmed, requires /clarify before scope is locked. These two methods produce materially different numbers when features have very different total test counts, and the choice affects what the rollup number actually communicates.

**Risk:** If the product rollup view's underlying data is not hash-verified in the same way feature-level artefacts already are, this reopens exactly the traceability gap ADR-003 exists to close — a rollup that looks authoritative but isn't independently auditable would be worse than no rollup at all for a regulated-enterprise audience.

**Risk:** Building this against skills-framework's own dogfooded product row first (item 2) is a real validation, but it's a single, unusually large and unusually well-instrumented product. A beta tenant with a much smaller or differently-shaped product may expose rollup-view assumptions (e.g. around taxonomy grouping) that this platform's own dogfooding data doesn't surface.

## Directional Success Indicators

**The operator can see the product's current shape in the web UI before starting a new feature.** Baseline: 0 — `/products/:id` today shows a bare feature list and count, no shape/health rollup. Target: `/products/:id` renders a rollup view (discovery scope, taxonomy grouping, aggregate test coverage, aggregate DoD status) for skills-framework's own dogfooded product row. Measured via: direct review of the rendered page against a real `/product-sync` run.

**Staleness is visible, not silent, when a referenced feature changes after the last sync.** Baseline: 0% — no existing mechanism detects or surfaces rollup staleness today, since no rollup exists. Target: 100% of referenced-feature state changes post-sync are detected and surfaced as a visible staleness flag in the `/products/:id` rollup view. Measured via: a scripted test that advances a referenced feature's `pipeline-state.json` entry after a `/product-sync` run and confirms the rollup view flags itself stale.

**skills-framework's own product page is live before beta launch.** Baseline: 0 — skills-framework has no product row today. Target: skills-framework registers itself as a product (MVP scope item 2) and its own `/products/:id` page shows an accurate, re-derivable rollup of its own features, serving as the first real dogfooding proof ahead of beta. Measured via: direct observation, recorded in this feature's own `decisions.md`.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — the Product rollup view's underlying data must be derived, not hand-authored, following the same evidentiary pattern already required of feature-level artefacts (`product/constraints.md` #5).
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — the staleness-detection mechanism should be a structural check (comparing recorded vs. current feature `updatedAt` values), not an instruction asking the agent to remember to flag staleness.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — applies to `/product-sync`'s own future implementation as a conversational skill.
- **Frontend/UI work must land in the SaaS web UI (`src/web-ui/`)**, extending the existing `/products/:id` page. Use the `/frontend-design` skill for any new UI construction.
- **The canonical primitives list is currently seven** (`docs/concepts/README.md`): Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter. Naming "Product" a primitive (MVP scope item 1) adds an eighth entry, documenting an existing entity rather than introducing a competing one.
- **`context.yml`'s `meta.regulated` is `false`** for this repo currently — no compliance-framework-specific constraint applies to this discovery's scope.
- **No fabricated budget/timeline constraint** — none was stated by the operator beyond the imminent beta launch named in Why Now.

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding further, consider running `/clarify` to resolve:

- `/product-sync`'s recommended on-demand-plus-opportunistic trigger mechanism (MVP scope item 6) is an acceptable interim design for beta launch, or whether fully automatic CI-triggered sync is expected from day one.
- Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages.

Neither assumption blocks `/benefit-metric` — both affect implementation detail rather than the metrics themselves — but both should be resolved before `/definition` locks story scope.

## Contributors

- Hamish King — Founder/Operator
- Claude (agent) — Discovery drafting, repo-state grounding investigation

## Reviewers

- Hamish King — Founder/Operator — solo-operator context, per this repo's W4 solo-operator posture (`.github/architecture-guardrails.md`)

## Approved By

Hamish King — Founder/Operator — 2026-07-17

---

**Next step:** Human review and approval → /benefit-metric

<!-- Feature slug: 2026-07-16-product-rollup (proposed — confirm or rename) -->
