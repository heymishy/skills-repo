# Discovery Input Reference: Platform Onboarding, Distribution, and Brownfield Adoption

**Document type:** Pre-discovery synthesis — input for `/discovery` run
**Prepared:** 2026-04-24
**Primary ideation source:** `artefacts/2026-04-23-non-technical-channel/research/ideation.md` (pass 4)
**Related gaps:** G0a (distribution versioning and lockfile), G0b (non-technical discipline channel), G14 (skill version pinning at consumption point), G17 (brownfield onboarding path)
**Related workstreams:** WS0.1, WS0.2, WS0.3, WS0.4, WS0.5, WS0.6 (Phase 4 completion, Phase 5 WS0)
**Status:** Ready for `/discovery` — do not run `/discovery` directly from this document without reading the ideation source above

---

## 1. Feature context

This feature addresses the set of unsolved Phase 4 completion items that collectively block cross-discipline adoption of the platform. Specifically: no consumer can pin the platform to a named release version and verify it has not drifted (G0a); no non-technical discipline participant can run the outer loop without a git-configured VS Code setup (G0b); no consuming repo has a guided path from a partly-built codebase into the pipeline without a full Phase A discovery run (G17); and the CLI enforcement adapter stubs (`init`, `fetch`, `pin`, `verify`) delivered in Phase 4 remain unimplemented against a real lockfile contract (G14, WS0.1–WS0.2). These are not separate problems — they are the same problem at different layers: the platform cannot claim enterprise-grade distribution without version pinning, cannot claim cross-discipline adoption without removing the git/VS Code prerequisite, and cannot claim brownfield-ready onboarding without an entry path for teams that already have code. WS0.6 (CI-native artefact attachment via `caa.1`/`caa.2`/`caa.3`) is confirmed delivered (DoD-complete) and is therefore out of scope for this feature.

This is the right Phase 5 starting point because WS0 is the explicit entry condition for every other Phase 5 workstream. WS1 (harness infrastructure), WS2 (subagent isolation), WS3 (context governance), WS4 (spec integrity), WS5 (platform intelligence), WS6 (human capability), and WS7 (operational domain standards) all carry `WS0 distribution complete` as their entry condition. Delivering onboarding, version-pinned distribution, and a brownfield entry path is not a marginal improvement — it is the prerequisite that makes the rest of Phase 5 reachable for any consumer who is not the platform maintainer.

The ideation artefact at `artefacts/2026-04-23-non-technical-channel/research/ideation.md` is the primary input for sections 3 and 4 of this document. It contains four passes of analysis and arrived at a PROCEED recommendation with four named REDESIGN signals: problem framing (the core problem is discovery governance dysfunction, not access friction), adoption strategy sequencing (first movers are teams carrying the cost of ambiguous discovery, not the people currently running it), governance model prerequisite (outer loop skills must be redesigned before surface work), and surface architecture sequencing (surface choice must follow from evidence, not prior architectural decisions). These REDESIGN signals apply directly to Initiative 3 and constrain the framing of Initiatives 1 and 2. The `/discovery` skill must engage with them as constraints, not as options.

---

## 2. Current state baseline

### 2a. Current onboarding path

The current onboarding path for a new consuming repository is documented in `scripts/bootstrap-new-repo.sh` and `scripts/bootstrap-new-repo.ps1`, and governed by the `/bootstrap` skill. The steps a new consumer must complete are as follows:

1. [REQUIRES-IT] Obtain approval to install VS Code on the target machine — extension procurement and security approval varies by enterprise; typically 1–4 weeks.
2. [REQUIRES-IT] Configure git credentials and proxy settings on a managed corporate device.
3. [MANUAL] Run `bootstrap-new-repo.sh` or `bootstrap-new-repo.ps1` in the target repository.
4. [MANUAL] Fill in the two required placeholders in `copilot-instructions.md` (`[FILL IN]` markers for coding standards and product context).
5. [MANUAL] Fill in `product/mission.md`, `product/roadmap.md`, `product/tech-stack.md`, and `product/constraints.md`.
6. [MANUAL] Configure `context.yml` with the delivery surface type and toolchain settings.
7. [AUTOMATED] Run `npm test` to confirm the governance check baseline passes.
8. [MANUAL] If consuming from a skills-upstream remote: configure the remote (`git remote add skills-upstream ...`) and run `sync-from-upstream.sh` or `sync-from-upstream.ps1`.

