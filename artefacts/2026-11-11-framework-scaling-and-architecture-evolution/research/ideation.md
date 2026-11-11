# Ideation Artefact

**Feature:** 2026-11-11-framework-scaling-and-architecture-evolution
**Date:** 2026-11-11
**Artefact path:** `artefacts/2026-11-11-framework-scaling-and-architecture-evolution/research/ideation.md`
**Lenses run:** D, A, B
**Pipeline state signal:** defer (D → originally PROCEED on a narrowed scope; B's own data-proxy check then falsified the one assumption that scope depended on — see "Data-proxy check result" under Lens B. Revised conclusion: do not write the LangGraph POC. The two schema-drift bugs are fixed directly (PR #1071); the sequencing-enforcement gap found during the check is a small, separate, direct fix, logged below and in `decisions.md`.)

---

## Context loaded

| Artefact | Status at time of ideation |
|----------|--------------------------|
| discovery.md | not yet written — this is a pre-discovery ideation session |
| benefit-metric.md | not yet written |
| Stories | none yet |
| Reference materials | none filed; grounded instead in (a) a live, multi-turn discussion this session assessing LangGraph/Aegra, inner-loop container scaling, and web-ui/framework complexity, and (b) real repo evidence gathered during that discussion (server boot log, `products.js` line-number citations, `npm audit` results) |

**Directly relevant prior art found and used as grounding:** `artefacts/2026-07-11-pipeline-conflict-reduction` (`pcr-s1`, DoD-complete, PR #455) — a short-track story that already solved three of the exact merge-conflict hotspots relevant to this session's "inner-loop container scaling" thread: the `package.json` test-chain conflict (fixed by `scripts/run-all-tests.js`), the `.github/pipeline-state.json` feature-level `updatedAt` collision (fixed in `src/enforcement/cli-advance.js` by splitting `feature.<field>=` writes from story-scoped writes), and `decisions.md`'s merge conflicts (fixed via `.gitattributes`' `merge=union` strategy). This is treated as load-bearing evidence below, not a hypothetical.

---

## Lens D — Product strategy framing

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|----------|--------|-----------|
| What problem will this solve? | As the Skills Platform scales to more parallel stories/features per tranche and the codebase/pipeline-state schema itself grows (185+ stories and counting per the live landing page), three distinct frictions are emerging: (1) hand-rolled pipeline-state/governance enforcement can silently drift from its own documented conventions — confirmed live this session, where my own consolidation scripts bumped `feature.updatedAt` unconditionally, reintroducing the exact anti-pattern `pcr-s1` already fixed in the sanctioned `bin/skills advance` path, because a scratchpad script bypassed it; (2) running many stories' inner loops in parallel (git-worktree forks, this session: 5 then 7 concurrently) hits real scaling ceilings — host resource contention, GitHub Actions deploy-group concurrency eviction, and the orchestrating agent's own LLM rate limits; (3) the web-ui/application layer (`products.js`, 35+ individually hand-wired D37 adapters, 20+ per-table migration functions run at every boot, several currently failing) is accumulating ordinary software complexity independent of either of the above. | Strong — all three are evidenced from this session's own direct observations, not speculation. |
| For whom? | Primarily the platform owner/maintainer (Hamish, in the operator role) — these are internal engineering-velocity and reliability problems, not end-user-facing features. Secondarily, any future contributor to this repo who inherits the inner-loop tooling or the web-ui codebase. | Strong. |
| How will we measure success? | Not yet defined formally (no benefit-metric exists for this initiative). Candidate signals per thread: (1) governance-drift incidents per tranche (e.g. schema fields silently unpopulated, conventions bypassed) trending toward zero; (2) wall-clock and manual-intervention cost per parallel wave of N stories; (3) `products.js` line count / adapter-registration boilerplate lines trending down, migration-failure count at boot trending to zero. | Weak — real but unmeasured; would need a real metric artefact if any of the three threads proceeds to `/discovery`. |
| What alternatives exist today? | For (1): the existing mitigation is "remember to use `bin/skills advance`/`gate-advance`, not raw scratchpad writes" — a documentation/discipline fix, not a structural one, and it was still bypassed this session despite being explicitly in CLAUDE.md's own `cdg.6`/`cdg.7` rules. For (2): the existing mitigation is manual, operator-driven dependency-graph sequencing (done by hand this session) plus `pcr-s1`'s already-shipped fixes for the three known hotspot files. For (3): no current mitigation — the complexity is simply accumulating. | Strong — all three "alternatives" are real, already-observed, already partially-inadequate mitigations, not guesses. |
| Why are we best suited? | This is an internal-tooling decision with no external competitive dimension — "best suited" reduces to "does the maintainer have the bandwidth and is the existing architecture close enough to adapt incrementally." The existing `gate-map.js` / `pipeline-state.schema.json` / `bin/skills advance` machinery is structurally close to what a typed-state-graph framework provides, which lowers the cost of a narrowly-scoped migration for thread (1) specifically. | Strong for (1); N/A framing for (2)/(3), which are conventional engineering problems with no "are we best suited" question to ask. |
| Why now? | 185+ stories and growing, confirmed live on the production landing page; this session alone surfaced two independent, real schema-drift bugs (`testPlan.artefact` never populated by `/test-plan`, `metrics[].contributingStories` never populated by `/benefit-metric`) that only got caught by downstream CI/DoD checks, sometimes a full tranche late. The failure mode is already occurring, not hypothetical — the "why now" is that the cost of *not* addressing thread (1) is compounding with every new skill/story, and was large enough to produce two distinct real bugs in a single session. | Strong for (1). For (2) and (3), "why now" is weaker — real friction was observed this session under an unusually large parallel-wave load (12 stories across two waves), but there's no evidence yet that this load is typical rather than a one-off burst. |
| How will we reach customers? | N/A in the traditional sense (internal tooling, no go-to-market). The "channel" is simply: the maintainer adopts the change in their own workflow, and it either reduces friction or it doesn't. | N/A. |
| What does the MVP need to do to earn trust? | For thread (1) specifically: a narrowly-scoped POC — model the inner loop's own gate sequence (`branch-setup → implementation-plan → verify-completion → branch-complete`) as a small typed-state graph with a schema matching `pipeline-state.json`'s real shape, and check empirically whether it would have caught the `testPlan.artefact` and `contributingStories` gaps *at the point of writing*, not three stories later in CI. If it would have, that's a concrete, falsifiable signal the approach is worth expanding. If it wouldn't (e.g. because the gap was in which *skill* wrote the field, not in schema validation itself), that's equally valuable — it means the real fix is elsewhere (better skill-contract tests, not a graph framework) and the POC should stop there. | Strong — this MVP bar is specific and falsifiable, not vague. |
| What are the critical risk factors? | **Desirability/habit risk:** the maintainer already has a working (if imperfect) hand-rolled system; a framework migration competes with just fixing the two known bugs directly (add the missing fields to the two skills' State-update sections — a five-minute fix that doesn't require any new technology). **Feasibility risk:** `gate-map.js`/`pipeline-state.schema.json` encode a large amount of domain-specific governance logic (D37, H-DESIGN, H-GOV, H1–H13) that a generic graph framework does not provide for free — any port has to carry that logic across, not just the control-flow shape. **Scope risk (specific to this session's own framing):** the three threads are easy to conflate, as the original prompt did ("web ui and framework") — treating thread (3) as if LangGraph could address it would waste the POC's signal on the wrong problem. | Medium-high on feasibility/scope-conflation; low on desirability once the scope is narrowed, since the POC is cheap and the status quo bug is already proven to recur. |

### Recommendation

> **PROCEED — but only on a narrowed scope, and only after the cheap fix is tried first.**
>
> Rationale: Thread (3) (web-ui/application complexity) is **not** a LangGraph-shaped problem at all and should be pursued, if at all, as ordinary refactoring work (split `products.js`, consolidate the D37 adapter-wiring pattern, fix the migrate-on-every-boot pattern) — fully independent of this initiative. Thread (2) (inner-loop container scaling) is real but its dominant costs this session (GitHub Actions deploy-group concurrency, LLM rate limits, cross-story file-conflict sequencing) are not primarily solved by containerization or by LangGraph/Aegra — they need a dependency-graph-aware scheduler, which is a narrower and more tractable build than either. Thread (1) (pipeline-state/governance drift) is the one place a typed-state-graph framework maps cleanly onto an already-recurring, already-costly failure mode — but even there, the two concrete bugs found this session are fixable in minutes by just adding the two missing fields to the two skills' State-update sections, which should happen regardless of any framework decision and would itself remove the most urgent pressure. The POC, if run, should be scoped exactly as described above (one small graph modeling the inner loop's gate sequence, tested against the two real historical bugs) — not a platform-wide adoption decision.

---

## Lens A — Opportunity map

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

> Reduce the rate at which the pipeline's own governance/state conventions silently drift from what the skills actually do, and reduce the operator/agent time cost of running many stories' inner loops in parallel — without taking on unscoped complexity (e.g. a hosted-SaaS pivot, or treating ordinary web-app refactoring as an agent-orchestration problem).

### Opportunity tree

```
Outcome: Reduce governance drift and parallel-wave friction, without unscoped complexity growth

├── Cluster 1: Pipeline-state / governance drift
│   ├── Unmet need: a write path that cannot silently omit a schema-required field
│   │   (evidence: testPlan.artefact and metrics[].contributingStories both went
│   │   unpopulated this session, caught only by downstream CI/DoD checks)
│   ├── Pain point: the "correct" write path (bin/skills advance / gate-advance)
│   │   is bypassable by any scratchpad script, and was bypassed this session
│   │   by the orchestrating agent itself, re-introducing a bug pcr-s1 already fixed
│   └── Desire: a visual/inspectable representation of the pipeline's actual state
│       machine, instead of reconstructing it from CLAUDE.md's prose table + cross-
│       referenced "Follows/Precedes" lines in each SKILL.md
│
├── Cluster 2: Parallel-wave inner-loop scaling
│   ├── Pain point: GitHub Actions' own deploy-group concurrency lock evicted
│   │   E2E jobs repeatedly this session across both Wave 1 and Wave 2, requiring
│   │   manual reruns and, twice, a close/reopen or forced-new-commit workaround
│   │   for a stuck startup_failure (zero jobs ever created) state
│   ├── Pain point: cross-story file conflicts (urpv-s2/urpv-s3 both touching
│   │   product-rollup.js; itar-s2/ddft-s1 both touching incident-store.js) required
│   │   manual dependency-graph reading and either sequencing or careful collision-
│   │   aware dispatch instructions, done by hand each time
│   └── Pain point: the orchestrating agent's own LLM rate limit was hit repeatedly
│       under concurrent load, requiring manual resume-from-interruption handling
│
└── Cluster 3 (emerging, separate problem — flagged, not pursued here):
    Web-ui/application complexity
    └── Evidence only: 35+ individually hand-wired D37 adapters at server boot,
        20+ per-table migration functions re-run (and several re-failing) on every
        boot, products.js sprawling across 3000+ line references. Real, but not
        an agent-orchestration problem — explicitly out of scope for any
        LangGraph/Aegra-shaped solution; would need its own, separate ideation
        or direct `/discovery` as an ordinary refactoring initiative.
```

### Opportunity prioritisation

| Opportunity | Importance | Current satisfaction | Priority |
|------------|-----------|---------------------|----------|
| Write path that cannot silently omit a schema-required field | High | Low — two real, recent instances found in one session | 🟢 Top |
| Bypassable "correct" write path (`bin/skills advance` optional, not enforced) | Medium | Low — bypassed by the agent itself this session | 🟢 Top |
| Visual/inspectable pipeline state machine | Low | Medium — CLAUDE.md's prose table + SKILL.md cross-references work, just aren't visual | ⚪ Pass |
| GitHub Actions deploy-group concurrency eviction under parallel load | Medium | Low — recurred across both waves this session, needed manual intervention each time | 🟡 Watch |
| Cross-story file-conflict sequencing | Medium | Medium — solvable by hand (done successfully this session) but doesn't scale past a human doing the dependency-graph reading each time | 🟡 Watch |
| Orchestrating agent's own rate-limit handling under concurrent load | Low | Medium — resumable via existing SendMessage-to-resume mechanism, just needs repeated manual intervention | ⚪ Pass |
| Web-ui/application complexity (Cluster 3) | High (as its own problem) | Low | 🟡 Watch — but explicitly a *different* initiative, not this one |

### Top opportunity — seed solutions

> **Opportunity:** A write path that cannot silently omit a schema-required field (Cluster 1, top priority)

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|--------------------|--------------------------|--------------------|
| Fix the two known bugs directly (add `testPlan.artefact` to `/test-plan`'s State-update, `metrics[].contributingStories` to `/benefit-metric`'s State-update) | Removes the two specific, already-proven failure instances immediately | High — minutes of work, no new technology, should happen regardless of any other decision |
| Narrow LangGraph POC: model the inner loop's gate sequence as a small typed-state graph, schema matching `pipeline-state.json`'s real shape; test against the two real historical bugs | Tests whether schema-level enforcement (construction-time failure) would have caught what CI only caught after the fact | Medium — real framework-adoption cost even at this narrow scope; genuinely answers the strategic question rather than assuming it |
| Make `bin/skills advance`/`gate-advance` the *only* way to write `pipeline-state.json` (e.g. a pre-commit hook or CI check that flags any diff to that file not produced via the CLI) | Closes the "bypassable by scratchpad script" gap without adopting any new framework | High — cheap, uses existing tooling patterns already in this repo (pre-commit hooks, assurance-gate CI check) |

---

## Lens B — Assumption inventory

*Framework: Teresa Torres — assumption mapping*

### Assumptions extracted

| Assumption | Type | Risk if wrong | Known-ness | Priority |
|-----------|------|--------------|------------|----------|
| `gate-map.js`'s domain-specific governance logic (D37, H-DESIGN, H-GOV, H1–H13) can be carried across to a typed-state-graph model without losing fidelity — it's "structurally close" to a graph's node/edge/state shape | Feasibility | High — if this is wrong, the whole premise that a narrow POC is cheap collapses; the real cost would be in re-implementing dozens of hand-specific checks, not in the graph's control-flow shape, which is the opposite of what the recommendation assumes | Guess — asserted by pattern-matching in this ideation, never confirmed by actually reading `gate-map.js` against LangGraph's real `StateSchema`/conditional-edge API | 🔴 Test first |
| Parallel-wave load of this session's scale (12 stories across 2 waves) is typical going forward, not a one-off burst | Viability | Medium — drives whether Cluster 2 (scheduler work) is worth any investment at all; already flagged as an open question in Lens D/A, now formalised here | Guess — one data point (this session) | 🟡 Test before build |
| Fixing the two known schema-drift bugs removes the *most urgent* pressure, even though it doesn't make the pipeline schema-enforced in general | Desirability | Low-medium — if wrong (more undiscovered drift bugs exist beyond these two), the fix is still correct, just insufficient on its own; doesn't invalidate the recommendation, only its completeness | Guess — found incidentally during active work this session, not via a systematic audit of every skill's State-update section | 🟡 Test before build |
| A pre-commit hook or CI check making `bin/skills advance`/`gate-advance` the *only* write path for `pipeline-state.json` won't conflict with CLAUDE.md's own explicitly-sanctioned "bulk repairs via an explicitly named one-off script" exception (`cdg.6`) — the same exception class this session's own bypass fell under | Feasibility | Medium — if wrong, the cheapest-looking seeded solution (Lens A, solution 3) either has to carve out the same exception that caused the original bug, or becomes more friction than it's worth | Inference — reasoned directly from CLAUDE.md's own stated exception text, not yet tested against a real enforcement implementation | 🟡 Test before build |
| The narrow POC (model the inner loop's gate sequence as a typed-state graph, test against the two real historical bugs) will produce a clean, legible pass/fail signal rather than an ambiguous one | Feasibility | Medium — if the result is ambiguous (e.g. "would have caught it only if implemented a specific way"), the POC doesn't actually resolve the strategic question it was scoped to answer | Inference — reasoned from how typed schemas generally behave, not yet tested | 🟡 Test before build |
| The maintainer will have the bandwidth to actually run the POC and evaluate it against its own stated falsifiable bar, rather than defaulting to the familiar hand-rolled system out of inertia regardless of the result | Desirability | Low — worst case, nothing changes; no harm done to a non-mission-critical internal tool | Guess | 🟢 Accept |

---ASSUMPTION-JSON: {"id":"gate-logic-portable","text":"gate-map.js's domain-specific governance logic can be carried across to a typed-state-graph model without losing fidelity.","type":"feasibility","risk":"high","knowness":"unknown-unknown"}---

---ASSUMPTION-JSON: {"id":"parallel-load-typical","text":"Parallel-wave load of 12 stories across 2 waves is typical going forward, not a one-off burst.","type":"viability","risk":"medium","knowness":"unknown-unknown"}---

---ASSUMPTION-JSON: {"id":"two-bugs-sufficient","text":"Fixing the two known schema-drift bugs removes the most urgent governance-drift pressure.","type":"desirability","risk":"low","knowness":"unknown-unknown"}---

---ASSUMPTION-JSON: {"id":"enforcement-no-conflict","text":"A bin/skills advance-only enforcement mechanism will not conflict with CLAUDE.md's own sanctioned bulk-repair exception.","type":"feasibility","risk":"medium","knowness":"known-unknown"}---

---ASSUMPTION-JSON: {"id":"poc-signal-clean","text":"The narrow LangGraph POC will produce a clean pass/fail signal rather than an ambiguous one.","type":"feasibility","risk":"medium","knowness":"known-unknown"}---

---ASSUMPTION-JSON: {"id":"maintainer-follow-through","text":"The maintainer will have bandwidth to run and objectively evaluate the POC.","type":"desirability","risk":"low","knowness":"unknown-unknown"}---

### Test designs (for 🔴 assumptions)

**Assumption:** `gate-map.js`'s domain-specific governance logic can be carried across to a typed-state-graph model without losing fidelity.

| Test approach | Description | What we'd observe if true | What we'd observe if false |
|--------------|-------------|--------------------------|---------------------------|
| Data proxy (cheapest, do this first) | Read `src/enforcement/gate-map.js` in full alongside LangGraph's real `StateSchema` / conditional-edge / interrupt API docs (already fetched once this session — re-fetch for the specifics, not just the headline capabilities). Map each of the 7 gate values and 2–3 representative hard blocks (e.g. `H-DESIGN`, `H-GOV`) onto LangGraph primitives by hand, on paper, before writing any code. | A 1:1 or near-1:1 mapping exists for most gates/blocks — the port is mostly mechanical translation | Several gates/blocks need genuinely new logic outside what LangGraph's primitives express natively (e.g. a check that reads a *different file* than the graph's own state, like `scripts/check-design-tokens.js` scanning arbitrary source files) — meaning the POC's "narrow scope" was itself underestimating the real surface area |
| Prototype test | If the data-proxy check comes back favourable, write the actual narrow POC as originally scoped and see whether `H-GOV`'s four-case branch (`AC1`–`AC5` in `definition-of-ready/SKILL.md`) ports cleanly | The POC's state graph expresses the same four cases without needing escape-hatch custom code outside the graph | The POC needs a large "custom Python/JS function called from a node" escape hatch for most real blocks — meaning the graph is just a thin wrapper, not a real replacement |
| Interview (n/a — no external customer) | Not applicable — this is a solo-maintainer internal decision, not a customer-validated one | — | — |

**Decision:** Run the data-proxy check (cheap, ~1 hour) before writing any POC code at all. If it comes back favourable, proceed exactly as Lens D's MVP bar describes. If it comes back unfavourable, stop — the two known bugs still get fixed directly (that part of the recommendation doesn't depend on this test), but the POC itself is not worth writing, and this should be logged as a `/decisions` entry on whichever future artefact this ideation feeds, not silently dropped.

### Data-proxy check result (2026-11-11)

**Outcome: unfavourable for the broader port — assumption `gate-logic-portable` is FALSE as stated, with a sharper finding underneath.**

Read `src/enforcement/gate-map.js` in full (13 lines — a frozen lookup table mapping 7 stage names to themselves; not itself the validation logic) and `src/enforcement/cli-outer-loop.js`'s real `validate()` dispatcher plus two representative gate-validators (`validateTestPlanComplete`, the `dor-signed-off`/H1–H9 embedded-scan fall-through).

**Finding 1 — most of the governance logic is markdown-prose parsing, not typed-state validation.** `validateTestPlanComplete` reads a test-plan `.md` file, regexes out a `**Story reference:**` header line, reads *that* file, regexes every `**AC(\d+):**` marker out of it, and cross-checks each appears in the test plan too. The H1–H9 fall-through does the equivalent: regex-scanning prose for embedded file references, then checking those files exist on disk and re-scanning their own headers. None of this is "does this state object conform to a schema" — it is "does this free-form document correctly reference that free-form document." LangGraph's `StateSchema`/typed-state primitives have no bearing on this class of check at all. Porting it would not eliminate the code; it would move the exact same `regex` + `fs.readFileSync` logic behind a node-function call, with real migration cost and no reduction in the surface area the maintainer has to keep correct.

**Finding 2 — a genuine, confirmed structural gap exists, but it is unrelated to the prose-parsing logic and does not require LangGraph to fix.** `validate()` checks each gate's artefact against that gate's own rules in total isolation — there is no check anywhere in this dispatcher (confirmed by grep: no `previousGate`/ordering/sequence logic exists) that a story's current `stage` is actually at the expected predecessor before allowing a gate call. Nothing today would stop calling `gate-advance ... definition-of-done ...` before `test-plan-complete` has ever run for that story. This is exactly the shape of problem a graph's conditional edges solve natively — but it is also a handful of lines (an expected-predecessor map checked against `story.stage` before calling `validate()` in `cli-gate-advance.js`) to fix directly, with no framework adoption needed.

**Revised conclusion: do not write the LangGraph POC.** The one real structural gap found is cheaper to fix directly than to use as justification for a framework migration; the rest of the governance logic is prose-parsing that porting to LangGraph would not meaningfully simplify — it would add migration cost while leaving the actual complexity (the regex/cross-reference rules themselves) exactly where it is today, just relocated. This assumption test is the main decision driver of this whole ideation, and it resolved cleanly in one read-through — no further investigation needed before closing this thread.

**New, smaller finding worth its own follow-up:** the sequencing-enforcement gap (Finding 2) is real and worth a short, direct fix on its own — independent of anything else in this ideation. **Fixed 2026-11-11** — see `decisions.md`'s ARCH entry; `src/enforcement/cli-gate-advance.js` now checks each of the 4 story-scoped late gates' real predecessor condition (taken from each downstream skill's own documented entry condition, not guessed from `story.stage`) before calling `validate()`. TDD-verified: 4 new failing tests (T15–T18 in `tests/check-cdg7-gate-advance.js`) written first and confirmed red against the unfixed code, then green after the fix; 4 pre-existing tests across two test files needed their fixtures updated to satisfy the new precondition, since they predated it and never needed to set `reviewStatus`/`testPlan`/`dorStatus`/`prStatus`.

### Stand-back re-assessment: orchestrating and instrumenting the *whole* pipeline (2026-11-11)

The operator pushed back, correctly, that the data-proxy check above was scoped narrowly to the DoR gate-advance CLI specifically — not the bigger question of whether a native graph/instrumentation capability would benefit the *whole* 9-step outer loop (discovery → benefit-metric → definition → review → test-plan → DoR → inner loop → DoD → trace). Re-examined on its own terms, grounded in real code, not an extension of the narrow finding:

**Orchestration (enforcing the whole 9-step sequence), re-examined:** The whole outer loop has *even less* structural enforcement than the 4 late gates just fixed — it relies almost entirely on an agent reading CLAUDE.md's prose table and each SKILL.md's own "Entry condition" section, with no code anywhere checking that `/definition` was only invoked after `/benefit-metric` actually completed. This is real. But the fix just shipped for the 4 late gates (`checkGateSequencing` in `cli-gate-advance.js`) is the *same shape* of solution this would need at the outer-loop scale too — a predecessor-state check before each transition, in plain JS, no graph framework required. Extending it to the remaining outer-loop transitions (discovery→benefit-metric, benefit-metric→definition, definition→review, review→test-plan) is more of the same pattern just demonstrated to work, not a reason to adopt LangGraph. **Conclusion unchanged from Lens B's original finding: orchestration doesn't need LangGraph.**

**Instrumentation (observability across the whole pipeline), re-examined — and genuinely different from the orchestration question:** Checked directly: `scripts/lib/pipeline-timings.js` (`appendTimingRecord`) is referenced in exactly 5 of 42 skills' State-update sections — all 5 inner-loop skills (`branch-setup`, `implementation-plan`, `subagent-execution`, `verify-completion`, `branch-complete`). **Zero outer-loop skills** (`discovery`, `benefit-metric`, `definition`, `review`, `test-plan`, `definition-of-ready`, `definition-of-done`, `trace`) emit any structured timing record at all. More strikingly: `.github/pipeline-timings.jsonl` **does not exist anywhere in this repository right now** — despite this exact session running dozens of inner-loop skill invocations across 12 stories in two waves, not one real timing record was ever actually written to disk. This is not "sparse telemetry" (the honest framing already used for PostHog's own `stage_completed`/`stage_started` events, which at least exist in small numbers) — it is a documented mechanism, referenced by five separate skills as mandatory, producing zero real output. Combined with the already-known fragmentation (capture-log.md's free-text signal log, PostHog's sparse events, `/trace`'s on-demand-only reporting), the honest picture is four inconsistent, partially-broken instrumentation mechanisms where one coherent one should exist.

**This is where the "native capability" framing has real teeth — but it still doesn't specifically require LangGraph.** Unified, structured tracing of every skill invocation (inputs, duration, outcome, errors) across the whole pipeline is a genuine, currently-unmet need, demonstrated by a real zero-output mechanism, not a hypothetical one. LangSmith (LangChain's tracing product, usually adopted alongside LangGraph) is one legitimate way to get this, but it is adoptable independently of whether the pipeline's own execution model becomes a LangGraph graph — tracing is a cross-cutting concern that can wrap existing skill invocations wherever they run, the same way OpenTelemetry (already namechecked as an Aegra feature during the original research, and a credible lower-commitment alternative here) can. The real decision is not "LangGraph or not" — it is "pick one structured tracing destination and make emitting to it part of every skill's mandatory State-update step, replacing the four fragmented mechanisms," independent of any orchestration-model decision.

**Revised overall verdict:** orchestration — no, the cheap hand-rolled pattern already proven in this session's own fix generalizes fine. Instrumentation — yes, there is a real, now-demonstrated gap, but closing it needs a tracing-destination decision and skill-contract discipline, not a LangGraph/Aegra adoption. Logged as a new, separate candidate initiative below, deliberately decoupled from the (now closed) LangGraph question.

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|--------|-------|-------|
| Strategy framing (Lens D) | `/discovery`, if any thread proceeds | Recommendation is PROCEED on a narrowed scope only; Cluster 3 explicitly deferred to its own separate initiative |
| Opportunity map (Lens A) | `/discovery` for Cluster 1 specifically, if pursued | Three seeded solutions ordered cheapest-and-most-certain first; the two direct bug-fixes should happen independent of any `/discovery` decision |

---

## Open questions

| Question | Blocking? | Owner | How to resolve |
|----------|-----------|-------|---------------|
| Should the two known schema-drift bugs (`testPlan.artefact`, `contributingStories`) be fixed now, directly, outside this ideation's own scope? | No — but recommended regardless of what else proceeds | Operator | A short, direct short-track fix to the two skills' State-update sections; does not need `/discovery` |
| Is parallel-wave load of this session's scale (12 stories across 2 waves) typical going forward, or a one-off burst? | Yes, for Cluster 2 specifically | Operator | Observe over the next few tranches before investing in scheduler/scaling work |
| Should Cluster 3 (web-ui/application complexity) become its own ideation/discovery initiative? | No — explicitly out of scope here | Operator | Run a separate `/ideate` or go directly to `/discovery` when there's bandwidth; not blocked on this initiative's outcome |
| If the narrow LangGraph POC is run, who owns evaluating whether its result justifies further investment? | Yes, if the POC proceeds | Operator | A human judgment call at the end of the POC — this ideation does not pre-commit to a verdict |
| Does `gate-map.js`'s governance logic actually map cleanly onto LangGraph's primitives? (Lens B's one 🔴 assumption) | Resolved 2026-11-11 | — | Data-proxy check run — see result under Lens B. Answer: no, most of the real validation logic is markdown-prose parsing, not typed-state validation. LangGraph POC will not be written. |
| Should the sequencing-enforcement gap found during the data-proxy check (no gate-ordering check exists in `validate()`/`gateAdvance()`) be fixed directly? | Resolved 2026-11-11 | — | Fixed directly in `cli-gate-advance.js`, TDD-verified (T15–T18). |
| Does orchestrating/instrumenting the *whole* pipeline (not just the DoR gate CLI) change the LangGraph verdict? (operator stand-back request) | Resolved 2026-11-11 | — | See "Stand-back re-assessment" under Lens B. Orchestration: no, same cheap pattern generalizes. Instrumentation: a real, now-demonstrated gap exists (`pipeline-timings.jsonl` has never produced a single record despite 5 skills documenting it as mandatory), but closing it needs a tracing-destination decision, not LangGraph/Aegra specifically. |
| Should unified pipeline instrumentation become its own initiative? | No — not blocking anything, but recommended | Operator | Candidate for its own `/ideate` or direct `/discovery`: pick one structured tracing destination (candidates: fix/extend `pipeline-timings.jsonl` itself, OpenTelemetry, or a LangSmith-style service used purely for tracing) and make every skill's State-update step emit to it, replacing capture-log.md/timings.jsonl/PostHog/`/trace`'s current fragmentation. |
