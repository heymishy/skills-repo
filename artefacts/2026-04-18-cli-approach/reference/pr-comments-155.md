# PR #155 — full conversation (verbatim)

**Source:** https://github.com/heymishy/skills-repo/pull/155
**Captured:** 2026-04-18 via GitHub API. Bodies below are verbatim copies of the PR description and comment text as posted on GitHub.

---

## PR metadata

- **Title:** CLI approach: discovery + reference material (for review)
- **State:** open
- **Author:** @craigfo
- **Created:** 2026-04-17T23:40:31Z
- **Updated:** 2026-04-18T07:52:53Z
- **Comment count:** 3

---

## PR body — @craigfo @ 2026-04-17T23:40:31Z

## What this contains

Initial outer-loop discovery output from an active downstream fork thread: the **CLI approach** — a deterministic, consumer-side executor that orchestrates agents through a declared workflow, with evaluation and recording architecturally separated, hash-verified instruction delivery, and non-fork consumer-side distribution. Positioned *against existing primitives* throughout — SKILL.md as instruction-set-as-code, the `assurance-gate.yml` / `trace-commit.yml` maker/checker split, POLICY.md floors, progressive skill disclosure, the surface adapter pattern.

Files added under `artefacts/2026-04-18-cli-approach/`:

- **`reference/012-cli-approach-explained-v2.md`** — overview (~170 lines).
- **`reference/013-cli-approach-reference-material.md`** — comprehensive reference (~450 lines) with primitive mapping, 12 open questions for discovery, and primary-source references into this repository.
- **`discovery.md`** — discovery artefact produced by `/discovery` from the references. Status: Draft — awaiting approval.

`.github/pipeline-state.json` updated: feature `2026-04-18-cli-approach` entered at `stage: discovery`, `discoveryStatus: draft`. No other state changes.

## Why this PR exists

Continuation of **#98** (productisation MVP + engine-consolidation, still open). #98 surfaced the control-plane principle; your response on it reframed the principle as an *enforcement mechanism applicable across multiple surfaces — CLI for linear pipelines, MCP (Model Context Protocol) servers for interactive navigation*. This PR's discovery artefact embeds that direction.

Not urgent to merge as-is. The PR exists so you can review **direction** before downstream work (`/clarify`, `/benefit-metric`, `/definition`) proceeds. If the framing here does not align with your Phase 3 plans, surfacing that now is cheaper than surfacing it at DoR (Definition of Ready).

## Key framing choices

Worth calling out because they directly reconcile against existing platform primitives:

1. **CLI is a consumer-side counterpart to the existing assurance gate, not a replacement.** `assurance-gate.yml` + `trace-commit.yml` remain the independent recording + enforcement. The CLI evaluates locally on the consumer side and emits a trace the existing maker/checker re-verifies. (See 012 §*Separation of evaluation and recording*; discovery MVP scope item 6.)

2. **CLI is *one* executor of the workflow, not *the* executor.** Progressive skill disclosure (chat-native, existing) and CLI-driven execution both consume the same declared workflow artefact. Any claim that CLI-driven sequencing supersedes the existing pattern is explicitly out-of-scope. (012 §*The four actors*; discovery Out of Scope: permanent.)

3. **Hash verification at envelope build is load-bearing.** The CLI preserves ADR-003's primary audit signal — the skill body handed to the agent matches the workflow's declared hash; mismatch aborts the step. (012 §*The seam contract*; discovery MVP scope item 1.)

4. **POLICY.md floors, non-fork distribution, human approval at gates — all preserved.** The CLI enforces what the existing governance model declares; it does not relax floors, introduce new gates, or change approval semantics. (013 §15 *What the CLI approach is not*.)

5. **MVP is tight.** Mode 1 only (prompt-envelope, human-driven), git-native only, six commands (`init`, `fetch`, `pin`, `verify`, `advance`, `emit-trace`), one declared workflow covering one outer-loop phase. Everything else — Mode 2/3, non-git surfaces, consumer customisation, upgrade UX — is phase-deferred.

6. **Multi-surface enforcement — open framing question.** 012/013/discovery treat MCP as Mode 3 *within* the CLI architecture (CLI commands exposed as MCP tools to a hosted agent within a single step). Your #98 response framed MCP as a *peer enforcement surface* for interactive navigation, not a sub-mode of the CLI. Same machinery, sharper lens. The discovery artefact embeds the within-step interpretation; the peer-surface interpretation is queued for `/clarify` if you confirm it as your intent.

## Review focus

1. **Do you agree with the consumer-side-counterpart framing** (framing choice 1)? This is the load-bearing claim — the CLI slots into the existing maker/checker rather than standing parallel to it. If you disagree, the MVP scope collapses.

2. **Does the "CLI is one executor, not the executor" claim** (framing choice 2) conflict with anything in your Phase 3 progressive-skill-disclosure plans? The claim is that both runtimes produce comparable traces from the same workflow declaration.

