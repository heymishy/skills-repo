# Copilot Instructions

<!-- Governs all agent behaviour. Evolve via PR with tech lead review. -->

## Active context

Active pipeline context: `.github/context.yml`

<!-- context.yml holds toolchain settings. Switch profiles: `cp contexts/personal.yml .github/context.yml` or `cp contexts/work.yml .github/context.yml` -->

---

## Skills pipeline maintenance

Upstream skills sync configuration is stored in `.github/context.yml` under
`skills_upstream:`. When asked to check for or pull upstream skill updates,
read that block first — it contains the git remote name, repo URL, sync paths,
and strategy.

To sync skills from upstream:
```bash
git fetch <skills_upstream.remote>
git diff HEAD <skills_upstream.remote>/master -- .github/skills/
git checkout <skills_upstream.remote>/master -- .github/skills/ .github/templates/ scripts/ docs/skill-pipeline-instructions.md
git diff --staged
git commit -m "chore: sync skills from skills-upstream [date]"
```

If `skills_upstream.remote` is `null` or `strategy` is `none`, no remote has
been configured. The user can add one with:
```bash
git remote add skills-upstream https://github.com/heymishy/skills-repo.git
```
Then update `skills_upstream.remote` and `skills_upstream.strategy` in `context.yml`.

---

## Product context

<!-- DOGFOODING: remove this product context block after Phase 4 and replace with the generic `[FILL IN]` placeholder. Track via: artefacts/2026-04-09-skills-platform-phase1/ post-phase-4. -->

The skills platform is an open-framework, governed software delivery pipeline that enables teams to deliver traceable, high-quality software across all contributing disciplines — from a single developer on a personal project to many teams and communities of practice across a regulated enterprise.

The platform works by encoding delivery standards, quality gates, compliance requirements, design standards, security controls, and discipline-specific practices as versioned, hash-verified instruction sets (SKILL.md files and standards files) that AI agents execute against. Teams run a structured outer loop — discovery through definition-of-ready — that builds complete, validated context drawing on standards from all relevant disciplines. An inner loop then executes that context, with the level of human involvement calibrated to the team's maturity and the risk profile of the work. Real production outcomes and delivery actuals feed back into the pipeline, creating an empirical improvement cycle grounded in actual usage rather than assumptions. Over time, the platform's harness — the SKILL.md files and evaluation suite — improves itself from its own delivery signal, with human approval retained at every change gate.

## SESSION START

At the start of every session, before doing anything else:

1. Check whether `workspace/state.json` exists in the repo root
2. If it exists:
   - Read it fully
   - Report to the operator: last completed phase, any in-progress 
     story execution, any pending improvement proposals or human 
     input items
   - Ask: "Resume from last session state, or start fresh?"
3. If it does not exist:
   - This is a new session with no prior state
   - Proceed normally — state.json will be created at the first 
     phase boundary

Do not proceed with any task until session start is complete and 
confirmed with the operator.

---

## Pipeline overview

All new features follow this sequence. Do not skip steps. Do not begin a step 
without its entry condition met. When in doubt, run `/workflow`.

```
Step  Skill                  Entry condition                     Exit condition
──────────────────────────────────────────────────────────────────────────────
1     /discovery             Raw idea or problem exists           Artefact approved
2     /benefit-metric        Discovery approved                   Metrics defined + active
3     /definition            Benefit-metric active                Epics + stories written
4     /review                Stories exist                        No HIGH findings
5     /test-plan             Review passed (per story)            Tests written (failing)
6     /definition-of-ready   Tests exist, review passed           Sign-off complete
6.5   /decisions             DoR complete (if warnings ack'd)     RISK-ACCEPTs logged
7     Inner coding loop      DoR sign-off                         Draft PR opened
        7a /branch-setup     DoR Proceed: Yes                     Isolated worktree + clean baseline
        7b /implementation-plan  Worktree ready                   Task plan saved
        7c /subagent-execution   Plan exists (or /tdd per task)   All tasks complete
        7d /verify-completion    Tasks done                       All ACs verified, 0 failures
        7e /branch-complete      Verified                         Draft PR opened
8     /definition-of-done    PR merged                            AC coverage confirmed
9     /trace                 On-demand or CI on PR open           Chain health reported
```

