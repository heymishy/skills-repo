# Benefit Metric: CLI approach for AI-assisted workflow

<!--
  USAGE: Canonical format for all benefit-metric artefacts produced by the /benefit-metric skill.
  Every metric defined here must be traceable forward to at least one story via the definition skill.
  Every story must trace back to at least one metric here.
  Orphaned metrics (no stories) and orphaned stories (no metric) are pipeline failures.

  To evolve this format: update this file, open a PR, tag product lead + engineering lead.
-->

**Discovery reference:** `artefacts/2026-04-18-cli-approach/discovery.md` (Approved 2026-04-18, craigfo)
**Date defined:** 2026-04-18
**Metric owner:** craigfo (feature owner / CLI maintainer) for M1–M5, MM2, MM3. heymishy (platform maintainer) for MM1 (Spike B2 verdict).

---

## Tier Classification

<!--
  Some initiatives have both product benefits (user value) and meta benefits
  (learning / validation goals for the team or tooling). Define them separately.
  A project can succeed on Tier 2 metrics even if Tier 1 targets are not met —
  but only if this tradeoff was explicit from the start.

  If only one tier applies, delete the other section.
-->

**⚠️ META-BENEFIT FLAG:** Yes

<!-- This feature is explicitly framed as the reference implementation for Spike B2 in phase4-5's five-mechanism matrix (discovery Assumption 8, /clarify Q2 → Q4 pull-back). It tests a hypothesis about tooling (can CLI prompt injection deliver per-invocation fidelity P1–P4 at a level the phase4-5 mechanism selection will commit to for regulated / CI surfaces) alongside delivering consumer-side execution value. Meta-benefit flag is set so the Spike B2 evaluation signal has a distinct lane in /definition, separate from product-outcome metrics. -->

**Tier 3 (compliance / risk-reduction):** Not applicable. `.github/context.yml` has `meta.regulated: false`, `compliance.frameworks: []`. Discovery preserves existing audit signals (ADR-003 hash-at-execution-time, POLICY.md floors) but does not create new compliance obligations. Theme F was pulled back to "informs, not delivers" in /clarify Q4.

---

## Tier 1: Product Metrics (User Value)

### Metric 1 — Skill-as-contract (P1)

| Field | Value |
|-------|-------|
| **What we measure** | Proportion of CLI-executed skill invocations where (a) envelope-build hash verification correctly classifies the skill body (pass on match, abort on deliberate tampering); (b) returned artefact satisfies the declared per-node output contract (shape check against the workflow declaration). Measured as two sub-rates: `hash-classification-correct%` and `output-shape-valid%`. |
| **Baseline** | Not yet established — CLI does not exist. Current platform state: no envelope-build hash classification; skill-fidelity is instructional only (winging-it evidence from phase4-5 §Problem 2). Baseline measured at MVP first-run as "0% demonstrable in current state". |
| **Target** | 100% on both sub-rates over the MVP test harness. Zero false positives (valid skill rejected by hash). Zero false negatives (tampered skill accepted by hash). Output-shape validation produces an actionable error when shape fails. |
| **Minimum validation signal** | ≥95% on either sub-rate across 50 consecutive invocations on the MVP harness. Below that, there is a design flaw in envelope-build or shape validation — stop and reshape. |
| **Measurement method** | Integration test harness in the CLI repo. Run by CLI maintainer on every release and on consumer-reported incidents. Harness includes deliberate-tampering test cases and deliberate-shape-mismatch cases. |
| **Feedback loop** | If sub-rate drops below 95%: CLI release blocked; open a story to diagnose. If rate is 95–99% but below target: CLI release conditional on a regression-test addition for the failure case. Feature owner decides. |

### Metric 2 — Active context injection (P2)

| Field | Value |
|-------|-------|
| **What we measure** | Proportion of skill invocations where the CLI envelope is the structural context path (skill content + standards + prior artefacts + target path + shape expectations all traceable to platform-assembled envelope, not to ambient operator-session context). Measured via trace-field presence + off-envelope distinguishability test. |
| **Baseline** | Not yet established. Current platform state (chat-native progressive skill disclosure): context assembly is operator-mediated; no envelope boundary exists. |
| **Target** | 100% of Mode 1 invocations produce an envelope structurally before handoff; 100% of traces record the assembled context. Caveat (Risk 5 in discovery): Mode 1 constraint envelope is declarative-only — agent-side ambient-context leak is not structurally prevented. Target is structural completeness, not leak-proof-ness. |
| **Minimum validation signal** | 100% envelope-produced-before-handoff rate (binary — any invocation without an envelope is a P2 break). |
| **Measurement method** | Trace validator in the CLI test suite. Run by CLI maintainer on every release. Off-envelope distinguishability test: deliberately run a skill outside the CLI envelope and verify the trace records the absence or the operator cannot advance state. |
| **Feedback loop** | Any invocation without an envelope blocks release. Ambient-leak observed (not prevented): log as residual risk; carry forward to Mode 2 discovery where the constraint envelope can be runtime-enforced. |

