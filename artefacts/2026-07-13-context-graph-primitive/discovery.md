# Discovery: Context Graph Primitive — Structural Codebase Context for Outer/Inner Loop

**Status:** Clarified — awaiting approval
**Created:** 2026-07-13
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot

---

## Problem Statement

Outer-loop skills (`/discovery`, `/definition`, `/ideate`) and inner-loop skills (`/implementation-plan`, `/subagent-execution`) currently derive codebase context by having the model read or grep source directly, every session, with no persisted structural memory carried between sessions. Every new session that needs to answer "what touches this," "what layer is this file in," or "what does this module depend on" re-derives that answer from scratch by reading files or running greps — work that was already done, correctly, in a previous session, and is thrown away at session end. This session's own dispatch of `tir-s3`/`tir-s4`/`tir-s7` coding-agent subagents is a live example: each agent independently re-read `user-roles.js`, `identity-links.js`, `auth.js`, and `server.js` to reconstruct the same dependency picture the others had already built, because there is no shared, queryable record of "what does `user-roles.js` export, and who calls it" that persists across agent instances.

**Baseline cost:** `[UNKNOWN BASELINE]` — no existing instrumentation in this repo measures token or wall-clock cost specifically attributable to repeated codebase re-scanning, as distinct from the many other things a session does. `workspace/traces/` records governance-relevant fields (`traceHash`, `standardsInjected`, `watermarkResult`) but not a token/time breakdown by activity type, and `workspace/learnings.md` has no entries quantifying this specific cost. This is a genuine measurement gap, not an estimate withheld for caution — establishing this baseline (e.g. via a sampling instrument on a handful of real sessions) is itself a candidate MVP validation step, not something to fabricate a number for here.

## Who It Affects

Outer-loop and inner-loop consumers have materially different context needs, and conflating them risks building a graph shaped for one that serves the other poorly:

- **Outer-loop consumers (`/discovery`, `/definition`, `/ideate`):** need repo-wide, relationship-level answers — "what touches this," "which existing modules already do something like this," "what architectural layer does a proposed change sit in." These questions are answered once per feature, at low frequency, but each answer today requires broad exploration (the kind of multi-file reading an Explore-type search agent currently does).
- **Inner-loop consumers (`/implementation-plan`, `/subagent-execution`):** need narrow, scoped answers about one task's target file — "what does this specific file import, what calls into it, what's its immediate dependency neighborhood" — so a dispatched coding-agent subagent can be given precisely the files it needs rather than an instruction to "read these four files in full," which is what every coding-agent dispatch in this session's `tir-*` work has had to do by hand.
- **Coding-agent subagents dispatched within a single feature (a sub-case of the inner-loop consumer above):** when multiple stories in one epic are dispatched to separate subagent instances (as `tir-s3`, `tir-s4`, and `tir-s7` were this session), each independently reconstructs the same shared dependency picture of files like `user-roles.js` and `identity-links.js`. A committed graph would let each subagent query rather than re-derive that picture.
- **The assurance/governance side of the pipeline:** less directly affected day-to-day, but a structural graph with fingerprint-based change detection is a plausible input to a *future* staleness or drift check — this discovery does not commit to that connection (see Directional Success Indicators and the corrected framing below), only notes it as a plausible future consumer.

## Why Now

This surfaced directly during this session's beta-readiness-infra and team-identity-roles delivery work: three sibling stories in the same epic (`tir-s3`, `tir-s4`, `tir-s7`) were each dispatched as separate coding-agent subagents and each had to independently re-read the same handful of already-modified files (`user-roles.js`, `identity-links.js`, `server.js`) to reconstruct context another subagent in the same session had already derived. There is no accumulated-pain threshold or regulatory trigger here — this is an efficiency and consistency opportunity noticed in the course of real delivery work, evaluated now because a concrete piece of prior art (Egonex-AI/Understand-Anything) exists that demonstrates the deterministic-plus-semantic-layer approach is viable, giving this discovery something concrete to evaluate against rather than starting from a blank design.

