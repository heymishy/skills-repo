# Discovery: Product Rollup & Aggregation Layer — Product-Level Health from Feature-Level Artefacts

**Status:** Approved
**Created:** 2026-07-16
**Approved by:** Hamish King — Founder/Operator — 2026-07-17
**Author:** Claude (agent)

---

## Problem Statement

The framework's source of truth stops at the feature-slug boundary. Each `artefacts/[feature-slug]/` folder is internally governed — DoR/DoD gates, hash-verified SKILL.md instruction execution, structured trace logs — but nothing above that boundary exists as a durable, versioned view. When the operator runs `/discovery`, `/definition`, or any other outer-loop skill for a new feature, that run has no concept of the product it's actually extending: no awareness of the product's current shape, its existing functional surface, or how the new feature changes that shape. Each feature is planned and delivered as if it were the only thing that exists, not as an addition to a cohesive, evolving whole.

The web UI already has real product infrastructure to build on. `/products` lists a tenant's products; `/products/:id` (`src/web-ui/routes/products.js`, `_renderProductView`) shows a product's connected features with a `featureCount` and a link to `/products/:id/kanban`. Each product row already carries a single connected repo (`repo_provider`/`repo_owner`/`repo_name`, added by `prc-s1.1`), and the web UI already has a proven, working pattern for reading a file out of that connected repo on a user's behalf: `sign-off.js`'s `handleArtefactRead` calls GitHub's Contents API (`GET /repos/{owner}/{repo}/contents/{path}`) using the authenticated user's own OAuth token (`req.session.accessToken`, never a service account — ADR-020), then base64-decodes the response. What's missing is the aggregation step: nothing reads a product's connected repo's `pipeline-state.json` and turns it into a rollup — a view of the product's shape, health, and coverage — anywhere in the product.

An operator adding a new feature today has no view, in the product they're actually adding to, of what already exists — and no way to see, after adding it, how the product's overall shape has changed.

## Who It Affects

- **The Founder/Operator (Hamish King), acting as both delivery lead and product owner:** currently has no way, when starting a new feature or reviewing the product overall, to see what the product's current shape actually is — its existing functional surface, its aggregate delivery health, or how a new feature changes that shape. Today this requires manually reading and mentally aggregating across however many features `/products/:id` lists.
- **A non-engineering stakeholder reviewing the platform's own delivery evidence:** needs a product-level rollup that is re-derivable from the connected repo's own governed state, not a hand-aggregated summary — visible in the actual product UI.
- **A future tenant of the SaaS platform with more than a handful of features under one product:** the same "list of features with no shape" gap exists for every tenant using `/products/:id` today, not just this platform's own dogfooding case — closing this gap benefits any product on the platform, not only skills-framework's own self-referential use.

## Why Now

The trigger is the imminent beta launch. As the platform moves from building individual features toward a real beta launch, the operator needs to reason about and present the product as a cohesive whole — what it does, its current health, its shape — not as a disparate list of feature slugs. A product that cannot show its own shape is not launch-ready in the way a product that can is. The second, compounding driver is the operator's explicit intent to dogfood the SaaS platform using its own development: skills-framework itself becomes a product of the platform it builds, and it needs the same product-shape view every other tenant would get — this is also the fastest way to validate the mechanism works, since the operator can see it against real, familiar data before any other tenant relies on it.

## MVP Scope

