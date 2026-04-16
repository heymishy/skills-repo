# Skills Platform Onboarding Guide

**Platform:** Skills-based SDLC governance pipeline  
**Audience:** Squad tech leads and engineers adopting the platform  
**Time to first loop closure:** ~2 hours for setup + one practice story  
**Framework concepts reference:** [docs/concepts/README.md](docs/concepts/README.md)

---

## What you're about to use

This platform is a governed delivery pipeline built around GitHub Copilot Agent mode. Instead of
engineers making ad hoc decisions about how to break down, implement, and verify work, the
platform structures every story through a consistent sequence of skill-driven steps — from
discovery through to a merged, traced, and assured PR.

**The two loops you need to understand:**

The **outer loop** is where humans work. You write stories, run discovery, approve work at gates,
and review PRs. This is where judgement, context, and business knowledge live. The outer loop
runs in Jira/Confluence and in GitHub PR reviews — it's the work you already do, structured more
deliberately.

The **inner loop** is where the coding agent works. Once a story is ready (has passed the
Definition of Ready), you hand it to the Copilot coding agent via a branch and a structured
instruction set. The agent runs a sequence of skills — plan, implement, review, verify — and
opens a draft PR. You review and merge. The agent does not make scope decisions or judgment
calls; it executes within the boundaries you've defined.

**What the platform adds that ungoverned Copilot doesn't have:**

- Every story run produces a cryptographically-linked trace record proving which standards were
  in context when the agent worked
- An assurance gate in CI independently verifies the trace before the PR can merge — separate
  from the agent that produced the work
- Standards are versioned and injected at the start of every story, not assumed from memory
- The `/improve` skill feeds learnings back into the platform after each delivery, so the
  system gets better over time

---

## Required reading before proceeding

> Read **[MODEL-RISK.md](./MODEL-RISK.md)** before running any inner loop stories.
>
> It documents the AI governance risks inherent in this platform, the eight audit questions
> the assurance trace must answer, and the adoption gate criteria. This is not optional
> reference material — it is a required pre-read for every tech lead and engineer adopting
> the platform, and sign-off is required before non-dogfood use.

---

## Prerequisites

Before starting, confirm you have:

| Requirement | Notes |
|---|---|
| GitHub Copilot Pro+ licence | Agent mode requires Pro+ — standard Pro will not run the inner loop |
| VS Code with GitHub Copilot extension | Agent mode runs in VS Code, not the browser |
| Access to this skills repo | Read access minimum; your squad repo needs to reference it |
| Your squad repo bootstrapped | See [Bootstrap your repo](#step-2-bootstrap-your-repo) below |

---

## First steps after cloning for a new squad

This section captures what you actually need to do immediately after cloning, based on
first-hand new-squad experience. None of these steps are implied by the bootstrap script —
they are easy to miss and each one will silently break things if skipped.

### 1. Set `repoUrl` in `context.yml`

`context.yml` is blank after a fresh clone. The `repoUrl` field is not populated by the
bootstrap script. Set it immediately:

```yaml
# .github/context.yml
repoUrl: https://github.com/<your-org>/<your-repo>
```

Without this, the fleet aggregator cannot resolve your squad's pipeline state, and several
skill assertions that read `context.yml` will silently pass against an empty value.

### 2. Reconfigure your remotes

After cloning you will still have `origin` pointing at the platform skills repo. You need to
redirect `origin` to your team's own repo and add a separate upstream remote for receiving
platform updates:

```bash
# Point origin at your own squad repo
git remote set-url origin https://github.com/<your-org>/<your-repo>.git

# Add the platform repo as an upstream for syncing skill updates
git remote add skills-upstream https://github.com/heymishy/skills-repo.git
git fetch skills-upstream
```

To pull skill updates later:
```bash
git fetch skills-upstream
git merge skills-upstream/master --allow-unrelated-histories
```

### 3. Fleet registration is manual — no self-registration

Cloning the repo does not register your squad in the fleet. You must:

1. Create `fleet/squads/<your-squad-id>.json` in your repo following the schema in
   `fleet/squads/squad-alpha.json`
2. Raise a PR against `heymishy/skills-repo` adding your squad file to the same directory
   in that repo

There is no self-registration mechanism. The fleet aggregator only reads squad files
committed to the platform repo.

### 4. Private repos show `unknown` fleet health

If your squad repo is private, the fleet health aggregator will return `unknown` for your
pipeline state. This is expected — the aggregator fetches `pipeline-state.json` from a raw
GitHub URL which requires auth that the aggregator does not have for private repos.

Your options: make the repo public, or accept `unknown` status and check your own pipeline
state locally via `cat .github/pipeline-state.json`.

### 5. `[skip ci]` on fleet commits may block branch protection

The fleet aggregator emits commits tagged `[skip ci]` to avoid infinite CI loops when
updating fleet state. If your branch protection rules require all CI checks to pass before
merge, those commits will be blocked.

Configure a PR check exemption for commits containing `[skip ci]` in your repo's branch
protection settings, or exclude the fleet state file path from required checks.

### 6. Validate your full setup before the first story

Before running `/workflow` for the first time, verify that:

```bash
# Remotes are correct
git remote -v

# context.yml has your repoUrl
grep repoUrl .github/context.yml

# pipeline-state.json exists and is valid JSON
node -e "JSON.parse(require('fs').readFileSync('.github/pipeline-state.json','utf8')); console.log('OK')"

# Tests pass on a clean clone
npm test
```

All four checks should pass cleanly. If `npm test` fails on a fresh clone, that is a
platform defect — raise it in the skills repo before proceeding.

---

## Step 1: Understand the skill sequence

Every inner loop story runs the same sequence. Before touching any commands, read through this
once so you know what each step does and why it exists.
/workflow          ← Run this at the start of every session. Reads pipeline-state.json
and tells you exactly which skill to run next. Never skip this.
/branch-setup      ← Creates an isolated git worktree for the story and verifies a clean
baseline against the assurance gate. If this fails, nothing else runs.
/definition-of-ready ← Validates the story has everything the coding agent needs: ACs,
test plan, scope boundaries, and the standards to be injected.
This is the human-agent handoff gate.
/implementation-plan ← The agent produces a task-by-task plan with file paths and TDD
steps. You review and approve before execution starts.
/subagent-execution  ← Executes the implementation plan task by task. Each task runs as
a subagent with its own context boundary.
/implementation-review ← Reviews the implementation against the story ACs. Produces a
structured review report. Failures here block completion.
/verify-completion   ← Verifies all ACs pass, DoD criteria are met, and the trace record
is complete and valid.
/branch-complete     ← Finalises the branch, emits the assurance trace, and opens a
draft PR. The CI assurance gate runs automatically.
/improve             ← Run after a story merges. Extracts patterns and learnings from
the delivery and proposes improvements to the skill base.

The `/workflow` command reads `pipeline-state.json` and always tells you which step is next.
You do not need to track this manually.

---

## Step 2: Bootstrap your repo

Your squad repo needs to be configured to use the platform skills. Run the bootstrap skill
from the skills repo against your squad repo:
/bootstrap

This will:
- Copy the required `.github/` structure into your repo
- Create a starter `pipeline-state.json`
- Create `.github/context.yml` — **you must fill this in before running any stories**
- Wire the assurance gate CI workflow

**Configure `.github/context.yml`** — open it and fill in your squad name, domain, tech stack,
and the standards tiers that apply to your work. This file is what tells the coding agent which
standards to inject at the start of each story. An unconfigured `context.yml` means the agent
runs without your domain standards in context.

---

## Step 3: Write a story ready for the inner loop

A story is ready for the inner loop when it passes the Definition of Ready (DoR). The
`/definition-of-ready` skill validates this, but you should write the story to this standard
before handing it over.

A DoR-compliant story has:

- **A single, bounded scope** — one thing done, not a feature epic in disguise
- **Acceptance criteria written as verifiable conditions** — "system returns HTTP 400 when
  X is missing" not "system handles errors gracefully"
- **A test plan** — what will be tested, at what level (unit/integration/e2e), and what
  coverage is expected
- **Explicit out-of-scope statements** — what the agent must not touch
- **Domain tags** — so the platform knows which standards to inject

If you are new to writing stories at this level of precision, run `/discovery` first. The
discovery skill helps you work through the problem space and produces a structured definition
that feeds directly into a DoR-compliant story.

### Artefact-first rule (ADR-011)

Any new SKILL.md file, `src/` module, or governance check script committed to master must have a corresponding story artefact committed to `artefacts/` before or alongside the implementation. This is not bureaucracy — it is the mechanism that makes the platform's own traceability claims credible. A platform that tracks delivery traceability for other teams but cannot trace its own changes is not credible.

If you have already committed something without a story (it happens), use `.github/templates/retrospective-story.md` to create a lightweight retrospective story. The retrospective path closes the gap without requiring you to reverse the commit.

Exemptions (no story required): documentation-only changes, typo/config fixes with no behavioural effect. If in doubt, raise a one-line story — the overhead is lower than the audit finding.

---

## Step 4: Run your first story end to end

Open VS Code in your squad repo. Open the Copilot Chat panel. Run:
/workflow

Copilot will read `pipeline-state.json` and tell you where you are. If you have just
bootstrapped, it will direct you to `/branch-setup` for your first story.

Follow the sequence. At each step:

1. Read the skill output before accepting it
2. The agent will tell you if it needs human input before proceeding
3. If something looks wrong, stop and raise it — don't approve a step you don't understand

Your first story should be something small and low-risk — a new utility function, a config
change, a documentation update. The goal is loop closure, not a complex delivery.

**Loop closure means:** story entered → inner loop ran → PR opened → assurance gate passed →
you reviewed and merged → `/improve` run. That full cycle, once. After that you know the
platform works in your context and you can increase story complexity.

---

## Step 5: Review the PR and merge

When `/branch-complete` runs it opens a draft PR. Before you merge:

- Check the assurance gate in CI has passed (✅ Assurance Gate — Verdict: pass)
- Review the trace record in the PR — it should show the story ID, standards injected
  (with hashes), and gate outcome
- Review the diff as you would any PR — the agent is not infallible
- Mark the PR ready for review and merge when satisfied

The PR template will prompt you through the reviewer checklist. Fill it in — it is the
human assurance record that complements the automated gate.

---

## Step 6: Close the loop with `/improve`

After the PR merges, run:
/improve

This is the step most teams skip and shouldn't. `/improve` reviews the completed delivery,
looks at what was in `learnings.md`, compares actual vs estimated complexity, and identifies
whether any patterns from this story should feed back into the skill base.

If it produces a `workspace/proposals/` entry — a proposed skill improvement — review it and
decide whether to raise a PR against the skills fleet repo. That PR is the governed path for
your squad's discoveries to improve the platform for everyone.

---

## What good looks like

After 3–4 stories you should see:

- Stories completing in a single inner loop session without mid-run intervention
- The assurance gate passing first time consistently
- Your `learnings.md` accumulating patterns specific to your domain
- Estimation accuracy improving (the platform tracks forecast vs actual)

If stories are regularly stalling mid-inner-loop, the most common causes are: scope too large
(split the story), ACs not verifiable (rewrite them), or `context.yml` not configured for your
domain (standards not injecting correctly).

---

## Outer loop reference

The inner loop is only half the platform. The outer loop is the continuous improvement cycle
that makes the platform self-improving over time. For full outer loop documentation — including
the EVAL.md harness, the `/improve` → fleet PR flow, and the upward standards loop — see
[`skill-pipeline-instructions.md`](./skill-pipeline-instructions.md).

---

## Support and escalation

| Need | Where to go |
|---|---|
| Platform documentation | [`skill-pipeline-instructions.md`](./skill-pipeline-instructions.md) |
| Governance and risk | [`MODEL-RISK.md`](./MODEL-RISK.md) |
| Current pipeline state | [`.github/pipeline-state.json`](./.github/pipeline-state.json) |
| Skill improvement proposals | Raise a PR against the skills fleet repo with a `workspace/proposals/` entry |
| Something's broken | Raise an issue in the skills repo with your `learnings.md` and the failing trace |