**Support skills available throughout the inner loop:**
`/tdd` — RED-GREEN-REFACTOR enforcement per task
`/systematic-debugging` — 4-phase root cause process when a task is stuck
`/implementation-review` — spec + quality review between task batches

**Inner loop dispatch (step 6.9):**
`/issue-dispatch` — creates GitHub issues for DoR-signed-off stories to trigger the GitHub Copilot coding agent; supports `--target vscode` (minimal stub, default) and `--target github-agent` (rich inlined body); updates `pipeline-state.json` with dispatch record

**Cross-cutting architecture support:**
`/ea-registry` — organisation-level application/interface registry query,
contribution, audit, and dependency context feed to /discovery, /definition,
and /reverse-engineer

**Pipeline evolution support:**
`/loop-design` — define outer/inner loop model for evolving the whole skill library
`/token-optimization` — design library-wide model routing/token policy (consumed by core skills)
`/org-mapping` — map pipeline language/artefacts to organisation governance (policy consumed by core skills)
`/scale-pipeline` — design multi-team enterprise operating model for evolving the whole skill system

**Short-track** (bugs, small fixes, bounded refactors): 
`/test-plan → /definition-of-ready → coding agent`

**Programme track** (multi-team, multi-phase, migrations, rewrites):
`/programme → [per workstream: standard pipeline] → /metric-review at phase gates`

Migration, cutover, and consumer migration stories within any workstream use
`migration-story.md` instead of `story.md`. Use `/release` with compliance bundle
option for regulated or phase-gate releases.

---

## Templates

All artefact templates are in `.github/templates/` — each skill references its own template in its SKILL.md. When reviewing artefacts, check them against the relevant template; missing fields are findings.

---

## Artefact storage

All artefacts are saved to `artefacts/YYYY-MM-DD-[feature-slug]/` (date = discovery start; established by `/discovery`). Sub-directories follow the pattern: `stories/`, `epics/`, `test-plans/`, `verification-scripts/`, `dor/`, `plans/`, `dod/`, `trace/`, `coverage/`, `reference/`, `research/`. The full directory tree and naming convention live in `discovery/SKILL.md`.

---

## Context handoff protocol

Each skill writes its primary output to the feature artefact folder. **Coding agent resuming a feature:** read the full artefact folder in full before writing any code. Do not rely on conversation history for ACs, constraints, or scope decisions — read from the artefact files. If the folder does not exist or is incomplete, invoke `/workflow` before proceeding.

---

## Session conventions

### Starting a session

At the start of every session, run `/workflow` before beginning any work.
This surfaces the current pipeline state and prevents work starting at the wrong stage.

If you are picking up a feature after a break:
1. Run `/workflow` — it will tell you where you are and what's next
2. Read the most recent artefact for the current stage before starting
3. Do not assume you remember where you were — check the artefacts

### During a session

- Save artefact files as you go — do not leave outputs only in the chat window
- When a skill produces output, save it to the correct artefacts path immediately
- If a skill asks a clarifying question, answer it before proceeding — do not skip
- If you are unsure whether to proceed, run `/workflow` rather than guessing
- **`/checkpoint` threshold: invoke at 55%** for any file-read-heavy phase (definition, review, test-plan, trace, inner loop implementation). The 75% guideline applies only to conversation-only phases. File reads fill the Tool Results context bucket faster than the Messages bucket — by the time the hover indicator shows 55–60%, the Tool Results bucket may be near threshold. Invoke `/checkpoint` before reaching the compaction threshold — not at it. The write must complete before compaction fires; invoke with enough context headroom to allow that.

### Ending a session

Before closing a session, execute this sequence in order:
1. Write any learnings signals from this session to `workspace/learnings.md`
2. Write the checkpoint block to `workspace/state.json` with `currentPhase`, `lastUpdated`, and `checkpoint.resumeInstruction`
3. Stage all artefact files produced this session: `git add artefacts/[feature-slug]/...`
4. Commit with message format: `chore: [phase] checkpoint [feature-slug] — [one-line summary]`
5. Confirm the commit hash and hook pass/fail results in the closing message

Each step is mandatory. Skipping step 1 leaves no learnings signal. Skipping steps 3–4 leaves no recovery point for the next session. If any step fails, state the failure explicitly — do not silently omit.

### `/checkpoint` convention