1. **"Product" is designated as a named primitive, with no new code required.** The `products` table, its web UI (`/products`, `/products/:id`, `/products/:id/kanban`), and its repo-association and standards-hierarchy columns already exist and are already in production use. This MVP formally adds "Product" to the canonical primitives list (`docs/concepts/README.md`, currently seven: Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter) as a documentation/governance change, recognising what already exists in code rather than building something net-new.
2. **skills-framework registers itself as a product in its own `products` table**, for the dogfooding case named in Why Now. This platform repo gets its own product row (`repo_owner`/`repo_name` pointing at itself), so the rollup mechanism has one consistent code path for both this platform's own repo and any tenant's connected repo.
3. **A product-rollup sync mechanism, built as ordinary application code in `src/web-ui/` — not a governed SKILL.md skill.** A tenant viewing their own product's rollup is a live SaaS feature serving any authenticated user in a browser, not an agent workflow invoked in a pipeline session, so it follows the same shape as the rest of `src/web-ui/`: a route handler backed by the existing GitHub Contents API pattern (`sign-off.js`'s `handleArtefactRead`), fetching the connected repo's `.github/pipeline-state.json` with the requesting user's own OAuth token. The computed rollup — each feature's stage, health, dorStatus, dodStatus, `testPlan.{totalTests,passing}`, acTotal, acVerified, prStatus — is cached in Postgres against the product's `product_id`, following the same per-product-row caching convention already used by the `standards` table, rather than recomputed on every page load. The self-referential dogfooding case (item 2) uses the exact same Contents API call, pointed at skills-framework's own repo — no special-cased local file read, since the operator's own OAuth token already has access to it, exactly like any other connected repo.
4. **Rollup views computed, cached, and rendered in the web UI**, extending the existing `/products/:id` page. Views cover at minimum: overall discovery scope across the product's features, epic/feature taxonomy grouping, aggregate test coverage (sum of `testPlan.passing` / sum of `testPlan.totalTests` across features, with per-feature detail available, not just a single blended percentage), and aggregate DoD status (count of features at each stage, with dodStatus breakdown). Any new UI construction for this view uses the `/frontend-design` skill, consistent with how UI work elsewhere in this platform is built.
5. **Freshness is shown, not hidden — via a last-synced timestamp and a manual refresh action, not automatic change detection.** The cached rollup records when it was last synced; the UI shows this plainly ("Last synced 2 hours ago") and offers a "Refresh" action that re-fetches from the connected repo on demand. Detecting *whether* the connected repo's `pipeline-state.json` has actually changed since the last sync would need its own GitHub API call (e.g. a commit-history or ETag check) — no cheaper than just re-fetching — so the MVP does not attempt automatic staleness detection; it shows the user how old the cached view is and lets them refresh it.
6. **Sync is triggered on demand** — a tenant loading `/products/:id` sees the cached rollup immediately, with an explicit "Refresh" action to re-fetch. Given GitHub's API rate limit (5,000 requests/hour per authenticated user token, shared with every other GitHub-backed feature in this product — repo-access checks, repo creation, sign-off reads), auto-refreshing on every page load is not viable; a background or scheduled sync is deferred as a V1+ enhancement once real usage patterns are known.

## Out of Scope

