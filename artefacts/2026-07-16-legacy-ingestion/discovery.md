# Discovery: Legacy Ingestion Pipeline — `/reverse-engineer` → `/modernisation-decompose` → Feature Candidates → `/discovery`

**Status:** Draft — awaiting approval
**Created:** 2026-07-16
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent)

---

## Problem Statement

A legacy codebase cannot be turned into outer-loop backlog input today without an operator manually reverse-engineering intent from code first, then manually drafting a `/discovery` input by hand. `/reverse-engineer` and `/modernisation-decompose` already contain the extraction and decomposition logic to close this gap — both are fully built, detailed, sophisticated skill definitions, not stubs. `skills/reverse-engineer/SKILL.md` implements a genuine six-layer extraction methodology (structure scan; explicit business rules; hidden business rules; interface contracts; regulatory/compliance rules; data model/ownership; proprietary logic), with stack-specific reading plans for Spring/Spring Boot Java, Struts 2, IBM ACE/IIB, and COBOL, a four-type pass model (INITIAL/EXTEND/DEEPEN/VERIFY) for multi-session corpus management, confidence ratings, disposition assignment, SaaS-platform-fit assessment, and ten distinct named outputs. `skills/modernisation-decompose/SKILL.md` is similarly complete: a deterministic, priority-ordered boundary-signal detection process with an explicit low-signal escalation path, already producing a de facto Feature-candidate output at `artefacts/[system-slug]/candidate-features.md` — each entry carrying `feature-slug`, `problem-statement`, `rule-ids`, `persona`, `mvp-scope` fields, a `umbrellaMetric: true` frontmatter flag, and an explicit traceability note back to the source `reverse-engineering-report.md`, stated in the skill's own text to be "written to be sufficient for direct use in `/discovery` without further manual augmentation."

Despite this maturity, neither skill has ever been run in this repository — confirmed directly: no `reverse-engineering-report.md`, `candidate-features.md`, or `corpus-state.md` exists anywhere under `artefacts/`, zero features in `pipeline-state.json` have a `reverseEngineerStatus` field set, and zero files under `workspace/traces/` reference either skill by name. Neither skill is reachable from the web UI: `handlePostJourney`'s `startSkill` form field (`src/web-ui/routes/journey.js` line 333) accepts exactly two values — `'ideate'` or `'discovery'` — with any other value silently defaulting to `'discovery'`. The gap runs deeper than a missing button: `/reverse-engineer`'s own artefact convention operates on a **system-slug** (`artefacts/[system-slug]/...`), a different concept from the **feature-slug** the entire existing journey-creation flow is built around — a legacy-ingestion entry point needs a new slug type and a new session-creation path, not just a third radio button. And the resulting `candidate-features.md` entries have no governed backing in `pipeline-state.json` — they exist only as an unstructured markdown file with no queue state, no hash verification, and no way for an operator to see "N candidates are waiting to be triaged" the way the existing dashboard already surfaces feature-level state.

## Who It Affects

- **A platform maintainer or delivery lead inheriting an existing legacy system** (the explicit scenario `/reverse-engineer`'s own Q0 gate anticipates — "Modernisation: this system is being replaced or substantially rewritten") — today has working extraction and decomposition tooling available, but no governed way to see, triage, or track the resulting candidates as first-class backlog items; the tooling's own output currently lands as a bare file, not a tracked entity.
- **An operator working through the web UI (the SaaS-GUI surface)** — has a working "+ New feature" journey-creation flow for `ideate`/`discovery`, but cannot start a legacy-ingestion session at all through that same surface; they would need to invoke `/reverse-engineer` some other way (a CLI/chat-only path this discovery names explicitly, since the UI gap is structural, not cosmetic).
- **A future consumer of a Java-based legacy system specifically** benefits from `/modernisation-decompose`'s existing, working boundary-signal detection today. Its four boundary signals — Maven module, Spring `@Service`, JPA aggregate root, `@Transactional` span — are explicitly Java/Spring-ecosystem concepts; the file itself contains an explicit extension-point comment noting COBOL, PL/SQL, and .NET boundary signals "are not implemented in the current version." Since `/reverse-engineer` already supports COBOL, Struts 2, and IBM ACE/IIB stacks, there is a real, asymmetric capability gap: a consumer with a non-Java legacy system gets a fully working extraction pass but no working decomposition step, and would immediately hit `/modernisation-decompose`'s own low-signal escalation path. This asymmetry needs to be named and its resolution scoped, not silently assumed away.

## Why Now

The two component skills already exist, are already detailed and mature, and have simply never been connected to a real trigger or a real UI entry point, nor formalized into a governed primitive. The gap is not "we need to invent extraction logic" — it is "the extraction and decomposition logic already exists and has sat unexercised, disconnected from both the web UI and from `pipeline-state.json`'s governance model." Closing this now is lower-risk and lower-effort than it might first appear, since the hardest analytical work (six-layer extraction methodology, boundary-signal priority ordering) is already done — what remains is orchestration and governance wiring, the same category of gap this platform's own outer-loop discipline exists to close before it accumulates further (the same pattern this session's own outer-loop review found and closed for short-track DoD and `workspace/state.json` staleness).

