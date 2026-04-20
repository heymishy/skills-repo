# PR #98 — full conversation (verbatim)

**Source:** https://github.com/heymishy/skills-repo/pull/98
**Captured:** 2026-04-18 via GitHub API. Bodies below are verbatim copies of the PR description and comment text as posted on GitHub.

---

## PR metadata

- **Title:** Productisation thread MVP + engine-consolidation proposal (CLI as control plane)
- **State:** open
- **Author:** @craigfo
- **Created:** 2026-04-15T20:27:25Z
- **Updated:** 2026-04-17T23:51:06Z
- **Comment count:** 3

---

## PR body — @craigfo @ 2026-04-15T20:27:25Z

## What this contains

Two related bodies of work from an active fork. Neither is urgent to merge as-is — the PR exists so you can review direction and veto / defer / align before any structural refactor begins upstream.

### 1. Productisation thread MVP (`cli/`, 2026-04-15)

Installable Node CLI that drops a `.skills-repo/` sidecar into any git repo plus a single `artefacts/` folder. Closes the Phase 1–2 distribution outcome *"at least two squads can consume skills without forking."*

- Full outer loop: `artefacts/2026-04-15-productise-cli-and-sidecar/`
- 50 vitest + cross-environment round-trip harness, all green
- New guardrail MC-CLI-01 (CLI writes confined to `.skills-repo/` + `artefacts/`)
- ~8–10 hours of remaining work to production per `outputs/005-mvp-cli-honest-retrospective.md` (publish, preset-as-data, LLM bridge, real CI gate, external-adopter pass, upgrade command) — *005 lives in the author's local workflow notes, not in this repo; happy to share if useful*

### 2. Engine-consolidation proposal (2026-04-16) — CLI as the single authoritative control plane

Proposal + partial discovery under `artefacts/2026-04-16-engine-consolidation/`.

**Principle:** the CLI is the trusted control plane; the AI agent only operates within CLI-defined bounds. Applies C13 (*"structural governance preferred over instructional"*) concretely — a SKILL.md that merely advises the agent isn't enough; the CLI has to *be* the single authority.

Concretely: all `src/*` platform-internal components (`surface-adapter`, `improvement-agent`, `approval-channel`, bitbucket validators) migrate into `cli/src/adapters/` and `cli/src/agents/`. `.github/scripts/` that duplicate CLI logic get replaced by `skills-repo verify` / `skills-repo improve` invocations from GitHub Actions. Move-only refactor — no behaviour change. One npm package, one version — no monorepo.

Also proposes `CONTRIBUTING.md` (scope ownership, proposal process, in-flight-work signalling). This PR is the reference implementation of that process.

## Review focus

1. **Do you agree with the control-plane principle** (Part 1 of `artefacts/2026-04-16-engine-consolidation/reference/006-engine-consolidation-proposal.md`)? This is the substantive question — the migration direction follows from it.
2. **Does the migration collide with anything in-flight on your side?** If you're actively editing `src/` or `.github/scripts/run-assurance-gate.js`, say so — migration sequences after your work, not during.
3. **Any MVP-boundary concerns** on the productisation thread itself?

## What is NOT changed

- No SKILL.md / standards / POLICY.md content is modified.
- No existing behaviour of `src/*` components (proposal is move-only).
- No behaviour of `.github/scripts/` hygiene validators (they stay).

## If you reject or defer

Close the PR. The fork keeps running; no upstream impact. The 006 proposal + partial discovery become the reference for either a future upstream proposal or a permanent downstream evolution.

## Suggested next step if aligned

Comment on this PR with your view on the principle. If you're on board, we'll sequence the migration against your in-flight Phase 3 work and open a follow-up PR containing the concrete `product/*` edits + new `CONTRIBUTING.md`. Migration itself proceeds one subcomponent at a time, each move-only.

## Note on the merge banner

GitHub may show *"This branch is 15 commits behind heymishy:master"* and *"can't automatically merge."* That's expected — heymishy has moved on with Phase 3 work since the fork point (`d00393b`), and upstream commits touch files this branch also changes. This PR is for reviewing direction, not for immediate merge. Integration (rebase / cherry-pick / selective import) happens in follow-up work on the reviewer's preferred terms if alignment lands.

---

/cc @heymishy 