- **The legacy ingestion pipeline** (`/reverse-engineer` → `/modernisation-decompose` → feature-candidate → `/discovery`) — a separate discovery, with its own consumer needs (see that discovery's own Scope section for the one cross-reference point: whether feature-candidate provenance becomes a rollup field here).
- **A product spanning more than one connected repo.** The `products` table associates exactly one repo per product row today; aggregating a single product's rollup across multiple repos is a materially different data model question, deferred until a real multi-repo product exists to design against.
- **Automatic or scheduled sync** (background jobs, webhooks, CI-triggered refresh) — MVP is on-demand only (item 6); revisit once real usage shows the manual-refresh UX isn't sufficient.
- **Cross-product comparison** (aggregating across multiple product rows) — single-product rollup only for MVP.

## Assumptions and Risks

[ASSUMPTION] Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages — unconfirmed, requires /clarify before scope is locked. These two methods produce materially different numbers when features have very different total test counts, and the choice affects what the rollup number actually communicates.

[ASSUMPTION] On-demand sync with a manual "Refresh" action (MVP scope items 5–6) is sufficient UX for beta launch — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is that a product's rollup should update automatically as the connected repo changes, background/scheduled sync becomes an MVP-in-scope item rather than a deferred one.

**Risk:** Building this against skills-framework's own dogfooded product row first (item 2) is a real validation, but it's a single, unusually large and unusually well-instrumented product. A beta tenant with a much smaller or differently-shaped product may expose rollup-view assumptions (e.g. around taxonomy grouping) that this platform's own dogfooding data doesn't surface.

**Risk:** GitHub's Contents API returns a single file per call and has no built-in aggregation — computing the rollup means one fetch of `pipeline-state.json` plus whatever in-app computation the rollup view needs. For products with very large `pipeline-state.json` files, this is a single bounded fetch (not per-feature calls), so cost scales with file size, not feature count — worth confirming at `/definition` time rather than assumed negligible.

## Directional Success Indicators

**The operator can see the product's current shape in the web UI before starting a new feature.** Baseline: 0 — `/products/:id` today shows a bare feature list and count, no shape/health rollup. Target: `/products/:id` renders a rollup view (discovery scope, taxonomy grouping, aggregate test coverage, aggregate DoD status) for skills-framework's own dogfooded product row, fetched via the same Contents API pattern `sign-off.js` already uses. Measured via: direct review of the rendered page after triggering a sync.

**Freshness is visible and refreshable, not silently stale.** Baseline: 0% — no rollup and no freshness indicator exist today. Target: 100% of rollup views show a last-synced timestamp and a working "Refresh" action that re-fetches from the connected repo. Measured via: manual verification — trigger a refresh, confirm the timestamp updates and the rollup reflects the connected repo's current state.

**skills-framework's own product page is live before beta launch.** Baseline: 0 — skills-framework has no product row today. Target: skills-framework registers itself as a product (MVP scope item 2) and its own `/products/:id` page shows an accurate rollup of its own features, serving as the first real dogfooding proof ahead of beta. Measured via: direct observation, recorded in this feature's own `decisions.md`.

## Constraints

- **Re-derivability, not literal hash verification, is the evidentiary bar for this rollup.** ADR-003's hash-verification standard governs SKILL.md-driven, agent-produced governance artefacts; this rollup is a live, cached SaaS view computed from a connected repo's own already-governed `pipeline-state.json`, not a new governed artefact in its own right. What matters here is that the same inputs (the connected repo's current `pipeline-state.json`) always produce the same computed rollup — re-derivable, not hand-edited — rather than producing a separately hash-verified file.
- **GitHub Contents API access uses the requesting user's own OAuth token** (`req.session.accessToken`), following `sign-off.js`'s existing pattern and ADR-020 (never a service account). No new credential or access mechanism is needed — any product whose connected repo the authenticated user already has access to can be synced.
- **GitHub API rate limits are shared across every GitHub-backed feature** in the product (repo-access checks, repo creation, sign-off reads, and now rollup sync) — 5,000 requests/hour per authenticated user token. On-demand-only sync (MVP scope item 6) keeps this feature's own consumption bounded.
- **Frontend/UI work must land in the SaaS web UI (`src/web-ui/`)**, extending the existing `/products/:id` page. Use the `/frontend-design` skill for any new UI construction.
- **The canonical primitives list is currently seven** (`docs/concepts/README.md`): Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter. Naming "Product" a primitive (MVP scope item 1) adds an eighth entry, documenting an existing entity rather than introducing a competing one.
- **`context.yml`'s `meta.regulated` is `false`** for this repo currently — no compliance-framework-specific constraint applies to this discovery's scope.
- **No fabricated budget/timeline constraint** — none was stated by the operator beyond the imminent beta launch named in Why Now.

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding further, consider running `/clarify` to resolve:

- Aggregate test coverage should be computed as a sum-of-passing-over-sum-of-total across referenced features (a blended percentage), rather than an average-of-per-feature-percentages.
- On-demand sync with a manual "Refresh" action is sufficient UX for beta launch, or whether automatic/background sync is expected from day one.

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
