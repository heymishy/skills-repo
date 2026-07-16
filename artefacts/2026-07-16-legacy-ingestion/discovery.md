# Discovery: Legacy Ingestion Pipeline — `/reverse-engineer` → `/modernisation-decompose` → Feature Candidates → `/discovery`

**Status:** Draft — awaiting approval
**Created:** 2026-07-16
**Approved by:** [Name + date — filled in after human review]
**Author:** Claude (agent)

---

## Repo-state grounding (read this first — the actual state of `/reverse-engineer` and `/modernisation-decompose` is materially different from what the prompt assumed)

Per the operator's explicit instruction to confirm actual current state rather than treating "exists" and "is usable end-to-end" as the same thing, both skills were read in full and checked for run history and UI wiring. The findings substantially change this discovery's scope from what was originally framed.

**1. Both skills are fully built, detailed, sophisticated definitions — not stubs or placeholders.** `skills/reverse-engineer/SKILL.md` implements a genuine six-layer extraction methodology (structure scan; explicit business rules; hidden business rules; interface contracts; regulatory/compliance rules; data model/ownership; proprietary logic), with stack-specific reading plans for Spring/Spring Boot Java, Struts 2, IBM ACE/IIB, and COBOL, a four-type pass model (INITIAL/EXTEND/DEEPEN/VERIFY) for multi-session corpus management, confidence ratings ([VERIFIED]/[PROBABLE]/[UNCERTAIN]), disposition assignment (PARITY REQUIRED/MIGRATION CANDIDATE/REVIEW/RETIRE), SaaS-platform-fit assessment, and ten distinct named outputs. `skills/modernisation-decompose/SKILL.md` is similarly complete: a deterministic, priority-ordered boundary-signal detection process with an explicit low-signal escalation path. The originating prompt's framing ("known to exist as SKILL.md definitions but are not yet plugged into the web UI... confirm the actual current state rather than treating exists and is usable end-to-end as the same thing") correctly anticipated a gap, but the gap is narrower than "these might be stubs" — the logic is mature; the gap is entirely in orchestration, UI wiring, and governance-primitive backing (detailed below).

**2. `/modernisation-decompose` already produces almost exactly the Feature-candidate primitive this discovery was asked to newly define.** Its Step 3 writes `artefacts/[system-slug]/candidate-features.md`, with each entry containing `feature-slug`, `problem-statement`, `rule-ids`, `persona`, and `mvp-scope` fields, a `umbrellaMetric: true` YAML frontmatter flag, and an explicit traceability note back to the source `reverse-engineering-report.md` — stated to be "written to be sufficient for direct use in `/discovery` without further manual augmentation." This is a de facto Feature-candidate schema, already implemented as a markdown file — it is not backed by `pipeline-state.json`, has no ADR-003 hash verification, and has no distinct queue/backlog state separate from a real feature slug (see finding 6). This discovery's actual job is closer to *formalizing an existing de facto output as a governed primitive* than designing one from scratch.

**3. Critical, previously-unflagged limitation: `/modernisation-decompose`'s boundary-signal detection is hard-coded to Java only.** Its four boundary signals — Maven module, Spring `@Service`, JPA aggregate root, `@Transactional` span — are explicitly Java/Spring-ecosystem concepts. The file contains an explicit extension-point comment: *"Future versions may add support for: COBOL: program boundary signals... PL/SQL: package boundary signals... .NET: assembly and namespace boundary signals. These are not implemented in the current version."* Since `/reverse-engineer` itself already supports COBOL, Struts 2, and IBM ACE/IIB stacks (per finding 1), there is a real, asymmetric capability gap: `/reverse-engineer` can produce a full corpus for a COBOL system, but `/modernisation-decompose` has **no** implemented heuristic to decompose that corpus into feature candidates — it would immediately hit its own Step 2 low-signal escalation (package-level fallback, manual boundary input, or abort) for any non-Java system. This is a more urgent and more concrete scope question than the prompt's own framing ("single-repo vs multi-repo") — the real open question is single-stack (Java) vs. multi-stack support, and it was not named in the originating prompt at all.

**4. Neither skill uses or references a shared "context-graph" extraction mechanism — because there is no such mechanism to share yet.** As established in the companion product-rollup discovery's own grounding (`artefacts/2026-07-16-product-rollup/discovery.md`), the context-graph primitive is itself unbuilt — `artefacts/2026-07-13-context-graph-primitive/discovery.md` remains at `Status: Clarified — awaiting approval`, with an empty `Approved by` field. `/reverse-engineer`'s six-layer methodology is a mature, prompt-driven manual reading process that predates the context-graph proposal and already functions as the extraction mechanism in current use. The prompt's framing ("likely reusing or extending the deterministic/semantic split from the context-graph primitive... rather than inventing a second extraction mechanism") inverts the actual sequencing: there is one existing mechanism (reverse-engineer's own), and context-graph is the not-yet-approved second one — if anything, a future context-graph implementation should consider whether it can reuse patterns from `/reverse-engineer`'s already-proven approach, not the other way around.