3. **Is Assumption A2 in the discovery artefact realistic?** The MVP assumes the existing `assurance-gate.yml` can re-verify a CLI-emitted trace with minor-to-no modification. If that requires substantial gate rework, the MVP re-scopes.

4. **Any MVP-boundary concerns** — Mode 1 only, git-native only, the deferred items?

5. **Open questions in 013 §16.** Twelve unresolved design decisions identified. `/clarify` will target roughly five of them before `/benefit-metric`. If any of those are already-decided in your head, naming them in your review shortcuts a round of operator conversation.

6. **CLI-mode vs peer-surface for MCP** (framing choice 6 above). Confirm whether the within-step Mode 3 reading or the peer-surface reading matches your #98 reframe. `/clarify` can sharpen — but only if your intent is clear.

## What is NOT changed

- No SKILL.md, POLICY.md, or standards content is modified.
- No existing behaviour of any `src/*` component, `scripts/`, or `.github/workflows/` is touched.
- No new governance gate, floor, or approval pattern is introduced.
- `.github/context.yml` is unchanged.

This PR adds artefact files only — `artefacts/2026-04-18-cli-approach/*` — plus a single feature entry in `.github/pipeline-state.json`. Everything else is untouched.

## If you reject or defer

Close the PR. The fork keeps running; no upstream impact. The artefact chain becomes a permanent downstream reference for either future re-engagement or independent evolution.

## Suggested next step if aligned

Comment on the direction. If the framing lands, the fork will proceed with `/clarify` against the discovery to resolve the §16 open questions, then `/benefit-metric`. Any specific open questions you want prioritised in `/clarify` — name them in your review.

## Note on the merge banner

GitHub may show the usual *"behind master / can't automatically merge"* banner from the previous thread. Irrelevant for this PR — it is for direction review, not merge. Integration (if ever) is a separate decision on your terms.

---

/cc @heymishy


---

## Comments

### @heymishy @ 2026-04-18T04:35:37Z

thanks craig, this is a good reframe - for reference my current thinking, with your feedback from this and PR #98 is here ready for outer loop run https://github.com/heymishy/skills-repo/blob/master/artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md 

summary response to questions below, followed by deeper/detailed response below
1. yes agree - fits my thinking
2. yes agree, CLI can be _one_ of the, but not the only. multiple ways to address this and want to retain flexiblity where structural enforcement can be met another way
3. need to validate that with some spikes, github (this repo) _seems_ minor but on bitbucket/jenkins or other platforms might be more challenging - need to explore. Spike B2 in the ref doc is where this gets validated
4.  none
5 ive started to explore  "I've these against the spike programme — 10 of 12 land there, will share the mapping in the detailed follow-u
6 if i understanding what you mean, i want the flexblity to run in and out of various loops as operator needs, which MCP is one choice while keeping the structural enforcement rules - ie being able to go back a step, reframe a benefit, change a story A/C or and navigate back and forward rather than a linear next next which was my understanding of the CLI path.  

The ref doc names this precisely: P4 (interaction mediation) — the property that governs human-agent exchange within a step. CLI has strong P4 at command boundaries but the workflow itself is linear. MCP/conversational surfaces allow the operator to navigate the pipeline non-linearly, which is how the platform actually works today (/workflow → any skill at any time).

will post a more detailed follow up below

---

### @heymishy @ 2026-04-18T05:01:54Z

more detailed follow-up, with model help