## MVP Scope

The MVP is explicitly split into two sequenced sub-features — the sequencing mirrors how `beta-readiness-infra`'s epics were ordered (infrastructure prerequisite before the consuming capability):

**Sub-feature (a) — Deterministic structural adapter (prerequisite).** A D37-injectable adapter wrapping tree-sitter-based structural extraction (imports, call sites, class/function definitions — reproducible, same input always produces the same output) for this repo's own source tree. Vendored or wrapped the same way this feature area already wraps external services behind adapters (PostHog client, Neon/Upstash connections, the mock LLM gateway in `beta-readiness-infra`) — the deterministic layer itself does not need to be our own code, but every call site consuming it goes through an adapter with a throw-on-unwired stub default, so nothing downstream silently gets a wrong or stale answer if the adapter isn't wired. Output is a committed, incremental JSON artefact (fingerprint-keyed so only changed files are re-processed on each update).

**Sub-feature (b) — `/context-graph` governed skill (semantic layer, depends on (a)).** A new SKILL.md, versioned and hash-verified exactly like every other skill in this pipeline, that consumes sub-feature (a)'s deterministic output and produces the semantic layer: summaries, architectural layer tags, and domain mapping. Per the operator's decision this session, the semantic layer is **re-derived from scratch using this platform's own instruction-authoring conventions** — informed only by knowing what shape of output is needed (summaries, layer tags, domain mapping), not by inspecting Understand-Anything's actual prompts or code. This keeps the IP/governance story clean (no reference implementation to accidentally reproduce) at the cost of more design work than adapting an existing prompting approach would have taken.

**What "smallest thing that validates this is worth building" looks like concretely:** sub-feature (a) running against this repo's own `src/web-ui/` tree, producing a committed graph that at minimum answers "what does file X import" and "what files import file X" correctly for every file in that tree — and one outer-loop or inner-loop skill session (a real `/discovery` or a real coding-agent dispatch) querying that graph instead of re-scanning, with a before/after comparison of what that session needed to read directly. Sub-feature (b) is not required to prove sub-feature (a)'s core hypothesis (that a committed structural graph reduces re-scanning) — it can be validated separately once (a) exists.

## Out of Scope

- **Taking Egonex-AI/Understand-Anything itself as a runtime or build-time dependency.** This is a firm decision, not a scope note pending revisit (see Constraints) — ADR-003 (`product/decisions.md`) makes hash-verified, versioned instruction sets the platform's audit anchor, and consuming another project's ungoverned, unhashed semantic output inside context that feeds a DoR artefact would reopen exactly the traceability gap the assurance gate exists to close.
- **Understand-Anything's dashboard UI, guided tours, and persona-adaptive views.** None of these serve the outer-loop/inner-loop context need this discovery is scoped to solve; they are a different product surface (a human-facing exploration tool) than what's being proposed here (a machine-queryable context source consumed by skills). A separate discovery would be needed to make the case for building an equivalent human-facing exploration surface on top of the graph — not assumed as a natural MVP extension.
- **Any live-sync or IDE-integrated version of the graph.** The MVP is a committed, incremental artefact updated at defined pipeline points (matching how `pipeline-state.json`, `suite.json`, and other governed artefacts in this repo are already updated) — not a background watch process. A background watcher would also risk conflicting with constraint #11 (no persistent agent runtime dependency).
- **Applying the graph to repos other than this one in the MVP.** Multi-repo or cross-project graph support is a natural future direction but is not validated by this MVP, which targets this repo's own source tree only.
- **Automatically feeding graph output into every existing skill's context injection in this pass.** The MVP proves the graph is queryable and useful for at least one real session (see MVP Scope above); wiring it into every outer-loop/inner-loop skill's default context-loading behaviour is follow-on work once the mechanism is proven, not part of this MVP.