`/checkpoint` is the mid-session and end-of-session state write. Same operation, same file (`workspace/state.json`), serving both purposes: phase boundary continuity and session-end handoff.

**What is written:**
- `currentPhase` — the name of the current pipeline phase
- `lastUpdated` — ISO 8601 timestamp of the write (e.g. `2026-04-10T14:00:00Z`)
- The cycle block for the active phase, containing at minimum `status` and `artefact` path
- `checkpoint.writtenAt` — the date of the write
- `checkpoint.contextAtWrite` — a brief summary of what was in progress
- `checkpoint.resumeInstruction` — the instruction for the next session to resume from this point
- `checkpoint.pendingActions` — any actions that were pending at the time of the write

**Completion expectation:**
The entire `/checkpoint` write — from invocation to closing confirmation message — must complete within 60 seconds. If it does not, the session likely ran out of context headroom before the write finished. Invoke earlier next time.

**State write safety:** When writing `workspace/state.json`, always write the complete JSON object (never a delta or append). If using a tool that does not guarantee atomic full-file replacement, write to a temp file first (`state.json.tmp`), verify the content is valid JSON, then rename over the target. A partial write, append, or non-truncating replace will produce a concatenated-JSON file that fails `check-workspace-state.js` with "Unexpected non-whitespace character after JSON".

**After writing:**
The closing confirmation message must include "Pipeline state updated ✅". A new session reading `workspace/state.json` will resume from the checkpoint without verbal priming.

---

## Artefact writing standards

**Do not hard-wrap prose paragraphs.** When writing markdown artefacts to disk, write each paragraph as a single unbroken line. Do not insert line breaks mid-sentence to fit a column width. Hard line breaks in prose look broken in VS Code and editors that do not soft-wrap.

Rules:
- Paragraphs: one line per paragraph, no mid-sentence `\n`
- Lists: one item per line (that is intentional)
- Tables: one row per line (that is intentional)
- Headings: one line
- Code blocks: fenced, content may wrap naturally
- User story format (`As a … / I want … / So that …`): each clause on its own line is acceptable

**Always expand abbreviations and codes on first use in human-oriented documents.** Pipeline artefacts, skill outputs, DoD/DoR observations, action items in `state.json`, and playbooks regularly use shorthand codes (e.g. `T3M1`, `AC3`, `E2`, `MM1`). A second operator reading cold cannot follow these without explanation.

Rules:
- **First use in any document:** write the full descriptor in brackets — e.g. `T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit)`, `E2 (/estimate pass 2 — refined at definition)`, `AC3 (Acceptance Criterion 3: <criterion text>)`, `MM1 (Meta-metric 1 — outer-loop unassisted replication rate)`.
- **Subsequent uses in the same document:** code alone is acceptable once the descriptor has appeared.
- **Human action items** (`pendingActions` in `state.json`, DoD observations, DoR Coding Agent Instructions): never use a bare code — the action must be self-describing without opening another file.
- **Skill-generated artefacts:** the first reference to any metric, AC, or estimation-pass code must include the full name. This applies in SKILL.md instruction files and in the artefacts those skills produce.
- **Scope:** applies to all new documents and artefacts from Phase 3 onwards. Legacy Phase 1/2 artefacts are not retroactively updated.

---

## Coding standards

[FILL IN BEFORE COMMITTING]

**Artefact-first rule:** Any new SKILL.md file under `.github/skills/`, any new module under `src/`, any new governance check script under `tests/` or `scripts/`, any behavioural change to dashboard logic (`dashboards/*.js`, `dashboards/*.html` rendering/logic), any behavioural change to `copilot-instructions.md` (new rules, guardrails, workflow changes), and any structural change to `pipeline-state.json` (schema evolution, file splitting, archive mechanisms, new top-level fields) committed to master must have a corresponding story artefact (discovery → benefit-metric → story → test-plan → DoR) committed to `artefacts/` before or alongside the implementation. A PR that adds or modifies any of these without a DoR story artefact is out-of-process. Exception: documentation-only changes (README, CHANGELOG, workspace notes), typo/configuration fixes that make no behavioural difference, data-only updates to dashboard static arrays reflecting pipeline-state.json (story phase/state changes), pipeline bookkeeping updates (stage transitions, metric signals, dispatch records), and changes explicitly listed in the governed exemption register do not require a full chain. For work that has already landed without a chain, use `.github/templates/retrospective-story.md` to create a retroactive story.