Total steps: 8. Highest-friction step: Step 1 — enterprise IT procurement and security approval for VS Code and GitHub Copilot extensions is outside the consumer's control and adds the longest elapsed time to any onboarding. Step 2 is the highest technical friction for non-engineering personas. Step 4–6 require knowledge of the pipeline vocabulary that a first-time consumer does not yet have. There is no `/where-am-i` concierge or guided orientation — a consumer who completes bootstrap and then opens VS Code does not know which skill to run first.

The `/bootstrap` skill addresses a git-native, VS Code context. It has no path for a consumer who cannot or will not use VS Code, and no path for a consumer who wants to run discovery only without taking on the full governance stack.

### 2b. Current distribution mechanism: sync-from-upstream

`scripts/sync-from-upstream.sh` (and the PowerShell equivalent `sync-from-upstream.ps1`) is the current upstream distribution mechanism. It accepts a remote name and branch, fetches, shows a diff summary, then applies the following paths via `git checkout <remote>/<branch> -- <paths>`:

- `.github/skills/` — full skill library
- `.github/templates/` — artefact templates
- `dashboards/pipeline-viz.html`
- `.github/copilot-instructions.md`
- `.github/pipeline-state.schema.json`
- `.github/architecture-guardrails.md`
- `.github/pull_request_template.md`
- `.github/standards/`
- `.github/workflows/`
- `scripts/`
- `tests/`
- `CHANGELOG.md`

What it does: synchronises file content from a named upstream remote at the file level. What it does not do: it does not record which named release of the skills platform the consumer is now on. There is no lockfile, no version field, no per-skill hash record at the consumer side. A consumer who has run `sync-from-upstream.sh` cannot answer "what version of `/discovery` am I running?" without inspecting the file directly. The assurance gate records a hash of each SKILL.md at gate time, but that hash is not pinned to a named release — it is a one-time snapshot. Two consumers who ran `sync-from-upstream.sh` on different dates are running different instruction sets with no diff visibility. The `upgrade` command (WS0.2) and versioned lockfile (WS0.1) are the Phase 4 deferred items that address this gap.

### 2c. CLI adapter stubs: init, pin, verify, fetch

`src/enforcement/cli-adapter.js` exports a nine-command Mode 1 MVP set. The commands relevant to distribution and onboarding are `init`, `fetch`, `pin`, and `verify`. Their current implementation status is honest stubs: each returns `{ status: 'ok', command: '<name>' }` with no side effects, no filesystem access, and no real behaviour. They pass the CI test suite because the tests assert the stub return shape, not actual lockfile behaviour.

What each command would need to do in a complete implementation:

- `init`: install the skills sidecar into the consuming repository, write an initial lockfile recording the named release version and per-skill SHA-256 hashes at time of installation, configure the upstream remote in `.github/context.yml`.
- `fetch`: retrieve the latest skill content from the configured upstream (or the pinned version), without applying it — allowing the consumer to inspect the diff before committing.
- `pin`: update the lockfile to record the current on-disk skill hashes as the new pinned baseline. Called after a deliberate upgrade decision, not automatically.
- `verify`: re-compute hashes of the current on-disk skill files and compare them against the lockfile. Report any drift. This is the consumer-side integrity check that the assurance gate currently performs only at gate time.

None of these are implemented. The lockfile schema itself does not yet exist. The `advance` command is the only non-stub command in the adapter — it implements the governed state transition with hash verification against the governance package, which is a separate concern from consumer-side lockfile management.

---

## 3. The opportunity

### 3a. Job statement (from Lens E and Lens D of the ideation artefact)

The functional job is: produce a shared, signed, versioned record of what was agreed in discovery — with attribution for who contributed each element — that all participating stakeholders accept as the authoritative record and that traces directly to what gets built.

The social job differs by role. For a business lead or senior sponsor: be seen as an executive who runs rigorous, defensible governance. For a BA or delivery analyst: be the named owner of the outer loop, not the person whose work was interpreted by an engineer. For a product manager or product owner: run the outer loop end-to-end without requiring an engineer as a co-author or translator. For an SME: have specific constraints and insights attributed to you in the artefact, not diluted into anonymous text.

