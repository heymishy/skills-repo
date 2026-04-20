# Decision Log: 2026-04-18-cli-approach

<!--
  PURPOSE: Records the reasoning behind human judgment calls made during the pipeline.

  Artefacts record WHAT was decided.
  This log records WHY, by WHOM, and what was considered and rejected.

  This is the document you read six months later when someone asks:
  "Why did we do it this way?" or "Who agreed to skip that?"

  Written to by: pipeline skills (at decision points) and humans (during implementation).
  Read by: retrospectives, audits, onboarding, future work on this feature.

  To evolve this format: update templates/decision-log.md and open a PR.
-->

**Feature:** CLI approach for AI-assisted workflow
**Discovery reference:** `artefacts/2026-04-18-cli-approach/discovery.md`
**Last updated:** 2026-04-18

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

<!-- Pipeline appends entries here as decisions are made. Most recent at the bottom. -->

---

**2026-04-18 | SCOPE | discovery (/clarify)**
**Decision:** Theme F (second-line organisational independence — phase4-5 Problem 3) informs this feature; this feature does not deliver Theme F's governance controls. This feature's outputs (workflow declaration structure, per-node verification contract fields, optional `executorIdentity` trace field) become Theme F inputs, but dual-authority approval routing, RBNZ-ready documentation, and the second-line governance model itself remain Theme F deliverables.
**Alternatives considered:** (A) In scope as deliverables — initially taken under /clarify Q2; pulled back as over-claim. (B) Adjacent / coupled — named but not claimed. (C) Explicitly out-of-scope. Final position adopts the "informs" framing — closer to B than A or C, but with explicit input-to-Theme-F coupling named.
**Rationale:** Q2's initial Option A over-claimed scope. Theme F is heymishy's parallel workstream. This feature's maker/checker claim holds on its own structural merits (hash-verified envelope, declared-path artefact landing, trace schema aligned with existing gate); Theme F composes where the consuming organisation's governance bar requires both structural and organisational controls. Delivering Theme F from this feature would cross-scope with a parallel workstream and inflate /definition's decomposition.
**Made by:** Operator (craigfo), 2026-04-18, during /clarify Q4 directive.
**Revisit trigger:** If Theme F's delivered governance model imposes specific shape constraints on this feature's outputs (contract structure, declaration structure, trace fields) not anticipated by this discovery. Or if an auditor's position collapses the "informs, not delivers" distinction (e.g. demands this feature deliver the second-line routing itself).

---

**2026-04-18 | ASSUMPTION | discovery (/clarify)**
**Decision:** Assumption 1 (auditors accept consumer-side evaluation) is not conditional on Theme F's progress. Structural correctness stands on its own technical merits; Theme F composes where a regulated-context governance bar requires both structural and organisational controls. One genuinely unvalidated piece retained: auditor position on whether evaluation must run under their direct control, not just recording.
**Alternatives considered:** Keep A1 as originally worded ("joint validation with Theme F" — too strong a coupling; makes this feature's success dependent on heymishy's parallel workstream). Drop A1 entirely ("over-corrects; leaves a real unvalidated auditor-position question unflagged").
**Rationale:** Theme F pull-back (Q4 directive) requires the assumption to match the new scope boundary. Joint-validation wording was an over-claim of Theme F coupling; the CLI's structural claim is independently validatable via hash verification, trace schema, and assurance-gate re-verification. The narrow unvalidated piece (auditor position on direct control) is kept because it's genuinely open and not resolved by Theme F.
**Made by:** Operator (craigfo), 2026-04-18, during /clarify Q4 directive.
**Revisit trigger:** First regulated consumer engagement where an auditor explicitly rejects consumer-side evaluation regardless of recorder independence. Or where Theme F's delivered governance model resolves the auditor-position question.

---