---

## Comments

### @heymishy @ 2026-04-17T20:57:36Z

Thanks @craigfo — both pieces of work have pushed Phase 4 thinking forward more than anything else I've had to work from.

Long response below; happy to share the revised Phase 4 draft ref doc separately as this work has shaped that quite a lot.

## On the winging-it evidence

The screenshot you shared clearly shows Phase 3 enforcement fails in a specific way. The agent knew the skill , understood its design intent, chose to violate it, and produced defensible-looking output that would have passed inspection. Only your direct question surfaced it.

That reshapes the Phase 4 enforcement target. It's not sequence enforcement (the multi-path skill flow is an intended feature — `/workflow` routing, `/spike` intercepts, `/decisions` from any point). It's **per-invocation skill fidelity**: when a skill runs, the platform guarantees the method is followed, structurally, not by trusting the agent.

The key insight your evidence forced: **self-reported traces aren't enough**. The same reasoning that justified winging the skill can justify fabricating a plausible trace. The mechanism has to mediate the interaction — turn by turn — not just validate output. If the skill says "ask one question, wait for answer," the mechanism sends one question and waits. The agent can't batch because the mechanism won't permit it.

That's what the CLI naturally does, and it's the structural expression of "only allow AI to think — workflow enforced in code." Your principle was right.

## On your three review questions

**1. Control-plane principle — yes, with a reframe.**

Core insight is exactly right and your evidence makes it necessary, not just architecturally cleaner. Reframe: the **enforcement mechanism** is the control plane, and the CLI is one valid mechanism for one class of surface. CLI is the right answer for linear pipelines, CI, and regulated contexts where mediation clarity matters most. For VS Code operators navigating the skill graph, a local MCP server with per-exchange-mediating tools fits better — if the boundary holds structurally (Spike B1 question).

Same principle, per-invocation, via whichever mechanism fits the surface. The `src/*` components belong in a governance package that multiple mechanisms invoke — not inside the CLI specifically. Whether that package genuinely factors out or separate implementations agreeing on skill format and trace schema is pragmatic — that's Spike A's job to test, not assume.

**2. Collides with in-flight work.**

Yes. Move-only refactor now conflicts with my current branches (assurance gate refinement, trace schema extension). Post-Spike A sequences cleanly after my in-flight work lands. Rather do it that way.

**3. MVP-boundary concerns.**

Three, none blocking:

- **P4.4 unresolved.** Default source is `craigfo/skills-repo`; for enterprise consumption the authoritative upstream needs to be `heymishy/skills-repo`. Phase 4 decision — whether productisation fork becomes publishing source, or this repo absorbs the CLI work. internal enterprise form would have another repo.
- **R.7 is real.** Regulated consumers pin conservatively and stay there for quarters. `upgrade` needs to support that without silent fork drift — lockfile visibility is probably the answer (consumers explicitly on vX.Y.Z, not "a fork").
- **Out of Scope #10 is a real risk.** Hand-written `workflow.yaml` that skips skill-author prerequisites moves the skip-the-skill problem from the agent to the workflow author. Same failure mode, different actor. Loud documentation from R.6 needs to land before any squad composes their own workflow.

Nothing in the MVP itself is a boundary concern. Scope discipline is good, hash round-trip is the right instinct, and never running `git add` / `git commit` is exactly the right design response.

## On the other observations you raised

**Three distribution problems (plus one).** Reading your "clone, nuked commits, redid with story ref" observation, there are three distinct problems the clone model hits, plus a fourth the platform's been carrying:

1. **Repo structure collision** — sidecar pattern (`.skills-repo/` + `artefacts/`) is the right response. Your MVP is a good reference implementation; Spike C evaluates it against alternatives before committing.
2. **Commit provenance.** Small clarification on the framing: SOX doesn't prescribe commit format — the actual constraint is enterprise-internal traceability standards (story reference in commit message, e.g. JIRA-1234 format). Different consumers have differently-shaped standards, so the platform should support operator-configured commit format validation rather than hardcoding any specific pattern. Your MVP's decision to never generate commits is the right response regardless — worth naming as a design property, not just a scope boundary.
3. **Update channel severance.** Your lockfile + explicit `upgrade` is the right direction. Versioned releases with visibility of what's changing, not continuous sync.
4. **Interaction-surface exclusion** — product managers, business analysts, risk reviewers (first-class disciplines in the standards model) likely wont participate at all with the current model - we have phase 4 /5 thinking about appropriate channels for non-technical audence, MS teams, jira/confluence etc but the 'strcutrual enforcement' problem youve raised is true there too . Phase 4 Theme C. Your sidecar makes it possible by separating governance artefacts from any specific toolchain.