**State and artefact updates — no standalone PR required:** Changes to `workspace/state.json`, `.github/pipeline-state.json`, and files under `artefacts/` are pipeline bookkeeping, not code. They do not need a standalone draft PR with a review cycle. Rules:
- **Bundle first:** whenever practical, include state/artefact updates in the same commit and branch as the implementation they record. Merge once — not twice.
- **Standalone checkpoint commits:** when no implementation branch is open (e.g. a mid-session `/checkpoint` write or DoD artefact after a PR has already merged), commit the changes on a short-lived branch and merge it immediately — or, once the GitHub branch protection path bypass below is configured, push directly to master.
- **Never open a standalone draft PR and wait for review** for a state-only or artefact-only change. This creates unnecessary pipeline overhead for non-code changes with no quality-gate value.
- **Exception:** if the state or artefact update is bundled with a chore that also touches other governed files (SKILL.md, src/, tests/), the PR is required for those other files — include the state/artefact update in the same PR rather than splitting it.

> **Operator one-time action (GitHub branch protection):** Configure a path-based bypass in the repository's GitHub Ruleset (Settings → Rules → your master ruleset) for paths `workspace/**`, `artefacts/**`, and `.github/pipeline-state.json`. This allows direct push without a PR for these bookkeeping paths while keeping the PR gate intact for all code paths. Until that bypass is in place, use a short-lived branch + immediate merge as described above.

---

## Product context files

The `product/` directory (repo root) holds standing context that skills read automatically.
Bootstrap creates placeholder versions of all four files — fill them in before running the pipeline.

| File | Read by | Purpose |
|------|---------|---------|
| `product/mission.md` | `/discovery`, `/benefit-metric`, `/clarify` | What the product does and for whom. Frames problem scoping and metric relevance. |
| `product/roadmap.md` | `/benefit-metric` | Strategic priorities and horizon. Used to assess whether a proposed metric aligns with the current direction. |
| `product/tech-stack.md` | `/definition` | Current technology decisions and constraints. Informs story architecture choices and NFR defaults. |
| `product/constraints.md` | `/discovery`, `/definition` | Hard limits: budget, regulatory, team capability. Surfaced during scope discussions and story ACs. |

**Format:** each file is free-form markdown. A single paragraph plus bullet list is sufficient.
Skills read the files as-is — no special syntax required.
Update these files when the product context changes (new regulatory requirement, stack migration, etc.).

---

## Architecture standards

<!-- Read by /definition, /review (Category E), /definition-of-ready (H9), /trace, and the coding agent via DoR. Keep .github/architecture-guardrails.md updated — it is the source of truth. -->

**Architecture guardrails:** `.github/architecture-guardrails.md`
**EA registry repo (optional):** `https://github.com/heymishy/ea-registry`
**Pattern library:** [FILL IN — URL or path to your pattern / component library]
**Style guide:** [FILL IN — URL or path to your style guide]
**Reference implementation:** [FILL IN — path in repo, e.g. `src/reference/`]
**Repo-level ADR register:** `.github/architecture-guardrails.md` (Active ADRs section)

When `context.yml` sets `architecture.ea_registry_authoritative: true`, keep
application/interface/domain entries in the EA registry repo and use `/ea-registry`
to feed dependency context into delivery repos.

> Per-feature decisions are recorded by /decisions and live in
> `artefacts/[feature]/decisions.md`.
> Structural decisions that constrain future features should also be added to
> `.github/architecture-guardrails.md` as a repo-level ADR.

---

## Estimation model

This pipeline does not use story points or sprint velocity.

Estimates are recorded in three passes by the `/estimate` skill:
- **E1** (at /discovery): rough outer-loop focus-time forecast, seeded from scope complexity and operator experience
- **E2** (at /definition): refined once story count and complexity scores are known
- **E3** (at /improve): actuals comparison, delta analysis, flow findings, and a row appended to `workspace/estimation-norms.md`

The key signals used to inform estimates:

- **Complexity (1/2/3):** confidence and clarity, set at definition
  - 1 = Well understood, clear path
  - 2 = Some ambiguity, known unknowns
  - 3 = High ambiguity — consider a spike before committing