Note also that neither skill references or depends on a shared "context-graph" extraction mechanism, because no such mechanism exists yet to share: the context-graph primitive proposed in the companion `2026-07-13-context-graph-primitive` discovery remains at `Status: Clarified — awaiting approval`. `/reverse-engineer`'s six-layer methodology is a mature, prompt-driven manual reading process that predates that proposal and already functions as the extraction mechanism in current use — if anything, a future context-graph implementation should consider reusing patterns from `/reverse-engineer`'s already-proven approach, not the reverse.

## MVP Scope

1. **A new Feature-candidate primitive**, formalizing `/modernisation-decompose`'s existing `candidate-features.md` output into a governed entity with `pipeline-state.json` backing: a distinct queue/backlog state (e.g. a top-level `featureCandidates[]` array, or a dedicated `candidateStatus` field) so an operator can see how many candidates exist and their disposition (queued / triaged / promoted to a real feature slug / rejected) without opening the raw markdown file. Fields carried over unchanged from the existing schema: `feature-slug`, `problem-statement`, `rule-ids`, `persona`, `mvp-scope`, plus the existing `umbrellaMetric` and traceability-note fields as provenance.
2. **`/reverse-engineer` and `/modernisation-decompose` remain unchanged in their extraction/decomposition logic** — this discovery does not re-scope the six-layer methodology or the Java-specific boundary-signal detection itself. The Java-only limitation is named as an explicit, separately-resolvable scope decision (see Out of Scope), not silently absorbed into this MVP's build.
3. **A UI/CLI entry point for starting legacy ingestion**, given the structural system-slug vs. feature-slug mismatch described in the Problem Statement. The MVP recommendation is a CLI/chat-invoked path (matching how `/reverse-engineer` already operates today, given it has never been run through any interface) rather than attempting to retrofit the existing `handlePostJourney`/`startSkill` UI flow in this same discovery — that retrofit is a larger, separate web-UI change better scoped at `/definition` once this discovery's data model is settled.
4. **Feature candidates land in the new queue state** (item 1) distinct from active feature slugs, until an operator runs `/discovery` against one and it becomes a real, governed feature slug via the same slug-creation mechanism as manual discovery — preserving the legacy-provenance link (the `rule-ids`/traceability-note fields) as a new field on the resulting feature slug's own `pipeline-state.json` entry, not just in the discarded candidate record.
5. **No shortcut through DoR/DoD** — feature candidates promoted to real feature slugs go through the full, unmodified outer loop and inner loop exactly as any other feature. Nothing in either component skill's own logic attempts to bypass a gate.

## Out of Scope

- **The product-level rollup/dashboard work** — separate discovery (`artefacts/2026-07-16-product-rollup/discovery.md`), run first per the operator's own explicit sequencing. That discovery's own Assumptions section flags whether candidate-provenance should become a rollup field; this discovery does not resolve that question, only supplies the provenance field itself.
- **Actual migration/rewrite tooling** — this pipeline produces discovery inputs, not code.
- **Automated re-scoring of candidates over time as the legacy repo changes** — one-shot extraction for MVP.
- **Closing the Java-only boundary-signal gap in `/modernisation-decompose`** — a real, non-trivial gap, but resolving it (adding COBOL/Struts2/ACE-IIB-aware boundary signals) is a substantial, separately-scoped piece of work in its own right, not an MVP-blocking dependency for formalizing the Feature-candidate primitive itself. A Java-only MVP is honest about its own limitation rather than silently pretending multi-stack support already exists.
- **Retrofitting the existing web-UI journey-creation flow** to add a third `startSkill` option or a system-slug concept — deferred to a follow-on `/definition`/`/ideate` pass per MVP scope item 3's own reasoning.
- **Multi-repo cross-referencing** — neither skill currently handles this at all (confirmed by absence in both SKILL.md files, not an explicit single-repo statement), and no evidence exists that a real multi-repo legacy system has been attempted. Deferred as materially harder and unvalidated by any real usage yet, not merely an MVP cut for convenience.

## Assumptions and Risks

[ASSUMPTION] A CLI/chat-invoked entry point for legacy ingestion (MVP scope item 3) is an acceptable interim path, given the structural system-slug vs. feature-slug mismatch in the web UI — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is a UI-reachable legacy-ingestion journey from day one, the web-UI retrofit becomes an MVP-in-scope item rather than a deferred one, materially changing this discovery's own MVP boundary.

[ASSUMPTION] Leaving `/modernisation-decompose`'s Java-only boundary-signal limitation unresolved for MVP (Out of Scope) is acceptable, given the operator's own legacy systems of interest are not yet named — unconfirmed, requires /clarify before scope is locked. If the actual target legacy codebase for this pipeline's first real use is COBOL, Struts 2, or another non-Java stack (all of which `/reverse-engineer` already supports extraction for), this MVP would produce a working corpus with no working decomposition step — a materially incomplete pipeline for that specific case, not a deferred nice-to-have.