Phase 4 Theme B now decomposes into these four sub-problems with specific design responses per sub-problem. Your MVP addresses 1, 2, and 3 directly.

## Disposition

Keeping open, not merging yet:

- Your MVP is the CLI enforcement reference + sidecar distribution reference. Merging pre-Spike A locks in the CLI-as-control-plane framing before the architecture decision.
- Part 2 move-only refactor sequences after Spike A produces its package interface output.
- MM2 signal captured. CR1/M1 still at-risk on MODEL-RISK.md 8/8 audit but your run moved the needle.

**Next steps I'd suggest:**

1. I finalise Phase 4 ref doc with your discovery.md and the fidelity screenshot as named evidence
2. Before running `/discovery` on Phase 4 doc, running an opt-in instrumentation experiment (fidelity + quality capture, Sonnet 4.6 vs Opus 4.6) and feeding it through `/levelup` and `/improve`. Your winging-it evidence is the specific failure mode the capture block is designed to detect.
3. Run Spike A with your MVP as one of the reference implementations evaluated
4. Based on Spike A output, decide whether to integrate, restructure, or run parallel
5. Your Part 2 migration after Spike A — one component at a time, move-only, as you originally described

None of this blocks your fork. Rather you keep iterating than wait — it's the living reference Spike A will evaluate against.

Thanks for running this properly through the pipeline and asking the agent that pointed question. Your observations have shifted Phase 4 scoping more than most of the internal work I've done on it. Shout if I've mis-read anything.

---

### @heymishy @ 2026-04-17T20:58:12Z

keen for your thoughts to feed into the revised phase 4 scoping document before i kick that off today


---

### @craigfo @ 2026-04-17T23:51:06Z

Two updates on this thread.

**1. Outer-loop discovery on the CLI approach landed in #155** — discovery artefact + reference materials (012 overview, 013 comprehensive). MVP scope: Mode 1 only (prompt-envelope, human-driven), git-native only, six commands (`init` / `fetch` / `pin` / `verify` / `advance` / `emit-trace`), one declared workflow covering one outer-loop phase. Status: Draft, awaiting approval.

**2. Reading your #98 comments against the discovery, point by point:**

- *Control-plane principle → enforcement mechanism.* Convergent. The discovery's MVP is exactly consumer-side enforcement: hash-verified envelope handoff, shape-verified return, trace-emit independent of recording. It slots into the existing `assurance-gate.yml` + `trace-commit.yml` maker/checker rather than standing parallel to it.

- *Multi-surface — CLI for linear pipelines, MCP (Model Context Protocol) for interactive navigation.* Divergent shape, same machinery. 012/013 treat MCP as **Mode 3 within the CLI** (commands-as-MCP-tools, within-step composition). Your framing positions MCP as a **peer enforcement surface** for a different surface type. Sharper lens. The peer-surface interpretation is queued for `/clarify` if you confirm that as the intent.

- *Distribution problems addressed.* Convergent. Non-fork distribution is one of the discovery's primary preserved constraints (`product/constraints.md` §1). MVP exercises sidecar + lockfile end-to-end on one outer-loop step; upgrade UX is explicitly deferred and flagged as the unvalidated half of the non-fork claim.

- *Validation through agent-fidelity-failure evidence.* Convergent. Discovery success indicators §1 ("hash verification at envelope build actually fires on a mismatch") and §5 ("two runs of the same workflow with the same skill content produce traces whose skill-body hashes match") are the demonstrability tests.

- *Pending architecture-spike outcomes.* The discovery is one possible input to that spike, not a competing direction. If the spike outcome reshapes the framing, the discovery re-runs — it is intentionally MVP-scoped and won't carry sunk-cost weight.

Continuing the thread here rather than fragmenting. Full review focus and the five-of-twelve open questions `/clarify` will target are in **#155**'s body.

---