on the broader framing — 012 and 013 are well-researched and land in the right place. the core principle (section 3 — separate reasoning from sequencing, give each to the tool that's good at it) is sound and lines up with where the platform already is architecturally. where i want to push back and extend is on three things: positioning, the non-linear point, and the open questions.

positioning against the spike programme

the ref doc frames three architectural problems for phase 4: distribution, structural enforcement, and second-line independence. your discovery sits squarely in problem 2 (structural enforcement) and partially in problem 1 (distribution). the ref doc evaluates five enforcement mechanisms — CLI prompt injection is mechanism 1, MCP tool boundary is mechanism 2, orchestration framework is mechanism 3, structured output schema is mechanism 4, github actions hardening is mechanism 5. the CLI is one cell in that matrix, not the whole answer.

concretely: Spike A (governance logic extractability and interface definition) asks whether the governance logic (skill resolution, hash verification, gate evaluation, state advancement, trace writing) can be pulled out into a shared package that CLI, MCP server, and orchestration mechanisms all call. Spike B2 (CLI enforcement mechanism and PR #98 fit) then asks whether your CLI MVP is the right adapter shape for that package, or whether the package needs a different CLI structure. so the sequencing is: Spike A defines the shared core, Spike B2 evaluates your CLI against it, implementation follows.

this doesn't diminish the work in 013 — it positions it. your CLI discovery is an input to the spike evaluation, and potentially the reference implementation for one of the mechanisms. the ref doc literally asks "does the PR #98 workflow.yaml + preset schema serve as a candidate package interface, or is it CLI-specific?" — that's your work being cited as the leading candidate for Spike B2.

the non-linear navigation point (expanding on Q6)

this is the thing i feel strongest about. the platform today works non-linearly — /workflow inspects state and the operator navigates to any skill at any time. you can run /discovery, realise the benefit metric doesn't hold, go back to /clarify, re-run /benefit-metric, then forward to /definition. that's not a bug — it's how real delivery works. scope shifts, assumptions fail, you backtrack.

013 section 4.2 declares the workflow as "the ordered sequence of skills to invoke" with "entry conditions for each step." that's a linear model. the CLI's advance command moves forward. there's no retreat or revisit. this is where the CLI mechanism is genuinely weaker than MCP/conversational for the interactive operator surface — it enforces sequencing well but at the cost of navigation flexibility.

the ref doc calls this P4 (interaction mediation — the property that governs whether the enforcement mechanism can mediate the human-agent exchange within a step). CLI has strong P4 at command boundaries but the workflow model underneath is linear. MCP/conversational surfaces let the operator navigate non-linearly while still enforcing structural rules at each step boundary. that's why the ref doc recommends MCP for VS Code/Claude Code surfaces and CLI for regulated/CI contexts where linear execution is actually what you want.

to be clear — for CI pipelines, headless runs, and regulated audit chains, the linear model is a strength. mode 2 (headless subprocess) is perfect for that. the tension is only in mode 1 (human-driven interactive) where the operator needs to navigate, not just advance.

open questions mapping (section 16)

i've started mapping your 12 open questions against the spike programme. short version: 10 of 12 land directly in Spike A (governance logic extractability), Spike B2 (CLI enforcement mechanism), Spike C (distribution model), or Spike D (non-technical discipline interaction model). the two that don't:

Q4 (where is hash verification enforced) — largely settled by ADR-003 (schema-first model with prompt hash as primary audit signal) plus your own section 5.4. hash at envelope build before handoff to agent. both before and after is belt-and-braces but the load-bearing check is before.
Q11 (credential handling in mode 2) — genuinely deferred. inner loop implementation detail, not in any spike. fine to park.
the ones that map cleanly:

Q1, Q2, Q9 (workflow location, consumer modifications, customisations) land in Spike C1 (repo structure collision) + Spike C3 (update channel versioning and conservative pinning)
Q3, Q8, Q10 (CLI versioning, upgrade UX, distribution) land in Spike C3
Q5 (non-git surfaces) lands in Spike C4 (non-git consumer distribution) + Spike D (interaction model for non-technical disciplines)
Q6 (CLI verify vs assurance gate) — your section 6 already settles this. consumer-side counterpart, not replacement.
Q7 (CLI mandatory or one of several?) — settled by the multi-mechanism framing. one of several.
Q12 (trace schema alignment) — the ref doc's P3 (per-invocation trace anchoring) property. trace schema is the shared foundation all mechanisms produce.
will share the full mapping when i've finished working through it properly.

pipeline-state.json

one thing to flag — pipeline-state.json is per-repo state for tracking across sessions and operator visibility. not something i'd expect in PR submissions from external contributors. you'd keep your pipeline state in your own fork. i'll strip the feature block addition from this PR if it lands — no action needed from your side, just flagging how we work.

upstream authority (P4.4 from PR #98)

you raised this in #98 — whether heymishy/skills-repo is the authoritative upstream or whether the productisation fork is the publishing source. Spike C (distribution model addressing four sub-problems) explicitly needs to resolve this. short answer: not decided yet, it's a spike deliverable. but the direction of travel is that the skills repo is the source of truth for governance content, and the distribution model (whatever shape it takes) publishes from there. the productisation fork question is about whether there's an intermediate publishing layer or not.

what i'd like from you next

given the spike programme framing — would be good to hear whether you see the CLI as:
(a) the reference implementation for Spike B2 specifically (CLI enforcement mechanism evaluated against the Spike A governance package interface), or
(b) a broader proposal that the CLI is the governance package (i.e. the shared core is CLI-shaped and other mechanisms adapt around it)

013 reads more like (b) to me — the CLI as the unified execution model with modes 1/2/3 as integration patterns. the ref doc leans toward (a) — shared core with mechanism-specific adapters. that's the key architectural divergence to resolve, and it's exactly what Spike A is designed to answer with evidence rather than opinion.



---

### @craigfo @ 2026-04-18T07:52:53Z

On the mode-1 *"operator needs to navigate, not just advance"* point: adding navigation primitives so the workflow could be a graph, not a sequence.

Each node specifies allowed transitions (0 terminal, 1 next, N branching with operator-chosen target, back-references for retreat). CLI executes whatever the workflow permits.

Navigation surface: `workflow` (current node + options), `advance` (default next, or `--to=<step>`), `back`, `navigate <step>`. Operator picks; agent never sequences. Per-invocation fidelity (P1–P4) holds regardless of order.

Amending 012/013 in the next push. 

Other feedback + phase4-5 doc going into /clarify.   

---