**Risk:** The de facto `candidate-features.md` schema was designed and implemented without ADR-003 hash-verification in mind. Retrofitting hash verification onto an existing, working output format carries a real (if likely small) risk of a breaking schema change to `/modernisation-decompose`'s own Step 3 output — this should be scoped carefully at `/definition` rather than assumed to be additive-only.

**Risk:** Because neither skill has ever been run, every claim in this discovery about "the logic is mature and complete" is based on reading the SKILL.md instructions, not on observed real-world output quality. The six-layer methodology's actual extraction quality against a real legacy codebase is genuinely unvalidated — this MVP's first real run should be treated as a live validation of the existing skill definitions, not just of the new Feature-candidate primitive being scoped here.

## Directional Success Indicators

**A legacy codebase can be turned into one or more real feature slugs without a person manually drafting a discovery input by hand.** Baseline: 0 — no legacy-to-feature-slug conversion has ever happened in this repository (zero run history for either component skill, confirmed directly). Target: at least one real legacy system successfully produces N feature candidates, at least one of which is promoted through `/discovery` to a real, DoR-signed-off feature slug. Measured via: direct observation of the first real end-to-end run, recorded in this feature's own `decisions.md` per this repo's own convention for logging real validation outcomes.

**Feature candidates are visible and trackable, not buried in a markdown file.** Baseline: 0% — `candidate-features.md`'s existing entries (whenever first produced) have no `pipeline-state.json` presence today, confirmed directly. Target: 100% of produced feature candidates appear in the new queue state (MVP scope item 1) and are queryable the same way active feature slugs already are via the existing dashboard tooling. Measured via: a scripted check confirming every `candidate-features.md` entry has a corresponding `pipeline-state.json` record.

**The Java-only boundary-signal limitation is a known, visible gap — not a silent one.** Baseline: currently silent — the limitation is documented only as a code comment inside `modernisation-decompose/SKILL.md`, not surfaced anywhere an operator evaluating this pipeline for a non-Java legacy system would see it before starting. Target: the limitation is stated explicitly in this feature's own `decisions.md` and in the Feature-candidate primitive's own documentation, so an operator with a COBOL/Struts2/other legacy system knows before running `/reverse-engineer` that decomposition will hit low-signal escalation. Measured via: direct review of the resulting artefacts at `/definition-of-ready`.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — the same standard governing the companion product-rollup discovery applies here: this is LLM-derived semantic content about code the team doesn't own the history of, making traceability at least as important here as anywhere else in the platform. Confirmed as a real, existing repo-wide standard (`product/constraints.md` #5).
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — directly relevant to the Feature-candidate queue-state design: whether a candidate has been promoted to a real feature slug should be a structural, CI-checkable fact (does a `pipeline-state.json` feature entry exist referencing this candidate's `rule-ids`/provenance), not merely an instruction telling the agent to remember to update a status field.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — both `/reverse-engineer` and `/modernisation-decompose` already follow this convention (confirmed directly in their own SKILL.md text); any new orchestration/entry-point skill this discovery's MVP produces should match.
- **`/reverse-engineer` already has partial EA-registry and compliance integration** — its Q3 explicitly offers to feed extracted application/interface candidates into `/ea-registry` as unverified entries, and Q2 reads `context.yml`'s `compliance.frameworks` automatically when present. This is more integration maturity than a first read of the prompt might suggest, and is directly relevant to hash-verifying LLM-derived semantic content — the regulatory-sensitivity flagging mechanism already exists; hash-verifying its output specifically is the actual open gap.
- **`context.yml`'s `meta.regulated` is `false`** for this repo currently — no compliance-framework-specific constraint applies to this discovery's own scope, though `/reverse-engineer`'s own Q2/Q4 regulatory-flagging logic remains available for whatever legacy system is eventually targeted. Confirmed directly, not assumed.
- **No fabricated budget/timeline constraint** — none was stated by the operator, and none is invented here.

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- A CLI/chat-invoked entry point for legacy ingestion is an acceptable interim path, given the structural system-slug vs. feature-slug mismatch found in the web UI.
- Leaving `/modernisation-decompose`'s Java-only boundary-signal limitation unresolved for MVP is acceptable, given the operator's own legacy systems of interest are not yet named.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification. The second assumption is time-sensitive — if a specific legacy system is already known to be non-Java, this changes the MVP boundary materially, not just a nice-to-have deferral.

## Contributors

- Hamish King — Founder/Operator
- Claude (agent) — Discovery drafting, repo-state grounding investigation

## Reviewers

- [Pending]

## Approved By

[Pending]

---

**Next step:** Human review and approval → /benefit-metric

<!-- Feature slug: 2026-07-16-legacy-ingestion (proposed — confirm or rename) -->
