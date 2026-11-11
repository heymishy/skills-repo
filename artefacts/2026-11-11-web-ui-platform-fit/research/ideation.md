# Ideation Artefact

**Feature:** 2026-11-11-web-ui-platform-fit
**Date:** 2026-11-11
**Artefact path:** `artefacts/2026-11-11-web-ui-platform-fit/research/ideation.md`
**Lenses run:** D, A
**Pipeline state signal:** proceed (D → PROCEED, but narrowly scoped to Cluster 1 — migration bookkeeping — only; see Lens D recommendation. Lens A below splits the "web-ui complexity" problem into four distinct sub-opportunities with different risk/fit profiles; Clusters 2-4 are explicitly NOT included in this proceed signal and remain separate, undecided questions.)

---

## Context loaded

| Artefact | Status at time of ideation |
|----------|--------------------------|
| discovery.md | not yet written — this is a pre-discovery ideation session |
| benefit-metric.md | not yet written |
| Stories | none yet |
| Reference materials | none filed; grounded in (a) Cluster 3 of `artefacts/2026-11-11-framework-scaling-and-architecture-evolution/research/ideation.md` (the prior ideation that explicitly deferred this exact question to its own session), (b) fresh direct reads of `src/web-ui/routes/products.js`, `src/web-ui/server.js`, and `src/modules/skill-turn-executor.js` this session, and (c) `product/tech-stack.md` and `product/constraints.md`, both read directly rather than recalled |

**Directly relevant prior art:** `artefacts/2026-11-11-framework-scaling-and-architecture-evolution` — its Lens A Cluster 3 first flagged this complexity ("35+ individually hand-wired D37 adapters, 20+ per-table migration functions re-run on every boot, products.js sprawling") but explicitly deferred it: *"Real, but not an agent-orchestration problem — explicitly out of scope for any LangGraph/Aegra-shaped solution; would need its own, separate ideation."* That same ideation's two "stand-back" sections (orchestration/instrumentation; web-ui + ephemeral containers) independently confirmed LangGraph/Aegra have no fit anywhere in this system. This session is that promised separate ideation — scoped to a different question: not "does an agent-orchestration framework fit," but "does *any* native/off-the-shelf platform fit better than the current hand-rolled approach."