**5. Neither skill has ever been run in this repository.** Confirmed directly: no `reverse-engineering-report.md`, `candidate-features.md`, or `corpus-state.md` exists anywhere under `artefacts/`; zero features in `pipeline-state.json` have `reverseEngineerStatus` set; zero files under `workspace/traces/` reference either skill by name. Both skills are real, but entirely unexercised — this discovery is genuinely greenfield in terms of operational experience, not an extension of a working pipeline.

**6. The web UI has no entry point for legacy ingestion — and the gap is structural, not just a missing button.** Both `reverse-engineer` and `modernisation-decompose` ARE registered in `src/web-ui/routes/journey.js`'s `SLASH_CAPABILITY_MAP` (`limitedOnWebUI: false`, `capabilities: []`), meaning if a chat session were already active for some journey, the slash commands might theoretically be invocable. But there is no way to **start** a legacy-ingestion journey from the UI at all: `handlePostJourney`'s `startSkill` form field accepts exactly two values — `'ideate'` or `'discovery'` — with any other value silently defaulting to `'discovery'` (confirmed at `journey.js` line 333). Beyond the missing UI affordance, there is a deeper structural mismatch: `/reverse-engineer`'s own artefact convention operates on a **system-slug** (`artefacts/[system-slug]/...`), which is a different concept from the **feature-slug** the entire existing journey-creation flow is built around. A legacy-ingestion entry point needs a new slug type and a new session-creation path, not just a third radio button.

**7. Neither skill's SKILL.md mentions multi-repo handling anywhere.** The Q0–Q4 entry-condition process and the six-layer extraction are silently scoped to a single system/codebase today. Confirmed by absence, not by an explicit single-repo statement — worth naming explicitly in this discovery's scope rather than leaving implicit.

**8. `/reverse-engineer` already has partial EA-registry and compliance integration.** Q3 explicitly asks whether to feed extracted application/interface candidates into `/ea-registry` as unverified entries; Q2 reads `context.yml`'s `compliance.frameworks` automatically when present. This is more integration maturity than the prompt's framing implied, and is directly relevant to this discovery's own scope question about ADR-003 hash-verification of LLM-derived semantic content — the regulatory-sensitivity flagging mechanism already exists; hash-verifying its output specifically is the actual open gap.

None of the above blocks this discovery from proceeding. The underlying opportunity (a path from legacy code into the outer-loop backlog) is real, and the two component skills are far more capable than "concepts" — but the actual MVP work is orchestration, UI/slug-model wiring, and formalizing an existing de facto output into a governed primitive, not building extraction or decomposition logic from scratch.

---

## Problem Statement

