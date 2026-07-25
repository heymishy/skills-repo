# Discovery: Code Shape Diagrams (System Architecture, Program Design, Data Model — outer-loop design + inner-loop as-built, with drift check)

**Status:** Approved
**Created:** 2026-07-25
**Approved by:** Hamish King — Founder/Operator — 2026-07-25
**Author:** Copilot (Claude Sonnet 5), operator-directed

---

## Problem Statement

Today, the outer loop's `/design` and `/definition` stages produce System Architecture and Program Design decisions as prose only — no visual artefact the operator can inspect before implementation starts. That gap doesn't close once implementation begins: `/test-plan` describes test scenarios in prose, and nothing in the inner loop (`/verify-completion`, `/branch-complete`) produces a visual record of what was actually built — its real sequence flow, its real data model — as opposed to what was planned. The `/ideate` canvas already renders structured content blocks (clusters, tables, paragraphs) but has no diagram block type anywhere in the chain.

Underneath this: the operator is currently too hands-off the actual code and data model shape. Decisions about structure get made in prose specs and in agent-authored code, with the operator's real point of contact being a diff at review time — by which point the shape is already locked in. Over time this produces drift (what's actually built quietly diverges from what was designed) and a rising maintenance burden (nobody has an easy, current picture of the real code/data shape to reason about before touching it again). The problem recurs at three points: pre-implementation (catch a wrong architecture/shape before code exists), mid-implementation (does the test plan actually cover the designed flow), and post-implementation (does what got built match what was designed, and does that record stay usable as the codebase keeps changing).

This discovery scopes an MVP covering two of those three points — outer-loop design diagrams and inner-loop as-built diagrams with a drift check — with test-plan visualisation and fully-automated drift detection flagged as a follow-up phase (see Out of Scope).

## Who It Affects