## Assumptions and Risks

**Resolved via /clarify (2026-07-13):** A single shared graph schema serves both outer-loop and inner-loop query patterns — a file-level graph with import/call-site/definition edges, where outer-loop queries traverse broadly (N hops from any node) and inner-loop queries traverse narrowly (1 hop from one node). Sub-feature (a) does not need to build two parallel schemas.

**Resolved via /clarify (2026-07-13):** The committed graph artefact fits this repo's existing two-layer governance model (branch-protected baseline + controlled incremental update, the same pattern already used for `suite.json`/`results.tsv`) — fingerprint-triggered incremental regeneration is a controlled update to a committed file, not fundamentally different from how those files are already governed. No new governance mechanism is needed.

**Resolved via /clarify (2026-07-13):** Re-deriving the semantic layer from scratch is an acceptable risk to validate empirically once `/context-graph`'s own stories are written and tested against real files in this repo — not a blocker to locking MVP scope now. If semantic-summary quality falls short of useful, that is addressable within `/context-graph`'s own iteration cycle, not a scope failure of this whole feature.

[ASSUMPTION — OPEN, ROUTE TO /SPIKE] Whether tree-sitter structural extraction can be wrapped behind a D37 adapter without introducing an unapproved persistent-runtime dependency (constraint #11) remains genuinely uncertain — confirmed via /clarify (2026-07-13) that this needs a small spike (vendor a tree-sitter binding, confirm one-shot CLI/library invocation behaviour on this platform/OS, i.e. Windows per this session's environment) before `/definition` locks sub-feature (a)'s implementation approach. This is the one open item this discovery does not resolve — route to `/spike` before `/definition`.

**What could make this not worth building:** if the real baseline cost (once measured, per the Problem Statement's `[UNKNOWN BASELINE]` note) turns out to be small relative to a typical session's total token/time budget, the return on building and maintaining a whole new primitive may not justify the ongoing cost of keeping the graph itself accurate and its generation skill (`/context-graph`) governed and up to date. This should be checked before or during `/benefit-metric`, not assumed away.

## Directional Success Indicators

**Token/time reduction per outer-loop or inner-loop session, once the graph exists.** Baseline: `[UNKNOWN BASELINE]` — no existing measurement distinguishes re-scanning cost from other session activity (see Problem Statement). Target: a measurable reduction in tokens spent re-deriving already-known structural facts (imports, call sites, dependency neighborhoods) for a session that queries the graph versus one that doesn't, measured via a same-task, before/after comparison (e.g. dispatch the same coding-agent task once with graph access and once without, compare token/tool-call counts). This baseline-establishment step is itself part of validating whether this feature is worth building — see the Assumptions and Risks note above.

**Graph correctness and freshness, self-verified.** Baseline: 0% — no such graph exists today. Target: for a defined sample of files in this repo's `src/web-ui/` tree, the graph's recorded imports/call-sites/exports match what a direct read of those files shows, and the fingerprint-based staleness check correctly flags a file as stale immediately after it's modified and correctly clears once the graph is regenerated for that file. Measured via: a test asserting graph-vs-source agreement on the sample set, and a test asserting the fingerprint mechanism flips state correctly around a file edit.

**Note on a previously-considered claim, corrected:** the original framing of this discovery proposed that this feature would close T3M1 Q6 (`stalenessFlag`), described as "an open Phase 3/5 obligation." Direct inspection of `docs/MODEL-RISK.md` (line 119) shows T3M1 Q6 is already wired at the code/schema level ("Y — Wired in p3.2a") — the only remaining gap is that no CI run has ever exercised it with `regulated: true`. Separately, and more importantly, T3M1 Q6's `stalenessFlag` measures a materially different kind of staleness (a SKILL.md instruction's measured quality degrading across 5+ consecutive stories) than what this feature's fingerprint-based check would measure (whether a structural/semantic graph is stale relative to the source files it describes). Per the operator's decision (2026-07-13), this discovery does not claim any connection to T3M1 Q6 — the graph-staleness success indicator above stands on its own.

## Constraints

- **No ungoverned external dependency in the DoR context path.** Carried forward directly from the background framing: consuming Understand-Anything's own semantic output (unhashed, unversioned by this platform's standards) inside context that feeds a DoR artefact is not permitted — this is what makes sub-feature (b) a from-scratch governed skill rather than a wrapper around an external semantic layer.
- **D37 injectable adapter pattern required for the deterministic layer (sub-feature a).** Stub default throws when unwired — no silent empty/null return that could mask a misconfigured or missing structural-extraction tool.
- **Any `/context-graph` SKILL.md addition requires the standard governed-file pipeline story** — discovery through DoR with human-in-the-loop verification, the same pattern already used for the assumption/condition-marker work in `/ideate`. This applies to sub-feature (b) specifically, since it is a new SKILL.md file.
- **No persistent agent runtime dependency (constraint #11, `product/constraints.md`).** The platform must operate on standard CI/CD infrastructure — this shapes how sub-feature (a)'s adapter is invoked (on-demand at defined pipeline points, not as a background watcher).
- **Structural governance preferred over instructional (constraint #13, `product/constraints.md`).** Wherever the CI gate can independently verify a property of the graph (e.g. that a committed graph file matches its declared fingerprint), that check should be a CI gate assertion, not just a SKILL.md instruction reminding the agent to keep it fresh.
- **EA registry check performed, not applicable.** `context.yml` sets `architecture.ea_registry_authoritative: true`, so a blast-radius query was attempted per the discovery skill's Step 0 — but this feature does not name an external system with an EA registry entry (it is an internal platform capability affecting the platform's own outer/inner-loop skills, not a downstream consumer's application), so no blast-radius data applies here. Noted for completeness rather than silently skipped.
- No time or budget constraint identified beyond the above.

## Contributors

- Hamish King — Founder / Operator
- Claude — Agent (drafted this artefact; corrected two factual claims in the original framing against direct codebase inspection — see Directional Success Indicators note and Problem Statement)

## Reviewers

- None yet — solo pass, per this repo's W4 solo-operator posture (`.github/architecture-guardrails.md`)

## Approved By

[Name — Role — Date]

---

## Clarification log

[2026-07-13] Clarified via /clarify:
- Q: Can one shared graph schema serve both outer-loop (repo-wide "what touches this") and inner-loop (scoped "what does this file depend on") queries, or do they need two different graph shapes?
  A: One shared schema — file-level graph with import/call-site/definition edges; outer-loop traverses broadly, inner-loop traverses narrowly from one node.
- Q: Can tree-sitter structural extraction be wrapped behind a D37 adapter without becoming a persistent-runtime dependency (constraint #11)?
  A: Genuinely uncertain — needs a `/spike` before `/definition` locks this in. Left as the one open item this discovery does not resolve.
- Q: Does the committed graph artefact fit this repo's existing two-layer governance model (branch-protected baseline + controlled incremental update, same as suite.json/results.tsv), or does it need a new mechanism?
  A: Fits the existing model — no new governance mechanism needed.
- Q: Can re-deriving the semantic layer from scratch reach comparable practical quality to a reference-informed approach?
  A: Yes, acceptable to validate empirically once `/context-graph`'s own stories are written and tested — not a blocker to locking MVP scope now.

**One item remains open:** whether tree-sitter extraction can be D37-adapter-wrapped without a persistent-runtime dependency. Route to `/spike` before `/definition` locks sub-feature (a)'s implementation approach — see Assumptions and Risks.

---

**Next step:** Human review and approval → /benefit-metric (recommend running `/spike` on the tree-sitter/D37 feasibility question first, in parallel with or before /benefit-metric)