The emotional job is: feel protected by the record, not exposed by it. This is the central tension. The same attributed, versioned discovery record that protects delivery teams (scope drift is traceable, rework is attributable to a documented decision) is experienced as threatening by senior stakeholders who currently benefit from the ambiguity of informal governance. The record that a delivery team wants — "here is exactly who agreed what, and when" — is the record that a business lead may resist, because it removes the deniability that informal meeting minutes preserve.

The switch threshold is therefore not "the surface is easier to use." It is: the governed artefact must be more defensible than an email chain AND accessible without a technical co-author AND the attribution model must offer bounded accountability that senior stakeholders will accept — their name on the whole artefact, not necessarily on individual sections.

The real competition is not VS Code, Confluence, or Jira. It is the political economy of informal governance — the set of unwritten rules about who gets to be in the room, who gets the last word, and who can claim they were consulted without it being verifiable. Formalising discovery removes the ambiguity that currently protects some stakeholders. Any solution that does not account for this political economy will find adoption resistance that is not about the tool.

### 3b. Friction clusters ranked by blocking power

The following ranking is derived from the opportunity tree in the ideation artefact (Clusters 1–5). Each cluster is a category of friction, not a list of individual pain points.

**Cluster 1 — Environment access (GATE)**: This is the blocking prerequisite. A non-technical stakeholder who cannot get VS Code installed, git credentials configured, or GitHub Copilot approved through enterprise IT cannot reach any other value. Solving lower-ranked clusters first has no effect until this gate is open. The resolution is not "make VS Code easier" — it is "remove VS Code as a dependency for the outer loop." A non-technical participant must be able to run discovery and contribute attributed input without a local git setup. This is WS0.4 (non-git consumer distribution) and the surface work that WS0.7 enables once the governance model prerequisite (Cluster 5, see below) is satisfied.

**Cluster 5 — Enterprise discovery governance dysfunction (BLOCKING FORCE)**: Cluster 5 is ranked above Clusters 2, 3, and 4 because it is an active opposing force, not a cost. Clusters 2–4 are friction costs that reduce adoption but do not actively prevent it. Cluster 5 is a coalition of stakeholders with structurally distinct reasons to resist: 5a (no agreed discovery ownership model), 5b (attributed record creates accountability that feels threatening to senior stakeholders), 5c (outer loop can be run entirely by an engineer, making non-technical input advisory rather than authoritative), and 5d (resistance coalition whose members reinforce each other). The critical consequence of 5c is the structural gap named in REDESIGN signal 3 of the ideation artefact: until discovery and benefit-metric skills require named stakeholder attribution as a hard field, the platform's claim to cross-discipline governance is rhetorical. Any surface investment before 5c is addressed reproduces the same adoption failure mode.

**Cluster 2 — Artefact structure as barrier**: Non-technical participants who do reach the platform encounter section headers and AC formats that are engineering conventions. A BA who knows what a user story is does not know what format this pipeline requires. The wrong structure is rejected in technical terms. This is addressable by guided content extraction (the stakeholder never sees the raw template), plain-language gate translation (WS0.8), and artefact parity (WS0.9). These are Phase 5 delivery items, not design unknowns.

**Cluster 3 — Work context mismatch**: Enterprise stakeholders review work in Teams. They do not receive GitHub PR review requests. Pipeline artefacts are not in a format their manager recognises as a deliverable. Jira epics and Teams threads are where approvals happen. This is the target surface for WS0.4 (non-git consumer distribution) — but it is downstream of Clusters 1 and 5. Solving Cluster 3 before Cluster 1 means building a Teams distribution channel for an outer loop that stakeholders still cannot run without a technical co-author.

**Cluster 4 — Adoption narrative misalignment**: The platform is currently perceived as a developer workflow. Non-technical stakeholders see "you have to learn VS Code too" as a cost, not a value proposition. There is no social proof from non-engineering personas. This is a lagging indicator — it will shift when Clusters 1, 5, and 2 produce real non-technical adopters. It cannot be solved by communications or rebranding before functional gaps are closed.