**Developer/engineer (primary)** — this is any operator of the SaaS web version of this framework (i.e. any paying customer running their own instance, not only this repo's own dogfood use), running the outer loop solo, day to day. Encounters the problem at all three touchpoints: reviewing a `/design`/`/definition` output before committing to an approach, checking a `/test-plan` actually covers the designed flow, and later trying to understand what a feature they (or a past agent session) built actually looks like, months on, before touching it again. Cost when unresolved: re-reads prose specs and diffs from scratch each time context is needed, and structural drift goes unnoticed until it causes a bug or blocks a change.

**Second-look reviewer (secondary)** — a broader role than a single title: this could be the same operator wearing a review hat (checking their own agent-produced design before committing to it), a tech lead signing off on Definition of Ready (DoR), or a product manager/business-analyst persona (per `product/mission.md`) checking that the built shape actually matches the intended product design — not authoring the structure, but validating it against fit and readiness. Cost when unresolved: sign-off becomes either a rubber stamp (trusting prose) or a slow, diff-level review that doesn't scale as customers/squads grow, and a product-shape mismatch surfaces late, after implementation, rather than at the design checkpoint where it's cheap to fix.

## Why Now

Two concrete triggers: conversations with prospective users about how they run their own agent harnesses and what they say they need have surfaced this as a real, recurring gap — not a hypothetical. And the SaaS framework beta launch is imminent, which raises the stakes: once real paying operators are running their own instances, "the operator has to trust prose and diffs to know what shape their system is in" becomes a product credibility question, not just an internal workflow annoyance. Better to have at least a first version of the visual touchpoint in place before beta users hit the gap themselves. There is no hard beta-deadline constraint on this specific feature (see Constraints) — it is valuable to build well, not urgent to rush.

This discovery was informed by a research pass on HumanLayer (humanlayer.com) and its public essays — specifically "Why Software Factories Fail" (WSFF), which argues that fully autonomous, unreviewed coding loops measurably degrade codebase quality over time, and that the highest-leverage human review point is System Architecture and Program Design artefacts (sequence diagrams, call-stack trees, file-tree diffs), not the final code diff.

## MVP Scope

The MVP covers two of the three touchpoints: outer-loop design diagrams and inner-loop as-built diagrams with a drift check between them.

1. A diagram content-block type added to the `/ideate` canvas's existing content-block mechanism (mermaid), alongside the existing clusters/tables/paragraphs blocks.
2. `/design` (and/or `/definition`) produces at least one diagram from three named types — System Architecture (sequence/component), Program Design (file-tree/call-stack), and Data Model (entities, relationships, schema) — as this new block type, becoming part of the actual DoR artefact the operator signs off on, not a decorative extra alongside prose. Data model is called out explicitly and is not optional in the MVP: it is the drift risk the operator is most worried about. **Added at `/definition` (scope note, see `decisions.md`):** when the Data Model diagram shows a new entity, the generation step itself surfaces an explicit prompt asking whether an existing entity's shape already covers the new concept (per ADR-026), before the diagram is finalised — catching non-optimal design at design time, not only later at the drift-comparison step (item 4 below).
3. The inner loop (`/verify-completion` and/or `/branch-complete`) produces an as-built version of the same diagram types — including the data model — reflecting what was actually implemented.
4. A drift signal: the operator sees whether the as-built diagrams match the as-designed ones — at minimum a flagged "matches / diverged, here's where" comparison per diagram type, with the data model comparison being the one most worth getting right first, not necessarily a fully automated semantic diff engine for all three. Drift rules are type-specific, not one generic rule for all three: Data Model diverges on any table/column/relationship add-remove-rename, **and specifically flags non-optimal design — a new or duplicate object created where an existing one already served the purpose** (a real, previously-seen failure pattern in this repo's own delivery history); Program Design diverges on call-stack/file-tree structural changes only (renames within a file do not count); System Architecture diverges on new/removed service-to-service calls.
5. Granularity: the default is per-feature (one diagram set per diagram type, refreshed as the feature's stories complete), leaning toward this as the common case. Whether any given diagram type instead needs per-story granularity for a specific feature is left as an explicit judgment call for `/definition` to make and record, not a fixed global rule — this genuinely varies and was not resolved to a single answer during discovery (see Clarification log, Q4).

What must be true for the first person who uses it to find it useful: an operator running one real feature through the pipeline sees System Architecture, Program Design, and Data Model diagrams in canvas before implementation starts, and after merge sees as-built versions of the same in the same view with an explicit match/diverged signal per diagram — without having to read the diff to find out.

## Out of Scope

- **Test-plan visualisation** (touchpoint 2 of the three-touchpoint problem) — deferred to a fast-follow phase after this MVP, not indefinitely out of scope. Flagged for revisit once the diagram content-block mechanism exists and is proven on touchpoints 1 and 3.
- **draw.io / editable diagram authoring** — mermaid only for the MVP; no round-trip XML editing loop. No stated intent to revisit unless mermaid proves genuinely insufficient for a diagram type.
- **Fully automated semantic drift detection** — the drift signal is a flagged comparison the operator interprets, not an AI-adjudicated "this diff is safe/unsafe" verdict. Flagged for revisit in the same follow-up phase as test-plan visualisation, once the flagged-comparison mechanism has real usage evidence to design the automation against.

## Assumptions and Risks

[ASSUMPTION] Mermaid can adequately represent a data model / entity-relationship diagram to the fidelity needed for drift detection — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The `/ideate` canvas's existing content-block mechanism (clusters/tables/paragraphs today) can be extended with a new diagram block type without requiring a rewrite of that mechanism — unconfirmed, requires /clarify before scope is locked.

**Resolved during this discovery (not an open assumption):** rendering mermaid client-side in the `/ideate` canvas would ordinarily be evaluated against `product/tech-stack.md`'s Web UI constraint — "Zero new npm dependencies... zero Express dependency." The operator has explicitly relaxed this constraint for this feature: a new dependency (e.g. a mermaid rendering library) is permitted here. This is an architectural decision and must be recorded in this feature's `decisions.md` at `/definition` time, per `CLAUDE.md`'s rule that any feature making an architectural choice requires a `decisions.md` entry.

**Resolved via /clarify:** an as-built diagram is derived from the real, committed source of truth for each diagram type — for the Data Model specifically, this means parsing the repo's actual committed SQL/migration files (static analysis, no live DB required for the MVP), with live-database introspection flagged as a later confirmation/validation step, not a blocking MVP dependency (see Clarification log, Q1). This is also an architectural decision for `decisions.md` at `/definition` time.

**Risk:** the core risk is that it is too hard to visualise well. Specifically — a data model diagram or a call-stack/file-tree diagram auto-generated from a prose plan or from real code may come out too noisy, too generic, or too disconnected from what actually matters to be worth the operator's attention (the same "slop" failure mode WSFF describes for code, but for diagrams). If the diagrams are not genuinely faster to scan than the prose or the diff they are meant to replace, this does not just fail to help — it adds a maintenance burden (another artefact type to keep current) without paying for itself.

## Directional Success Indicators

**Time for the operator to determine as-built vs as-designed match.** Baseline: [UNKNOWN BASELINE] — currently requires reading the diff, no measurement exists today. Target: operator can determine match/diverged status in under 30 seconds from the canvas view. Measured via: informal timing during the operator's own dogfood use of the first real feature run through this.

## Constraints

No hard time, budget, or team-capability constraint — this is a valuable feature to build well, not one under beta-deadline pressure; it can land after beta as a fast-follow if scope grows.

From `product/constraints.md`, confirmed applicable:

- **Constraint #8 / #10 (design artefacts)** — resolved this session: this feature produces technical/architecture diagrams (System Architecture, Program Design, Data Model), explicitly distinct from the UX/visual design artefacts (wireframes, design tokens) those constraints govern. Not a violation, per operator confirmation.
- **Constraint #13 (structural governance preferred over instructional)** — the drift signal (as-built vs as-designed) should, where feasible, be something a CI gate or script can verify independently, not solely an agent's narrated judgment — consistent with this platform's general preference for structural checks over instruction-only ones.
- **Constraint #14 (context window management)** — diagram generation happens inside existing skill sessions (`/design`, `/definition`, `/verify-completion`); no new phase-boundary checkpoint behaviour implied, but diagram content adds to context size within those sessions and should be considered against the existing 55%/75% checkpoint thresholds.

**Multi-tenant exposure (resolved via /clarify, see Q2):** no cross-tenant risk exists for Data Model diagrams by construction — the pipeline is something an operator runs against their own project, so a diagram is only ever generated from and displayed within the same tenant/session that authored the underlying artefacts; there is no read path where one operator's diagram could surface another operator's schema. The only place a genuine internal-schema exposure concern would exist is this repo's own SaaS backend schema (credits, tenant_plan, team_memberships) if that were ever diagrammed and shown to anyone other than the platform admin — which is outside this feature's scope.

The zero-new-npm-dependency constraint on the Web UI layer (`product/tech-stack.md`) is resolved above (Assumptions and Risks) — the operator has explicitly relaxed it for this feature.

## Contributors

- Hamish King — Founder/Operator
- Anonymous beta prospect — idea contribution

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Founder/Operator — 2026-07-25

---

## Clarification log

[2026-07-25] Clarified via /clarify:
- Q: How does the as-built Data Model diagram get its ground truth?  A: Parse the repo's actual committed SQL/migration files (static analysis); live-DB introspection as a later confirmation step, not a blocking MVP dependency.
- Q: Multi-tenant data exposure in Data Model diagrams — who can see what?  A: No cross-tenant risk by construction — the pipeline is run by an operator against their own project, so a diagram is only ever generated from and shown within the same tenant/session. The only residual concern (this repo's own SaaS backend schema, shown to someone other than the platform admin) is outside this feature's scope.
- Q: What counts as "diverged" for the drift signal?  A: Type-specific rules (not one generic rule for all three diagram types). Data Model specifically flags non-optimal design — a new/duplicate object created where an existing one already served the purpose — not just structural add/remove/rename.
- Q: Per-feature or per-story granularity?  A: Default is per-feature, leaning toward this as the common case; whether a given diagram type needs per-story granularity for a specific feature is an explicit judgment call left to `/definition`, not resolved to a single global rule during discovery.

**Remaining open assumptions (not blocking, carried forward to `/definition`):** mermaid's fidelity for data-model/entity-relationship diagrams, and whether the `/ideate` canvas's content-block mechanism can be extended without a rewrite — both are implementation-feasibility questions better resolved by a quick technical check during `/definition` than by further discovery-level discussion.

---

## /clarify recommendation

~~This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement.~~ **Superseded by the Clarification log above** — 1 of 3 original assumptions (as-built diagram derivation) resolved via `/clarify` (2026-07-25); the 2 remaining are implementation-feasibility questions, not scope blockers, and are carried forward to `/definition` rather than requiring another `/clarify` pass.

---

**Next step:** Human review and approval → /benefit-metric
