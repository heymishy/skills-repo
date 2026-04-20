# Squad Contribution Guide — Skills Platform

This guide covers how squads and external contributors propose new SKILL.md files and new eval suite additions to the central skills platform. Changes to your own delivery-repo artefacts (stories, `workspace/`, `artefacts/`) do not require this process.

---

## Overview

The skills platform is a shared, governed asset. New skills, standards changes, and eval suite additions affect every team that consumes them. To maintain quality and auditability, all contributions flow through a structured proposal process with human review and platform-team merge authority.

---

## Step 1: Propose via feature branch

Create a feature branch in your fork (or a branch in this repo if you have contributor access). The branch should contain only the files described in Step 2. Do not bundle unrelated delivery-repo changes.

```
git checkout -b feature/my-skill-contribution
```

Open a draft PR against `master` as early as possible — it signals to the platform team that work is in progress and avoids duplication.

---

## Step 2: Required PR contents

Every contribution PR must include all three of the following artefacts. PRs missing any element will not be reviewed.

### 1. `SKILL.md` file

- Location: `.github/skills/<skill-name>/SKILL.md`
- Must follow the platform SKILL.md template (see `.github/templates/skill.md`)
- Must include: skill name, description, trigger phrases, output artefact paths, and state update instructions
- Outcome-oriented instructions only — no packaging details, no repo-local path assumptions

### 2. `EVAL.md` file

- Location: `.github/skills/<skill-name>/EVAL.md` (alongside the SKILL.md)
- Must contain at least 3 evaluation test cases
- Each test case **must** include both:
  - `traceId` — a reference to a committed trace file that evidences the skill running on a real story. The traceId must resolve to an existing file in `workspace/traces/[traceId]` or `platform/traces/[traceId]` (per p3.4 validation requirements). Relative paths using `../` or absolute paths are rejected.
  - `failurePattern` — a string describing the specific failure mode the test case guards against (e.g. `"skill exits without writing artefact"`, `"missing AC coverage field"`)
- Both fields are mandatory. A test case missing either field will fail the contribution validation check (`scripts/validate-suite-entry.js`)
- New scenarios are staged as proposals in `workspace/proposals/suite-additions/` — they are never written directly to `workspace/suite.json` or `platform/suite.json`. The platform team promotes accepted proposals to the suite via a separate PR.

### 3. Performance evidence

- A reference to a delivery story that used this skill, or metric movement evidence showing the skill improved an outer-loop outcome
- Acceptable formats: a link to a merged PR, a DoD artefact path, or a `benefit-metric.md` metric signal entry
- This requirement exists because skills are not accepted on theoretical merit alone — they must have demonstrated value in at least one real delivery cycle before being added to the platform library

---

## Step 3: Human approval gate

All contribution PRs require explicit sign-off from a **designated platform reviewer** before they can be merged. Sign-off is not automatic, not delegated to CI, and not self-assigned.

**Current designated platform reviewer:** Hamish (platform maintainer / operator)

When the platform team grows, the reviewer list will be updated in this guide and in a future CODEOWNERS file. Do not assume a PR is approved because CI passes — CI checks are a gate, not an approval.

To request review: assign the designated reviewer explicitly on the PR (do not just open and wait). If the reviewer is unavailable, add a comment noting the expected review window.

---

## Step 4: Merge path

**The contributing squad does not merge their own contribution PR.** After sign-off, the platform team (currently: Hamish) merges the contribution into `master`. This is intentional — it preserves the integrity of the skill library and ensures that no contribution lands without a final platform-side check.

If you merge your own PR before the platform reviewer has confirmed it, the contribution is considered out-of-process and may be reverted.

---

## PR description template

Use this template when opening your contribution PR. Complete all fields.

```
## Skill contribution: <skill name>

**Use case:** <one-sentence description of the problem this skill solves>

**Delivery story reference:** <link to a merged PR, DoD artefact path, or GitHub issue where this skill was used>

**EVAL.md test cases included:** <count — must be ≥3>
- Test case 1: <brief description>
- Test case 2: <brief description>
- Test case 3: <brief description>
(add more if applicable)

**Designated platform reviewer:** <name of the reviewer you are requesting sign-off from>

**Out of scope for this PR:** <any related work explicitly deferred>
```

---

## Quick reference: What's in scope vs out of scope for this process

| In scope — requires this process | Out of scope — does not require this process |
|---|---|
| New SKILL.md files under `.github/skills/` | Your delivery-repo stories, artefacts, workspace files |
| New standards files under `standards/` | Changes to your own `artefacts/` directory |
| Eval suite additions (EVAL.md, new suite scenarios) | Changes to `workspace/state.json` |
| Changes to `.github/copilot-instructions.md` | Typo fixes in documentation you own |
| Changes to `.github/templates/` | |
| Changes to `scripts/` platform governance checks | |