### 3c. Governance model prerequisite

The governance model prerequisite (REDESIGN signal 3) is not a Phase 6 aspiration. It is the prerequisite for WS0.7 — and for any surface work — to not reproduce the same adoption failure mode that has kept the outer loop engineer-dominated despite it being nominally open to all disciplines.

The specific change required: the `/discovery` and `/benefit-metric` skills must add required fields for named stakeholder attribution. Specifically, a `contributors` section recording who contributed domain expertise (at minimum: name and role), a `reviewers` section recording who reviewed the draft before sign-off, and an `approved-by` section recording who gave final approval. These fields must be treated as required — their absence is a quality gap that blocks DoR sign-off, not an optional section that can be left blank.

The `/definition-of-ready` skill must add a hard block (H-GOV) checking that the `contributors` and `approved-by` fields are populated in the discovery artefact. An empty or missing attribution section is a DoR hard block, not a warning.

This change has two effects. First, it makes the structural gap visible: engineer-only outer loop execution produces an artefact that fails the DoR check at the `contributors` field. The BA's structural necessity becomes real, not rhetorical. Second, it creates the governance record that makes the attributed artefact worth producing — without attribution fields, the artefact is a better-structured Confluence page; with them, it is a defensible governance record.

The governance model redesign also requires a decision on bounded attribution: whether sign-off attaches to the whole artefact (preferred for senior stakeholders who resist section-level attribution) or to named sections (preferred for SMEs who want their specific constraint on record). This is an open question for `/discovery` to resolve. The current pipeline offers no model — this feature must propose one.

---

## 4. Solution directions

### Initiative 1: Seamless onboarding

Scope: remove the VS Code + git setup prerequisite as the entry condition for running the outer loop. A non-technical participant must be able to complete at least the discovery and benefit-metric phases without a local development environment.

The practical target: a `/where-am-i` concierge skill (or equivalent first-session orientation) that a new consumer can run after bootstrap — or after arriving at the repository without bootstrap context — and receive a guided orientation to their current pipeline state, what to do next, and what each next step requires from them. This is distinct from `/workflow` (which diagnoses pipeline state for an operator who already knows the pipeline) — the concierge is for someone who does not yet know what the pipeline is.

The second component is a one-command install path. The current `bootstrap-new-repo.sh` approach requires the consumer to locate the script, configure a remote, and execute shell commands. The target is a single published command — analogous to `npm create`, `brew install`, or equivalent — that sets up the pipeline in a new repository without requiring the consumer to understand git remotes or script execution. This addresses G0a (version pinning) because the install command is the natural place to write the initial lockfile.

The third component is the lockfile contract itself (WS0.1 and WS0.2). The `/pin` and `/verify` commands in the CLI adapter need real implementations. The lockfile schema needs to be defined. The `/upgrade` command (WS0.2) needs to show a named-release diff before applying it — analogous to `npm outdated` before `npm update`. These are engineering deliverables, not design unknowns.

### Initiative 2: Brownfield entry

Scope: provide a governed entry path for a repository that already has code, partially-built features, or an existing discovery process, without requiring a full Phase A run from scratch.

Three entry patterns, in order of lowest to highest overhead:

Entry A — `/tdd [story-slug]`: a team that has a well-specified story (in any format) can enter the inner loop directly by running `/tdd [story-slug]`. This already exists as a pattern but is not formally surfaced as an entry point for teams arriving from outside the pipeline. The brownfield entry path should make Entry A explicit: if you have a written story with acceptance criteria, you can start here.

Entry B — `/reverse-engineer` wrapper: a team with an existing codebase but no pipeline artefacts runs the `/reverse-engineer` skill to extract business rules, data contracts, and interface behaviour. The output feeds `/discovery` directly. This path is already documented in the `/reverse-engineer` SKILL.md but is not connected to a guided onboarding flow. The brownfield entry path should make Entry B explicit: if you have code but no discovery artefact, start with `/reverse-engineer` and follow the output into `/discovery`.