**Fresh evidence gathered this session (re-verified, not re-cited from memory):**
- `src/web-ui/routes/products.js` is 4,877 lines.
- 158 individually-defined `setX(...)` D37-style adapter-injection functions across `src/web-ui/*.js` files (not merely the 35+ wired at `server.js`'s own top-level boot sequence — the fuller count, across the whole adapters directory, is over 4x that).
- At least 12 distinct `migrate*Schema`/`migrate*Columns` functions, each imported per-feature-module and invoked independently at `server.js` boot via `CREATE TABLE IF NOT EXISTS` (used *as* the idempotency mechanism — there is no migrations-tracking table anywhere), with 33 separate `.catch(...)` blocks logging individual migration failures. This confirms the "re-run and occasionally fail on every boot" pattern precisely, though this session did not re-check live production logs for which migrations are *currently* failing (the prior ideation's "several currently failing" claim is not re-verified here).

**Architectural framing directly relevant to this question (read fresh from `product/tech-stack.md` and `product/constraints.md`, not assumed):**
- `tech-stack.md`'s top-level framing: *"The skills platform is a file-system-native governed instruction delivery system. No proprietary runtime, no hosted service, no vendor dependency in the critical path. Every structural element is a file in a git repository."*
- `tech-stack.md`'s Web UI layer section explicitly calls out: `src/web-ui/server.js — raw Node.js http.createServer(); zero Express dependency` — stated as a deliberate architectural note, not an oversight.
- `constraints.md` #11, "No persistent agent runtime dependency": *"The platform must operate on standard CI/CD infrastructure. It does not require a hosted agent service, persistent message queue, or proprietary orchestration platform."* This is scoped to the platform's *agent/delivery runtime*, not explicitly to the web-ui's own rendering stack — cited here as directly relevant context, not stretched to a literal hard block on a web framework choice. The "zero Express dependency" note above is the more precisely on-point evidence for the web-ui specifically.

This matters for every answer below: **"is there a better-fitted native platform" has a different cost here than the earlier LangGraph question did.** That question was about internal CLI tooling with zero production blast radius. This one is about `skills-framework.fly.dev`, a live product with real tenant data, and a codebase whose minimal-dependency shape looks deliberate, not accidental.

---

## Lens D — Product strategy framing

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|----------|--------|-----------|
| What problem will this solve? | `products.js` (4,877 lines), ~158 individually hand-wired D37 adapters, and ~12 hand-rolled migration functions re-run (with 33 distinct failure-handling paths) on every boot are accumulating ordinary web-app complexity and boot-time fragility in the wuce web-ui product — independent of, and unrelated to, the already-closed LangGraph/Aegra question. | Strong — all three figures re-confirmed directly from the code this session, not recalled. |
| For whom? | The platform owner/maintainer (Hamish), as the person who extends `products.js`, wires new adapters, and watches boot logs for migration failures. Not end-users directly — this is internal maintainability, same framing as the LangGraph question's own Lens D. | Strong. |
| How will we measure success? | Candidate signals, none yet formalised: boot-time migration failure count trending to zero; `products.js` line count trending down (or at least not growing per new feature); time for a new contributor to correctly wire a new D37 adapter without re-reading `server.js`'s whole wiring block. | Weak — real but unmeasured; would need a benefit-metric artefact if this proceeds. |
| What alternatives exist today? | Status quo (continue hand-rolling); ad hoc refactoring (split `products.js`, consolidate adapter-wiring patterns) without touching the underlying zero-dependency philosophy — this is strictly weaker tooling than a real migration-tracking mechanism, but costs nothing architecturally. | Strong — both are real, already-available options, not hypotheticals. |
| Why are we best suited? | This is where the earlier LangGraph question and this one diverge sharply. The web-ui's minimal-dependency shape (`zero Express dependency`, platform-wide "no vendor dependency in the critical path" framing) reads as a **deliberate** choice, not an oversight — meaning "are we best suited to adopt a framework/platform" isn't a neutral engineering question here, it's a question of whether to reverse a stated design principle. That tension doesn't exist equally for every sub-problem (see Lens A below) — a migration-tracking table doesn't need Express or a BaaS and doesn't touch this principle at all; a full SSR framework (Next.js) would. | Medium — strong evidence the tension exists, weak evidence yet on how much it should constrain the answer, since the principle's own rationale isn't documented anywhere this session checked. |
| Why now? | The migration-boot-failure pattern is already live production behaviour today (33 real catch-blocks exist to handle it) — the cost is already being paid, not hypothetical. The adapter-wiring and `products.js`-size costs are slower-burning (maintainer friction, not user-facing failures) and have no "why now" urgency beyond "it keeps growing." | Strong for the migration sub-problem; weak for the other two. |
| How will we reach customers? | N/A — internal tooling decision, no go-to-market dimension, same as the LangGraph question. | N/A. |
| What must MVP demonstrate? | For the one sub-problem with a clean, scoped MVP (migration tracking): add a single `schema_migrations` tracking table, change each `migrate*Schema` call to check-then-skip instead of blind `CREATE TABLE IF NOT EXISTS` every boot, and confirm the 33 failure-catch paths drop to zero *not-already-applied* re-runs on a warm boot. A clean pass/fail signal, cheap to build, no framework adoption required. | Strong — specific and falsifiable, same bar Lens D held the LangGraph POC to. |
| What are the critical risk factors? | **Desirability/philosophy risk:** recommending a framework/BaaS swap (as opposed to just the migration fix) tensions directly with a stated, deliberate architectural principle — this is a bigger, more contestable claim than anything in the LangGraph question, which had no competing principle to override. **Viability/blast-radius risk:** this is a *live production app with real tenant data* (`skills-framework.fly.dev`) — a framework swap carries real regression and downtime risk that the LangGraph question never had (that was purely internal CLI tooling). **Scope-conflation risk (recurring pattern, same shape as before):** "web-ui platform fit" is not one problem — migrations, adapter-wiring, route-handler size, and the rendering layer are four different sub-problems that could have four different right answers; treating them as one monolithic "adopt a platform" decision would repeat the exact category error the LangGraph ideation corrected twice already. | High on philosophy/scope-conflation; low-medium on the migration sub-problem specifically, which is cheap, additive, and philosophy-neutral. |

### Recommendation

> **PROCEED — but only on the narrowest sub-problem (migration tracking), and treat every other sub-problem as its own, separately-decided question, not a bundled "adopt a platform" verdict.**
>
> Rationale: Of the four sub-problems Lens A below separates out, only the migration-tracking gap has (a) a cheap, clearly-scoped, philosophy-neutral fix, (b) already-occurring real cost (33 failure-catch paths in production code, not hypothetical), and (c) a clean MVP bar this ideation can state precisely. The other three — adapter-wiring boilerplate, `products.js` size, and whether the rendering layer itself would benefit from a real framework — either have no urgent evidence of active breakage (adapter-wiring, route-handler size: real maintainer friction, but not production failures) or directly contest a stated architectural principle (a rendering framework / BaaS) in a way that deserves its own explicit decision, not a bundled yes. This mirrors the exact shape of the original LangGraph verdict: fix the cheap, evidenced, unambiguous thing now; treat the bigger, principle-contesting bet as a separate, deliberate choice for the operator to make explicitly if they want to.

---

## Lens A — Opportunity map

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

> Reduce ordinary web-app maintainability and reliability costs accumulating in the wuce web-ui product (boot-time migration fragility, adapter-wiring boilerplate, route-handler sprawl) — without bundling that work into, or being gated by, the already-closed LangGraph/Aegra question, and without assuming a framework/platform swap is the right fix for every sub-problem just because some of them look platform-shaped.

### Opportunity tree

```
Outcome: Reduce wuce web-ui maintainability/reliability cost, sub-problem by sub-problem

├── Cluster 1: Migration bookkeeping (no tracking table)
│   ├── Pain point: ~12 migrate*Schema/Columns functions re-run their full
│   │   CREATE TABLE IF NOT EXISTS logic on every single boot -- there is no
│   │   table anywhere recording "this migration already ran"
│   ├── Pain point: 33 separate .catch(...) blocks exist specifically to
│   │   handle migration failures at boot -- confirmed, real, already-paid cost
│   └── Desire: a one-time-per-migration execution model, the textbook
│       behaviour any standard migration tool (or even a 20-line hand-rolled
│       tracking table) already provides
│
├── Cluster 2: Adapter-wiring boilerplate (D37 pattern at scale)
│   ├── Pain point: 158 individually hand-wired setX(...) adapter functions
│   │   across src/web-ui/*.js -- each new feature adds its own, by hand,
│   │   following the D37 convention (CLAUDE.md's injectable-adapter rule)
│   ├── Pain point: D37's own mock-shape verification rule (CLAUDE.md) exists
│   │   specifically because this pattern has already produced a real
│   │   production no-op bug (tir-s5/tir-s8, bulk-add reusing setFetchOrgs)
│   │   -- the boilerplate isn't just verbose, it has already hidden a
│   │   real defect once
│   └── Desire: a smaller number of structural wiring points, or at minimum
│       a lint/contract check that the D37 mock-shape rule's own hard-won
│       lesson doesn't need to be re-learned by hand each time
│
├── Cluster 3: Route-handler sprawl (products.js)
│   ├── Pain point: 4,877 lines in one file, confirmed directly this session
│   ├── Pain point: CLAUDE.md's own architecture-standards section already
│   │   names this exact file as "the single most common web-ui defect in
│   │   this repo" (via the renderShellWithNav wrapper requirement) --
│   │   meaning the file's size is already a known, named source of real
│   │   defects, not just an aesthetic complaint
│   └── Desire: smaller, feature-scoped route modules -- an ordinary
│       refactoring outcome, not something a platform choice determines
│
└── Cluster 4 (emerging, lowest evidence, highest stakes -- flagged, not
    recommended): Would a real SSR framework (Next.js) or BaaS fit better
    than the current zero-dependency, raw-http.createServer() approach?
    └── Evidence only: the three clusters above are real symptoms that a
        framework like Next.js would likely reduce (file-based routing,
        built-in data-fetching patterns, a real migration-aware ORM layer
        for Cluster 1). But this directly contests tech-stack.md's own
        stated "zero Express dependency" / "no vendor dependency in the
        critical path" framing for this exact layer -- adopting one would
        be reversing a documented, apparently deliberate choice, on a live
        production app with real tenant data, not a clean-slate decision.
        Explicitly NOT recommended to pursue without the operator first
        deciding whether that principle itself should be revisited --
        that is a bigger, separate, more consequential decision than
        anything else in this tree.
```

---ASSUMPTION-JSON: {"id":"wuce-zero-dep-deliberate","text":"The web-ui's zero-Express-dependency, raw-http.createServer() architecture is a deliberate design choice, not an unexamined default.","type":"feasibility","risk":"medium","knowness":"known-unknown"}---

---ASSUMPTION-JSON: {"id":"migration-fix-no-regression","text":"Adding a schema_migrations tracking table and changing each migrate*Schema call to check-then-skip can be done without disrupting any currently-passing migration path.","type":"feasibility","risk":"medium","knowness":"known-unknown"}---

---CONDITION-JSON: {"id":"no-bundled-platform-decision","text":"Any recommendation from this ideation must treat each of the four clusters as a separately-decided question, not a single bundled adopt-a-platform verdict.","type":"constraint","source":"model"}---

### Opportunity prioritisation

| Opportunity | Importance | Current satisfaction | Priority |
|------------|-----------|---------------------|----------|
| Migration bookkeeping (Cluster 1) | High | Low — 33 real failure-handling paths exist because the gap is real | 🟢 Top |
| Adapter-wiring boilerplate (Cluster 2) | Medium | Low — already produced one real production no-op bug (tir-s5) | 🟡 Watch |
| Route-handler sprawl (Cluster 3) | Medium | Low — CLAUDE.md already names this file as the repo's most common web-ui defect source | 🟡 Watch |
| SSR framework / BaaS adoption (Cluster 4) | High (if pursued) | N/A — not a maintainability gap, a philosophy question | ⚪ Pass — needs its own explicit operator decision, not a ranked opportunity |

### Top opportunity — seed solutions

> **Opportunity:** Migration bookkeeping has no tracking table (Cluster 1, top priority)

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|--------------------|--------------------------|--------------------|
| Hand-rolled `schema_migrations` table (migration name + applied-at timestamp), each `migrate*Schema` function checks it first | Removes the re-run-every-boot cost with zero new dependencies — stays fully inside the stated zero-dependency philosophy | High — this is the textbook fix, implementable in an afternoon, no framework needed |
| Adopt a standard migration framework (e.g. a lightweight one with no server/ORM lock-in) purely for migration *tracking*, not as a gateway to a larger framework adoption | Same outcome, less hand-rolled code to maintain, but is a real new dependency | Medium — contradicts "zero dependency" more than the hand-rolled option, for a marginal convenience gain; worth considering but not the default |
| Full ORM/BaaS adoption (Prisma, Drizzle, Supabase) | Would also address Cluster 1, but bundles a much bigger decision (Cluster 4) into what should be the cheapest, most decoupled fix | Low as a *first* move — exactly the scope-conflation risk this ideation is trying to avoid |

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|--------|-------|-------|
| Strategy framing (Lens D) | `/discovery`, if the migration-tracking fix proceeds | Recommendation is PROCEED on the narrowest cluster only; Clusters 2-4 explicitly not bundled into this decision |
| Opportunity map (Lens A) | `/discovery` for Cluster 1 specifically, if pursued; a future, separate `/discovery` for Cluster 4 if the operator ever wants to revisit the zero-dependency principle | Four clusters kept deliberately separate — this is the ideation's main structural finding, not just a list |

---

## Open questions

| Question | Blocking? | Owner | How to resolve |
|----------|-----------|-------|---------------|
| Should the migration-tracking fix (Cluster 1) proceed as a short-track story? | No — but recommended, it's cheap and already-evidenced | Operator | `/test-plan → /definition-of-ready → coding agent`, same short-track path used for other bounded fixes this session |
| Is the web-ui's zero-dependency architecture a documented, deliberate choice with a stated rationale, or an unexamined default that happened to stick? | Yes, for Cluster 4 specifically | Operator | Check whether any ADR or decisions.md entry exists justifying it; if none, that itself is informative — ask the operator directly why it was chosen, since this session found no documented rationale, only the stated fact of the choice |
| Should Clusters 2 (adapter-wiring) and 3 (route-handler sprawl) become their own short-track refactoring stories, independent of any platform decision? | No — not blocking anything | Operator | Ordinary `/discovery` or short-track scoping whenever there's bandwidth; both are real but slower-burning than Cluster 1 |
| Should Cluster 4 (SSR framework / BaaS adoption) be pursued at all? | Yes, if ever pursued — this is the one cluster that needs an explicit human decision, not just more evidence-gathering | Operator | A direct conversation about whether the zero-dependency principle should be revisited — this ideation deliberately does not pre-answer that, since it's a bigger strategic reversal than anything else in this tree |