A legacy codebase cannot be turned into outer-loop backlog input today without an operator manually reverse-engineering intent from code first, then manually drafting a `/discovery` input by hand. `/reverse-engineer` and `/modernisation-decompose` already contain the extraction and decomposition logic to close this gap — including a de facto `candidate-features.md` output already shaped for direct `/discovery` consumption — but neither has ever been run, neither is reachable from the web UI (the UI's journey-creation flow has no concept of a system-slug or a legacy-ingestion starting point), and the resulting `candidate-features.md` entries have no governed backing in `pipeline-state.json` — they exist only as an unstructured markdown file with no queue state, no hash verification, and no way for an operator to see "N candidates are waiting to be triaged" the way the existing dashboard already surfaces feature-level state.

## Who It Affects

- **A platform maintainer or delivery lead inheriting an existing legacy system** (the explicit scenario `/reverse-engineer`'s own Q0 gate anticipates — "Modernisation: this system is being replaced or substantially rewritten") — today has working extraction and decomposition tooling available, but no governed way to see, triage, or track the resulting candidates as first-class backlog items; the tooling's own output currently lands as a bare file, not a tracked entity.
- **An operator working through the web UI (the SaaS-GUI surface)** — has a working "+ New feature" journey-creation flow for `ideate`/`discovery`, but cannot start a legacy-ingestion session at all through that same surface; they would need to invoke `/reverse-engineer` some other way (a CLI/chat-only path) that this discovery needs to name explicitly, since finding 6 shows the UI gap is structural.
- **A future consumer of a Java-based legacy system specifically** benefits from `/modernisation-decompose`'s existing, working boundary-signal detection today; a consumer of a COBOL, Struts 2 + ACE/IIB, or any non-Java legacy system has a fully working `/reverse-engineer` extraction (per finding 1) but no working decomposition step (per finding 3) — this asymmetry needs to be named and its resolution scoped, not silently assumed away.

## Why Now

The two component skills already exist, are already detailed and mature, and have simply never been connected to a real trigger or a real UI entry point, nor formalized into a governed primitive. The gap is not "we need to invent extraction logic" — it is "the extraction and decomposition logic already exists and has sat unexercised, disconnected from both the web UI and from `pipeline-state.json`'s governance model." Closing this now is lower-risk and lower-effort than the originating prompt assumed, since the hardest analytical work (six-layer extraction methodology, boundary-signal priority ordering) is already done — what remains is orchestration and governance wiring, which is exactly the kind of gap this platform's own outer-loop discipline exists to close before it accumulates further (the same category of gap this session's own outer-loop review found and closed for short-track DoD and `workspace/state.json` staleness).

## MVP Scope

1. **A new Feature-candidate primitive**, formalizing `/modernisation-decompose`'s existing `candidate-features.md` output (finding 2) into a governed entity with `pipeline-state.json` backing: a distinct queue/backlog state (e.g. a top-level `featureCandidates[]` array, or a dedicated `candidateStatus` field) so an operator can see how many candidates exist and their disposition (queued / triaged / promoted to a real feature slug / rejected) without opening the raw markdown file. Fields carried over unchanged from the existing schema: `feature-slug`, `problem-statement`, `rule-ids`, `persona`, `mvp-scope`, plus the existing `umbrellaMetric` and traceability-note fields as provenance.
2. **`/reverse-engineer` and `/modernisation-decompose` remain unchanged in their extraction/decomposition logic** — this discovery does not re-scope the six-layer methodology or the Java-specific boundary-signal detection itself. The Java-only limitation (finding 3) is named as an explicit, separately-resolvable scope decision below, not silently absorbed into this MVP's build.
3. **A UI/CLI entry point for starting legacy ingestion**, given the structural gap in finding 6. Given the system-slug vs. feature-slug mismatch, the MVP recommendation is a CLI/chat-invoked path (matching how `/reverse-engineer` already operates today, per finding 5's confirmation that it has genuinely never been run through any interface) rather than attempting to retrofit the existing `handlePostJourney`/`startSkill` UI flow in this same discovery — that retrofit is a larger, separate web-UI change better scoped at `/definition` once this discovery's data model is settled.
4. **Feature candidates land in the new queue state** (item 1) distinct from active feature slugs, until an operator runs `/discovery` against one and it becomes a real, governed feature slug via the same slug-creation mechanism as manual discovery — preserving the legacy-provenance link (the `rule-ids`/traceability-note fields) as a new field on the resulting feature slug's own `pipeline-state.json` entry, not just in the discarded candidate record.
5. **No shortcut through DoR/DoD** — feature candidates promoted to real feature slugs go through the full, unmodified outer loop and inner loop exactly as any other feature, per the prompt's own non-negotiable decision, confirmed compatible with everything found during grounding (nothing in either skill's own logic attempts to bypass a gate).

## Out of Scope

- **The product-level rollup/dashboard work** — separate discovery (`artefacts/2026-07-16-product-rollup/discovery.md`), run first per the operator's own explicit sequencing. That discovery's own Assumptions section flags whether candidate-provenance should become a rollup field; this discovery does not resolve that question, only supplies the provenance field itself.
- **Actual migration/rewrite tooling** — this pipeline produces discovery inputs, not code, unchanged from the originating framing.
- **Automated re-scoring of candidates over time as the legacy repo changes** — one-shot extraction for MVP, unchanged from the originating framing.
- **Closing the Java-only boundary-signal gap in `/modernisation-decompose`** (finding 3) — named explicitly as a real, non-trivial gap, but resolving it (adding COBOL/Struts2/ACE-IIB-aware boundary signals) is a substantial, separately-scoped piece of work in its own right, not an MVP-blocking dependency for formalizing the Feature-candidate primitive itself. A Java-only MVP is honest about its own limitation rather than silently pretending multi-stack support already exists.
- **Retrofitting the existing web-UI journey-creation flow** to add a third `startSkill` option or a system-slug concept (finding 6) — deferred to a follow-on `/definition`/`/ideate` pass per MVP scope item 3's own reasoning.
- **Multi-repo cross-referencing** — given finding 7 confirms neither skill currently handles this at all, and given no evidence exists that a real multi-repo legacy system has been attempted, multi-repo support is deferred as materially harder and unvalidated by any real usage yet, not merely an MVP cut for convenience.

## Assumptions and Risks

[ASSUMPTION] A CLI/chat-invoked entry point for legacy ingestion (MVP scope item 3) is an acceptable interim path, given the structural system-slug vs. feature-slug mismatch found in the web UI (finding 6) — unconfirmed, requires /clarify before scope is locked. If the operator's actual expectation is a UI-reachable legacy-ingestion journey from day one, the web-UI retrofit becomes an MVP-in-scope item rather than a deferred one, materially changing this discovery's own MVP boundary.

[ASSUMPTION] Leaving `/modernisation-decompose`'s Java-only boundary-signal limitation unresolved for MVP (Out of Scope) is acceptable, given the operator's own legacy systems of interest are not yet named — unconfirmed, requires /clarify before scope is locked. If the actual target legacy codebase for this pipeline's first real use is COBOL, Struts 2, or another non-Java stack (all of which `/reverse-engineer` already supports extraction for), this MVP would produce a working corpus with no working decomposition step — a materially incomplete pipeline for that specific case, not a deferred nice-to-have.

**Risk:** The de facto `candidate-features.md` schema (finding 2) was designed and implemented without ADR-003 hash-verification in mind. Retrofitting hash verification onto an existing, working output format carries a real (if likely small) risk of a breaking schema change to `/modernisation-decompose`'s own Step 3 output — this should be scoped carefully at `/definition` rather than assumed to be additive-only.

**Risk:** Because neither skill has ever been run (finding 5), every claim in this discovery about "the logic is mature and complete" is based on reading the SKILL.md instructions, not on observed real-world output quality. The six-layer methodology's actual extraction quality against a real legacy codebase is genuinely unvalidated — this MVP's first real run should be treated as a live validation of the existing skill definitions, not just of the new Feature-candidate primitive being scoped here.

## Directional Success Indicators

**A legacy codebase can be turned into one or more real feature slugs without a person manually drafting a discovery input by hand.** Baseline: 0 — no legacy-to-feature-slug conversion has ever happened in this repository (finding 5 confirms zero run history for either component skill). Target: at least one real legacy system successfully produces N feature candidates, at least one of which is promoted through `/discovery` to a real, DoR-signed-off feature slug. Measured via: direct observation of the first real end-to-end run, recorded in this feature's own `decisions.md` per this repo's own convention for logging real validation outcomes.

**Feature candidates are visible and trackable, not buried in a markdown file.** Baseline: 0% — `candidate-features.md`'s existing entries (whenever first produced) have no `pipeline-state.json` presence today, confirmed directly. Target: 100% of produced feature candidates appear in the new queue state (MVP scope item 1) and are queryable the same way active feature slugs already are via the existing dashboard tooling. Measured via: a scripted check confirming every `candidate-features.md` entry has a corresponding `pipeline-state.json` record.

**The Java-only boundary-signal limitation is a known, visible gap — not a silent one.** Baseline: currently silent — the limitation is documented only as a code comment inside `modernisation-decompose/SKILL.md`, not surfaced anywhere an operator evaluating this pipeline for a non-Java legacy system would see it before starting. Target: the limitation is stated explicitly in this feature's own `decisions.md` and in the Feature-candidate primitive's own documentation, so an operator with a COBOL/Struts2/other legacy system knows before running `/reverse-engineer` that decomposition will hit low-signal escalation. Measured via: direct review of the resulting artefacts at `/definition-of-ready`.

## Constraints

- **ADR-003 (hash verification as the primary audit signal)** — the same standard governing the companion product-rollup discovery applies here: this is "LLM-derived semantic content about code the team doesn't own the history of" (per the originating prompt's own framing), making traceability at least as important here as anywhere else in the platform. Confirmed as a real, existing repo-wide standard (`product/constraints.md` #5).
- **Structural governance preferred over instructional** (`product/constraints.md` #13) — directly relevant to the Feature-candidate queue-state design: whether a candidate has been promoted to a real feature slug should be a structural, CI-checkable fact (does a `pipeline-state.json` feature entry exist referencing this candidate's `rule-ids`/provenance), not merely an instruction telling the agent to remember to update a status field.
- **One question at a time in skill interactions** (`product/constraints.md` #7) — both `/reverse-engineer` and `/modernisation-decompose` already follow this convention (confirmed directly in their own SKILL.md text); any new orchestration/entry-point skill this discovery's MVP produces should match.
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