Entry C — retrospective story: a team with code already shipped runs a retrospective story (using `templates/retrospective-story.md`) to create a DoD-complete pipeline record for work that predates the platform. The `retrospective-story.md` template exists but is not surfaced as a standard entry path. Entry C closes the gap identified in G17: teams with existing partially-built codebases have no explicit route to pipeline adoption without running a full outer loop that does not reflect their actual delivery state.

All three entry patterns share stories with Initiative 1 — the concierge skill needs to detect which entry pattern applies and route accordingly. A consumer who arrives with an existing codebase and runs `/where-am-i` should receive Entry B or Entry C guidance, not a prompt to run `/discovery` as if starting from scratch.

### Initiative 3: Governance model prerequisite

Scope: redesign the outer loop skills so that engineer-only execution produces a visibly incomplete artefact. This is the prerequisite for WS0.7 (non-technical discipline interaction surface) to not reproduce the same adoption failure mode.

The specific deliverables are:

Required attribution fields in the `/discovery` SKILL.md template: `contributors` (name, role, contribution area), `reviewers` (name, role, review date), `approved-by` (name, role, approval date). These are required fields. Their absence is a quality gap, not an optional section.

Required attribution fields in the `/benefit-metric` SKILL.md template: at minimum, who owns the metric definition and who reviewed the baseline. The benefit metric owner is typically a product or BA persona — this field makes that requirement explicit.

A new DoR hard block (`H-GOV`) in the `/definition-of-ready` SKILL.md: the discovery artefact must have a populated `approved-by` section with at least one entry from a non-engineering role before DoR sign-off. Absence of attribution from a non-technical stakeholder is a DoR hard block.

A bounded attribution decision: the `/discovery` template redesign must include a choice between artefact-level sign-off (name on the whole document) and section-level attribution (name on specific contributed sections). The design question — which model is acceptable to senior stakeholders without triggering accountability avoidance — is an open question for `/discovery` to resolve through the five parallel experiments described in the ideation artefact. The template must accommodate both options; the governance model must specify which is required at minimum.

This initiative does not include the Teams bot deployment (already in `src/teams-bot/` and gated on WS0.4), the facilitation-native web UI (hypothesis not yet tested against BA population, per REDESIGN signal 4), or the plain-language gate translation layer (WS0.8, Phase 5 subsequent). It is confined to the outer loop skill and template changes that make governance real before any new surface is built.

---

## 5. What this feature is not

The following items are explicitly out of scope for this feature. Each has a home elsewhere in the roadmap.