- **Scope stability (Stable/Unstable):** boundary confidence, set at definition
- **Human oversight (Low/Medium/High):** set at epic level

Do not introduce points or sizing unless explicitly asked.
After 3+ features, `/estimate` will suggest calibrated defaults from `workspace/estimation-norms.md`.

---

## Pipeline state file — mandatory writes

Every skill has a `## State update — mandatory final step` section. **Completing that write is the final required action of every skill run — without exception.**

- Write to `.github/pipeline-state.json` in the **project repository** (the repo the user is working in), never the skills repo
- The skill is not considered complete until the write is done
- Confirm the write in your closing message: include "Pipeline state updated ✅"
- If the state file does not exist yet, create it first using the seed structure (see `/bootstrap`)
- If the write is skipped for any reason, state this explicitly so the user can run `/workflow` to reconcile

`/workflow` is the reconciliation safety net and will catch missed writes — but do not rely on it as a substitute.

---

## Coding agent start (GitHub Actions)

If you are running in a GitHub Actions container, perform these steps before writing any code:

1. Read `workspace/state.json` — current pipeline phase and active story ID.
2. Read `artefacts/[feature-slug]/dor/[story-slug]-dor.md` — your Coding Agent Instructions block, scope contract, and AC list.
3. Read `artefacts/[feature-slug]/dor/[story-slug]-dor-contract.md` — exact file touchpoints and out-of-scope constraints.
4. Run `npm test` and `bash scripts/validate-trace.sh --ci` — both must pass before you make any changes.

Open all PRs as drafts. Never mark ready for review. Never merge. Never create, modify, or delete files under `artefacts/`, `.github/skills/`, `.github/templates/`, or `standards/`. If you encounter ambiguity not covered by the ACs, add a PR comment describing the specific blocker and stop — do not improvise a workaround.

Full orientation reference (VS Code context): `.github/instructions/agent-orientation.instructions.md`.

---

## Platform change policy (Phase 2+)

**SKILL.md files, templates, standards files, and pipeline infrastructure changes must be merged via PR — not committed directly to the default branch.** This applies to all changes to `.github/skills/`, `.github/templates/`, `standards/`, `.github/governance-gates.yml`, and `scripts/`. The governed path is: local edit on a feature branch → PR opened → platform team reviews → merge.

---

## Tool integrations

<!-- Configuration has moved to `.github/context.yml` (`tools.*` and `change_management.*`). The /release skill reads context.yml directly. This table is a read-only reference — context.yml is canonical. -->

| Tool | Purpose | Configuration |
|------|---------|---------------|
| ServiceNow | Change management | Set in `context.yml: change_management.*` |
| CI/CD platform | Build + deploy | Set in `context.yml: tools.ci_platform` |
| Monitoring / APM | Observability | Set in `context.yml: tools.monitoring` |
| Log aggregation | Log querying | Set in `context.yml: tools.log_aggregation` |
| On-call alerting | Incident response | Set in `context.yml: tools.alerting` |
| Issue tracking | Project management | Set in `context.yml: tools.project_management` |
| Artefact repository | Build artefacts | Set in `context.yml: tools.artifact_registry` |

---

## Skill Performance Capture (instrumentation)

At session start, read `.github/context.yml`. Check `instrumentation.enabled`. If `instrumentation.enabled: true`, append a capture block to each phase output artefact you write in this session. If `instrumentation.enabled` is absent or `false`, do not append any capture block.

**When to append:** After writing a phase output artefact of one of these types — `discovery.md`, `benefit-metric.md`, story artefacts (files under `stories/`), test plan artefacts (files under `test-plans/`) — append the capture block template from `.github/templates/capture-block.md` as the final section of that file.

**Appendix-only constraint:** The capture block is an appendix. Do not modify the primary artefact body content. Append after the last line of existing content only.

**Excluded artefact types:** Do not append capture blocks to gate artefacts — DoR (definition-of-ready) artefacts and DoD (definition-of-done) artefacts are explicitly excluded.

**Field names:** When populating the capture block, use the exact field names defined in the template: `experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`.

**Security constraint (MC-SEC-02):** The `fidelity_self_report` field must not contain session tokens, user identifiers, or API credentials. Record only model behaviour observations.