**2026-04-18 | ASSUMPTION | discovery (/clarify)**
**Decision:** Adopt Assumption 8 — Spike A (governance logic extractability) lands adequately: either a shared governance-package core emerges, or evidence that separate per-mechanism implementations are the pragmatic path. If Spike A produces a third outcome that reshapes mechanism identity itself, this feature's framing re-runs.
**Alternatives considered:** Leave the Spike A contingency implicit (less auditable; surfaces only at /review). Make the feature hard-conditional on a specific Spike A outcome (too strong — this feature can proceed under either of Spike A's two recognised outcomes; only a third unexpected outcome reshuffles framing).
**Rationale:** This feature is framed as the reference implementation for Spike B2, which assumes Spike A has completed. Naming the Spike A contingency as an explicit assumption makes the dependency auditable at /benefit-metric and /definition. Treats the two anticipated Spike A outcomes (success / separate-implementations) as equally valid for this feature to proceed.
**Made by:** Operator (framing surfaced in /clarify prompt; absorbed into discovery 2026-04-18). Logged during /clarify.
**Revisit trigger:** Spike A completion, interim report, or any signal that Spike A's direction is one of the two anticipated outcomes rather than a third.

---

## Architecture Decision Records

<!-- Feature-level ADRs. Structural decisions with long-term implications go here. -->

### ADR-001: CLI as reference implementation for Spike B2, not universal governance package

**Status:** Accepted (retrospectively logged 2026-04-18 for decision made in /discovery framing and preserved in /clarify Q2 → Q4 pull-back)
**Date:** 2026-04-18
**Decided by:** craigfo (feature owner), informed by heymishy on PR #155

#### Context

PR #98 (engine-consolidation proposal) originally framed the CLI as the single authoritative control plane — absorbing all `src/*` platform-internal components (`surface-adapter`, `improvement-agent`, `approval-channel`, Bitbucket validators) into `cli/src/adapters/` and `cli/src/agents/`. The proposal treated the CLI as the governance package itself.

heymishy's #98 response and the subsequent phase4-5 strategic horizon reference (`artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`) reframed the **enforcement mechanism** as the control plane, with the CLI as one valid mechanism for one class of surface. phase4-5 evaluates five candidate enforcement mechanisms (CLI prompt injection, MCP tool boundary, orchestration framework graph transitions, structured output schema validation, GitHub Actions hardening); CLI is mechanism 1 of 5.

heymishy on PR #155 explicitly posed the question: "is the CLI (a) the reference implementation for Spike B2 specifically, or (b) a broader proposal that the CLI is the governance package (shared core is CLI-shaped and other mechanisms adapt around it)?"

This feature's discovery adopted the (a) framing prior to /clarify; the operator confirmed (a) during /clarify as pre-settled context.

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| (a) CLI as Spike B2 reference implementation (**chosen**) | Aligns with phase4-5 multi-mechanism matrix; preserves optionality for MCP (VS Code / Claude Code), orchestration (non-technical surfaces), schema validation, GitHub Actions hardening; feature scope bounded; composes with Spike A regardless of Spike A outcome. | Smaller blast radius per feature; multi-mechanism = more governance surface to maintain; some PR #98 work (engine-consolidation migration) is out-of-scope here. |
| (b) CLI as universal governance package | Single source of truth; simpler mental model; PR #98 engine-consolidation proceeds as originally framed. | Pre-commits to a shape before Spike A evaluates extractability; collapses phase4-5's multi-mechanism matrix into a single-mechanism commitment; locks out MCP / orchestration / schema mechanisms that fit other surfaces; conflicts with heymishy's PR #155 reframe. |

#### Decision

Adopt (a) — CLI is the reference implementation for Spike B2 (mechanism 1 of 5 in phase4-5's matrix). Primary reason: preserves the multi-mechanism matrix that Spike A and Spike B2 are designed to evaluate, and aligns with heymishy's PR #155 reframe. (a) does not foreclose (b) — if Spike A evidence suggests a CLI-shaped shared core is the right architecture, that is a follow-on decision under a separate workstream.

#### Consequences

- **Easier:** feature scope stays bounded (one mechanism, one surface class, one outer-loop phase); /definition decomposes against a reference-implementation MVP, not an engine-consolidation migration; MVP can ship without waiting for other mechanism reference implementations; this feature's outputs (workflow declaration, per-node verification contract, optional `executorIdentity` trace field) become clean inputs to Theme F and Spike A evaluation.
- **Harder:** platform's governance surface grows (per-mechanism reference implementations + a shared core or per-mechanism divergence); maintenance surface doubles if Spike A produces the "separate implementations" outcome; multi-mechanism commitment requires platform-team bandwidth that is finite.
- **Now off the table (for this feature):** PR #98's engine-consolidation proposal as within-scope work; `src/*` migration into `cli/src/adapters/` as a near-term deliverable; framing the CLI as the single authoritative governance package.

#### Revisit trigger

- Spike A verdict of "shared CLI-shaped core is viable and preferable" — re-open (b) framing as a platform decision (not this feature's scope).
- Spike B2 verdict of REJECT — feature's framing collapses regardless of (a)/(b).
- Platform-team bandwidth collapse — multi-mechanism matrix becomes unsustainable; platform may reduce to a single mechanism (but (a) does not pre-commit the survivor to CLI).

---

### ADR-002: Workflow-as-graph with navigation primitives (`workflow`, `advance`, `back`, `navigate`)

**Status:** Accepted (retrospectively logged 2026-04-18 for decision pre-settled in /clarify, amendments made in reference 012 / 013)
**Date:** 2026-04-18
**Decided by:** craigfo (feature owner), informed by heymishy on PR #155

#### Context

012 / 013 original framing described the workflow as "the ordered sequence of skills to invoke" with "entry conditions for each step". The CLI's `advance` command moved forward only — no retreat or revisit. Linear model.

heymishy on PR #155: *"the platform today works non-linearly — /workflow inspects state and the operator navigates to any skill at any time. You can run /discovery, realise the benefit metric doesn't hold, go back to /clarify, re-run /benefit-metric, then forward to /definition. That's not a bug — it's how real delivery works. Scope shifts, assumptions fail, you backtrack."*

phase4-5 §3 codifies this as a design principle: *"the platform is a graph of skill invocations with named entry points (/workflow, /spike, /decisions, /ideate, /systematic-debugging), not a linear pipeline. Phase 4 enforcement preserves this graph."*

craigfo replied on PR #155: *"adding navigation primitives so the workflow could be a graph, not a sequence. Each node specifies allowed transitions (0 terminal, 1 next, N branching with operator-chosen target, back-references for retreat). CLI executes whatever the workflow permits. Navigation surface: `workflow` (current node + options), `advance` (default next, or `--to=<step>`), `back`, `navigate <step>`. Operator picks; agent never sequences. Per-invocation fidelity (P1–P4) holds regardless of order."*

012 / 013 amendments followed. The graph model became pre-settled context during /clarify.

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| Workflow as graph with navigation primitives (**chosen**) | Matches platform's actual non-linear usage pattern; preserves P4 interaction mediation at each transition; preserves multi-path skill graph that phase4-5 §3 treats as intended; CLI viable across interactive operator surfaces, not just linear pipelines. | More complex declaration schema; CLI needs four navigation primitives rather than one; test harness must cover non-linear scenarios; graph topology must be operator-comprehensible. |
| Workflow as forced linear sequence | Simpler declaration schema; simpler CLI (one `advance` command); easier mental model for linear CI pipelines. | Collapses the multi-path skill graph; forces operator to abandon the CLI for non-linear work (re-run /clarify after /benefit-metric, etc.); positions CLI as linear-only and weakens its fit for the regulated-context interactive operator surface. |
| Workflow shape deferred — decide at Spike B2 | Keeps MVP scope narrower; lets Spike A / Spike B2 evidence drive. | Spike B2 is designed to evaluate the CLI as-proposed; an open shape at Spike B2 time forces Spike B2 to evaluate two CLIs (linear + graph) or evaluate the wrong CLI. Non-decision is worse than either decision. |

#### Decision

Adopt the graph model. Workflow declaration specifies allowed transitions per node (0 terminal, 1 next, N branching with operator-chosen target, back-references). CLI executes whatever the workflow permits. Four navigation primitives: `workflow` (current node + options), `advance` (default next, or `--to=<step>`), `back`, `navigate <step>`. Primary reason: matches how the platform actually works per phase4-5 §3 and PR #155 feedback. Forced linearity would collapse the multi-path skill graph that is an intended feature.

#### Consequences

- **Easier:** CLI fits interactive operator surfaces, not just linear CI; operator can backtrack / revisit without abandoning the CLI; per-invocation fidelity (P1–P4) preserved at each transition regardless of order; Spike B2 evaluates the CLI in its genuine form.
- **Harder:** workflow declaration schema must represent graph topology (transitions list per node); CLI command surface grows to four navigation primitives; test harness must exercise non-linear scenarios; ADR-003 (contract location) is now load-bearing; trace schema needs a `transition` field distinguishing advance / back / navigate.
- **Now off the table:** single-command `advance`-only CLI; forced-linear declaration schema; reducing workflow to a pure sequence.

#### Revisit trigger

- Operator experience shows navigation primitives are consistently confusing or under-used (six-month metric) — reshape to simpler surface or adopt default-linear-plus-explicit-non-linear mode.
- Spike B2 evaluates graph-mode CLI as unfit but linear-mode CLI as fit for the regulated/CI surface class — split the CLI into two modes (regulated-linear + interactive-graph) or drop graph mode.
- Platform moves to a single-mechanism commitment (not CLI) — this ADR becomes moot.

---

### ADR-003: Verification contract lives inside the workflow declaration (per-node fields), not as a separate artefact

**Status:** Accepted (retrospectively logged 2026-04-18 for /clarify Q5)
**Date:** 2026-04-18
**Decided by:** craigfo (feature owner), /clarify Q5

#### Context

The CLI's verification contract is the set of checks it runs before any `advance` / `back` / `navigate` transition: hash verification, output-shape check against declared expectation, state-precondition check.

Even after the Q4 Theme F pull-back, this contract exists and must live somewhere — as a readable artefact, a field in another artefact, or encoded in CLI binary code.

/clarify Q5 surfaced the location question with four options. Operator chose (B) with the caveat that contracts could always be moved out later based on Spike A outcome.

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| Part of the workflow declaration, per-node fields (**chosen**) | Simpler artefact inventory; fewer files to pin; Theme F (when it lands) governs a single declared file for both topology and contract; graph navigation + per-node contract is cohesive; each node declares its own `expected-output-shape`, `required-prior-artefacts`, skill hash, approval-gate metadata. | Declaration grows with contract detail; cannot reuse contract shape across runtimes without also consuming the topology (portability narrower); extractability is a post-MVP migration if Spike A demands it. |
| `verify-contract.json` as separate artefact | Contract reusable across runtimes without topology; Theme F governs a named file; cleaner separation of concerns. | Two files to hash-pin; two files to govern; two files for Theme F to reason about; more governance surface for no immediate benefit at MVP scale. |
| Encoded in CLI binary release | Simplest MVP shape; no consumer-visible contract artefact. | Hardest audit trail (contract changes are CLI version bumps, opaque without source inspection); Theme F has no artefact to govern; consumer cannot inspect contract without reading CLI source. |
| Defer to Spike A | MVP ships with whatever Spike A recommends. | Blocks MVP on Spike A; /definition cannot decompose stories without knowing where the contract lives; pragmatic default is better than indefinite deferral. |

#### Decision

Adopt (B) — contract lives inside the workflow declaration as per-node fields. No dedicated `verify-contract.json` in MVP. Primary reason: simpler artefact inventory and lower governance surface at MVP scale; aligns with ADR-002's graph model where each node is a discrete unit of contract + topology; preserves optionality to extract later if Spike A surfaces a reason.

#### Consequences

- **Easier:** one hash-pinned artefact to reason about (workflow declaration); /definition decomposes contract stories against the declaration schema; Theme F governance surface is a single file.
- **Harder:** declaration schema must accommodate contract fields; schema versioning couples topology and contract (they version together, not independently); cross-runtime contract reuse (e.g., MCP server consuming the same contract shape) requires consuming the declaration wholesale.
- **Now off the table (for MVP):** separate `verify-contract.json`; CLI-binary-encoded contract; cross-runtime contract-only reuse.

#### Revisit trigger

- Spike A outcome where a different runtime (MCP server, orchestration framework) wants to consume the contract shape without the topology — triggers extract-to-separate-artefact migration.
- Declaration schema grows unwieldy from accreted contract detail (measurable via schema file line count or number of contract field types).
- Theme F decides the contract must be governed on a different cadence than topology (e.g., second-line approves contract changes but not topology changes) — triggers separate-artefact extraction.