### Metric 3 — Per-invocation trace anchoring (P3)

| Field | Value |
|-------|-------|
| **What we measure** | (a) `trace-emission%` — proportion of CLI transitions (`advance`, `back`, `navigate`) that emit a trace entry containing skill hash, input hash, output reference, transition taken, workflow-declaration hash, timestamp, and optional `executorIdentity`. (b) `gate-reverification%` — proportion of CLI-emitted traces accepted by existing `assurance-gate.yml` re-verification on PR without requiring a new parallel gate. (c) `hash-matching-across-runs%` — proportion of same-skill-same-workflow run pairs producing identical skill-body hashes in trace. |
| **Baseline** | Not yet established. Platform traces today are gate-emitted, not CLI-emitted — no CLI-side entries exist. Target baseline measured at MVP first-run. |
| **Target** | (a) 100% emission; (b) 100% re-verification without parallel gate modification; (c) 100% hash match across identical runs. |
| **Minimum validation signal** | (a) ≥98%; (b) ≥95% (below that, schema alignment is a workstream, not an incremental fix — reshape Assumption A2); (c) 100% (anything below 100% on (c) breaks ADR-003's primary audit signal — stop, not minimum-pass). |
| **Measurement method** | Trace validator + CI assurance-gate logs. Measured by CLI maintainer on every release and by platform maintainer post-PR-merge. |
| **Feedback loop** | (a) <98%: CLI release blocked on missing-transition diagnosis. (b) <95%: Assumption A2 re-runs; /clarify re-invoked on schema-alignment scope. (c) <100%: halt — this is a hard failure against ADR-003. |

### Metric 4 — Interaction mediation (P4)

| Field | Value |
|-------|-------|
| **What we measure** | For skills in the MVP workflow that prescribe per-exchange mediation ("ask one question, wait for answer"), the proportion of invocations where the envelope permitted exactly one exchange per invocation — not an agent-authored complete artefact from a batched prompt. Observable via trace inspection (does the trace show one exchange per node, or a batched multi-exchange artefact?). |
| **Baseline** | Not yet established. Current platform state: winging-it failure mode observed and documented (phase4-5 §Problem 2). Batched multi-exchange artefacts can pass schema validation today. |
| **Target** | 100% of invocations for per-exchange-prescribed skills show exactly one exchange per invocation in trace. Zero traces showing batched-artefact production for skills that prescribe per-exchange. |
| **Minimum validation signal** | ≥95% across the MVP test harness. Below that, P4 mediation is convention rather than structure — reshape the envelope-construction logic. |
| **Measurement method** | Trace inspection by CLI maintainer + periodic consumer audit. MVP workflow must include at least one skill that prescribes per-exchange mediation (e.g. /discovery's conversational pattern) for this metric to be measurable. |
| **Feedback loop** | <95%: diagnose whether the envelope permits batching (envelope-construction bug) or whether operator can bypass mediation (Mode 1 declarative-only caveat — carry as residual risk). Feature owner + platform maintainer review. |

### Metric 5 — Non-fork adoption

| Field | Value |
|-------|-------|
| **What we measure** | Proportion of consumers who complete the MVP flow (from `init` through one outer-loop step, plus one `upgrade` cycle for bonus) without performing a `git clone` + commit of the skills repository into their consumer repo. Consumer repository contains only the sidecar (`.skills-repo/` or equivalent) + lockfile + feature artefacts — no copies of SKILL.md / POLICY.md / standards files. |
| **Baseline** | Current platform adoption (pre-CLI): forking is the observed pattern. Specifically documented in phase4-5 §1a — consumers fork because they must, not because they want to. Baseline = 0% non-fork adoption under the current distribution model. |
| **Target** | 100% of MVP consumers adopt without forking. (Non-fork adoption is the feature's signature property per `product/constraints.md` §1.) |
| **Minimum validation signal** | ≥1 real consumer completes the MVP flow without forking (existence proof, not aggregate statistics — at MVP scale, one real case is sufficient validation). |
| **Measurement method** | Consumer-reported adoption path + CLI maintainer review of the consumer repo structure (look for absent SKILL.md copies, present lockfile, present sidecar). Measured at each consumer adoption event. |
| **Feedback loop** | If ≥1 consumer forks anyway during MVP: diagnose whether the adoption path was unclear (docs / `init` UX gap) or whether a structural property pushed them to fork (then reshape the sidecar model). First-fork incident reopens Theme B sub-problem 1a scope. |

---

## Tier 2: Meta Metrics (Learning / Validation)

<!--
  Use this section when the initiative also tests a hypothesis about process,
  tooling, or team capability. Common in early-stage agentic tooling rollouts.
-->

### Meta Metric 1 — Spike B2 viability verdict

| Field | Value |
|-------|-------|
| **Hypothesis** | CLI prompt injection is a viable enforcement mechanism for the regulated / CI surface class, delivering per-invocation fidelity (P1–P4) at a level phase4-5's mechanism selection will commit to (as mechanism 1 of 5, not necessarily the only one). |
| **What we measure** | Spike B2's published verdict, one of: **PROCEED** (CLI is committed for its surface class); **REDESIGN** (viable but structural reshape required); **DEFER** (insufficient evidence — re-run); **REJECT** (mechanism unfit). Verdict appears in the Spike B2 output artefact + phase4-5 mechanism-selection ADR. |
| **Baseline** | Not yet established — Spike B2 has not run. |
| **Target** | PROCEED or REDESIGN. |
| **Minimum signal** | DEFER with a clear reshape direction (the feature is a reference implementation — a "need more evidence" verdict is a valid outer-loop outcome). REJECT would invalidate this feature's framing entirely. |
| **Measurement method** | Spike B2 output artefact (produced by heymishy / platform maintainer per phase4-5). Measured once at Spike B2 completion. |

### Meta Metric 2 — Workflow portability across runtimes

| Field | Value |
|-------|-------|
| **Hypothesis** | Graph-declared workflows execute comparably across different runtimes (CLI + chat-native harness), validating the workflow-as-first-class-declaration claim. A second runtime consuming the same declaration produces traces structurally comparable to the CLI's. |
| **What we measure** | (a) For the MVP workflow declaration, `non-linear-scenario-success%` — does the CLI execute the graph faithfully under operator-driven non-linear navigation (advance, back, navigate across branches)? (b) Cross-runtime trace comparability — does a chat-native harness (Copilot Chat consuming the same declaration) produce a trace whose skill-body hashes match the CLI's for the same skill content? |
| **Baseline** | Not yet established. Current platform: single-runtime execution only (chat-native, progressive skill disclosure). No second runtime consumes workflow declarations today. |
| **Target** | (a) 100% of non-linear-navigation scenarios in the MVP test harness execute as declared. (b) At least one demonstrated hash-equivalent trace pair (CLI + chat-native) from the same declaration, where skill-body hashes match even though runtime-specific trace fields differ. |
| **Minimum signal** | (a) ≥90% — below that, the graph-model implementation has a gap that reopens Q5 (workflow-declaration-as-contract) structurally. (b) Cross-runtime comparability demonstrated even if full hash-equivalence is not reached (mechanism-specific fields not violating the portability claim). |
| **Measurement method** | Integration test harness for (a); cross-runtime comparison exercise at MVP completion for (b). Run by CLI maintainer + chat-native harness owner. |

### Meta Metric 3 — Coreutils sharpness discipline

| Field | Value |
|-------|-------|
| **Hypothesis** | The "small sharp commands, no reasoning tools" discipline (Unix-violation guardrail) holds under contribution pressure over six months post-MVP. |
| **What we measure** | At six-month review, each CLI command audited against the Unix-violation criterion: does the command do one deterministic procedural thing, or has it accreted reasoning behaviour? Boolean per command; aggregate `commands-still-sharp%`. |
| **Baseline** | MVP launch state: 9 commands (`init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emit-trace`), all deterministic. 100% sharp at launch. |
| **Target** | 100% at six-month review — no command has accreted reasoning. |
| **Minimum signal** | ≤1 command found to have drifted AND it is rolled back or refactored within one release cycle of the discovery finding. Drift of >1 command without rollback triggers a Unix-violation retrospective: review contribution model and guardrails. |
| **Measurement method** | CLI maintainer audit at 6 months post-MVP, repeated at 12 months. Audit criteria documented in `CONTRIBUTING.md` (or equivalent) for the CLI repo. |

---

## Metric Coverage Matrix

<!--
  Populated by the /definition skill after stories are created.
  Every metric must have at least one story. Every story must reference at least one metric.
  Gaps here are pipeline failures — surface them before coding begins.
-->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Skill-as-contract (P1) | _[to be populated at /definition]_ | Gap — awaiting /definition |
| M2 — Active context injection (P2) | _[to be populated at /definition]_ | Gap — awaiting /definition |
| M3 — Per-invocation trace anchoring (P3) | _[to be populated at /definition]_ | Gap — awaiting /definition |
| M4 — Interaction mediation (P4) | _[to be populated at /definition]_ | Gap — awaiting /definition |
| M5 — Non-fork adoption | _[to be populated at /definition]_ | Gap — awaiting /definition |
| MM1 — Spike B2 viability verdict | _[to be populated at /definition]_ | Gap — awaiting /definition |
| MM2 — Workflow portability | _[to be populated at /definition]_ | Gap — awaiting /definition |
| MM3 — Coreutils sharpness discipline | _[to be populated at /definition]_ | Gap — awaiting /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts.
- Implementation approach — that is the /definition and spec skills.
- Sprint targets or velocity — these metrics are outcome-based, not output-based.