**Not: facilitation-native web UI.** The facilitation-native canvas hypothesis — where a BA runs a live workshop and the artefact is produced as a byproduct — is a valid architectural hypothesis (Lens E, Solution hypotheses table). It is out of scope here because the REDESIGN signal 4 finding is clear: the framing test (does "facilitation canvas" framing change the BA's adoption response compared to "lower-friction tool") must be run before any design investment. Building the canvas before this test is scope waste. If the test confirms the hypothesis, it becomes a separate feature — likely Phase 5 WS6 — not a story in this one.

**Not: Teams bot deployment (WS0.7).** `src/teams-bot/bot-handler.js` exists. The spike-d-output.md verdict is PROCEED. The Teams bot is WS0.7 — it is gated on WS0.4 (non-git consumer distribution model) AND on the governance model prerequisite from Initiative 3. It is not part of this feature because deploying a bot channel into a pipeline whose outer loop is still engineer-executable would reproduce exactly the adoption failure mode the ideation analysis identified.

**Not: peer reviewer agents (Phase 5 WS1).** WS1 (harness infrastructure, hook events, capability manifest) and its dependent workstreams (WS2 subagent isolation, WS3 context governance) are sequenced after WS0 completion. They are Phase 5 successor work, not stories in this feature.

**Not: the regulated dogfood story.** Running this platform's own Phase 5 delivery as a dogfood instance under the governance model being redesigned in Initiative 3 is a desirable constraint but not a story in this feature. The dogfood constraint will appear as an NFR or acceptance criterion in the stories that emerge from `/discovery` — it is not a separate deliverable.

---

## 6. Open questions for /discovery

| Question | Why it matters | Where to find the answer |
|---|---|---|
| Is engineer-only outer loop execution visibly insufficient today, without skill redesign? | If yes, the existing attribution gap is demonstrable — Initiative 3 can cite evidence. If no, skill redesign must add required evidence fields that cannot be plausibly fabricated without non-technical input. The answer changes the scope of Initiative 3. | Run the governance model quality audit from the ideation artefact: take 3 engineer-produced discovery artefacts; have 2 BAs and 1 business lead rate them against customer evidence quality, stakeholder context accuracy, business model coverage, and regulatory constraint capture. |
| What bounded attribution model will senior stakeholders accept? | The core tension in Initiative 3 and any surface work. If artefact-level sign-off (name on the whole document) is acceptable, the template change is simpler. If section-level attribution triggers accountability avoidance, the governance model needs a different design. If neither is acceptable, surface investment is premature. | Run the accountability avoidance test from the ideation artefact: present two template variants to 2–3 senior (business lead level) stakeholders and ask which they would sign off on. |
| Which of the three brownfield entry patterns (A, B, C) is used most in practice by the teams most likely to adopt? | Entry path selection in the concierge skill depends on the actual distribution of incoming team contexts. If most brownfield teams have stories but no discovery artefacts, Entry A is primary. If most have code but no stories, Entry B is primary. | Survey or interview 3–5 teams who have expressed interest in adopting the platform but have not started. Ask: "What do you have today — code, stories, a discovery document, nothing?" |
| What is the minimum lockfile schema that is forward-compatible with WS4 (spec integrity)? | The lockfile introduced in WS0.1 must not conflict with or require replacement when WS4 (verbatim instruction assembly record, Phase 6 WS9) arrives. Designing it with WS4 in mind avoids a migration story later. | Read the WS4 workstream description in `artefacts/phase5-6-roadmap.md` and the G19 intentional gap note in `product/constraints.md`. Confirm with the platform maintainer whether WS4 has lockfile schema constraints. |
| Does the non-git consumer distribution model (WS0.4) have a constraint from enterprise ADO environments? | The ideation assumption inventory flags "Azure DevOps environments can be supported at the channel adapter layer without pipeline changes" as a low-risk accepted assumption, but notes it as a constraint. If ADO consumers need a distribution mechanism that is not `sync-from-upstream.sh`, the lockfile and `init`/`fetch` design must accommodate it. | Read the emerging cluster at the bottom of the Lens A opportunity tree in the ideation artefact. Spike if the constraint is unresolved. |
| Is `pre-discovery` a needed pipeline stage, or is `ideation` sufficient for the current feature tracking model? | The session summary proposed `pre-discovery` as the stage for this feature, but the schema enum only includes `ideation`. If `pre-discovery` reflects a genuinely different state from `ideation` — for example, a state after the ideation signal is PROCEED but before `/discovery` has been run — it may warrant a schema extension. | Check `pipeline-state.schema.json` stage enum. If `ideation` covers the state (PROCEED signal from ideation, reference doc written, not yet in active discovery), no change is needed. |

---

## 7. Suggested discovery scope

The `/discovery` run for this feature should scope to Initiatives 1 and 3 as the primary scope, with Initiative 2 as secondary scope sharing stories with Initiative 1. Initiative 3 (governance model prerequisite) must be scoped first because its output — the redesigned attribution fields and DoR hard block — is a prerequisite for any surface work in Initiative 1. Discovery should confirm whether Initiative 3 requires stories of its own (SKILL.md changes to `/discovery`, `/benefit-metric`, and `/definition-of-ready`, plus template redesign) or whether it can be delivered as a constrained sub-scope within Initiative 1 stories. Initiative 2 (brownfield entry) is secondary in the sense that the concierge skill and the entry pattern routing can share a story or epic with the `/where-am-i` work in Initiative 1 — they are not independent streams. The Teams bot (WS0.7) and facilitation-native canvas are explicitly excluded from discovery scope until the five parallel experiments in the ideation artefact are complete and their findings are confirmed. The MVPs for Initiatives 1 and 3 together are: (a) a consuming team can run `/bootstrap` and then `/where-am-i` and know exactly what to do next, without contacting the platform team; (b) an engineer-only discovery artefact fails DoR sign-off with a clear attribution gap message; and (c) at least one non-engineering persona can be named as a `contributors` entry in a real discovery artefact produced by a cross-functional pair running the pipeline together.
