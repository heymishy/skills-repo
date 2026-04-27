# Candidate intake and framework selection — Implementation Plan

**Goal:** Create `.github/skills/prioritise/SKILL.md` (partial — intake and framework selection sections only) and `tests/check-pr.1.js`. All 11 tests must pass.
**Branch:** `feature/pr.1`
**Worktree:** `.worktrees/pr.1`
**Test command:** `node tests/check-pr.1.js`
**Full suite:** `npm test`
**Model class:** balanced

---

## File map

```
Create:
  .github/skills/prioritise/SKILL.md   — partial SKILL.md: opening, intake, framework selection (pr.1 scope only)
  tests/check-pr.1.js                  — 11 assertions for pr.1 ACs (pattern checks on SKILL.md + contracts integration)
```

---

## Task 1: Write failing test script (tests/check-pr.1.js)

**Files:**
- Create: `tests/check-pr.1.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-pr.1.js` with the exact content below. Run it before SKILL.md exists — all tests must fail (SKILL.md does not exist yet).

```js
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT       = path.resolve(__dirname, '..');
const SKILL_PATH = path.join(ROOT, '.github', 'skills', 'prioritise', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(name, condition, detail) {
  if (condition) {
    process.stdout.write(`  \u2714 ${name}\n`);
    passed++;
  } else {
    process.stderr.write(`  \u2718 ${name}\n`);
    if (detail) process.stderr.write(`    \u2514\u2500 ${detail}\n`);
    failed++;
  }
}

process.stdout.write('\npr.1 \u2014 Candidate intake and framework selection\n\n');

// Pre-condition check
const skillExists = fs.existsSync(SKILL_PATH);
assert('SKILL.md exists at .github/skills/prioritise/SKILL.md', skillExists);

const content = skillExists ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

// AC1 \u2014 WSJF and "cost of delay" in proximity (within 500 chars)
const wsjfIdx = content.toLowerCase().indexOf('wsjf');
const codIdx  = content.toLowerCase().indexOf('cost of delay');
const wsjfCodProximity = wsjfIdx !== -1 && codIdx !== -1 && Math.abs(wsjfIdx - codIdx) < 500;
assert(
  'AC1: names WSJF and mentions "cost of delay" in proximity',
  wsjfCodProximity,
  '"WSJF" and "cost of delay" must both appear within 500 chars of each other'
);

// AC1 \u2014 RICE + all four factors
const hasRice       = content.includes('RICE');
const hasReach      = content.includes('Reach');
const hasImpact     = content.includes('Impact');
const hasConfidence = content.includes('Confidence');
const hasEffort     = content.includes('Effort');
assert(
  'AC1: names RICE with all four factors (Reach, Impact, Confidence, Effort)',
  hasRice && hasReach && hasImpact && hasConfidence && hasEffort,
  'One or more of: RICE, Reach, Impact, Confidence, Effort — not found'
);

// AC1 \u2014 MoSCoW + all four buckets
const hasMoscow = content.includes('MoSCoW');
const hasMust   = content.includes('Must-have');
const hasShould = content.includes('Should-have');
const hasCould  = content.includes('Could-have');
const hasWont   = content.includes("Won't-have") || content.includes("Won't have");
assert(
  "AC1: names MoSCoW with all four buckets (Must-have, Should-have, Could-have, Won't-have)",
  hasMoscow && hasMust && hasShould && hasCould && hasWont,
  'One or more MoSCoW buckets not found'
);

// AC2 \u2014 acknowledge/confirm candidate list
const ac2IntakePatterns = [
  'acknowledge', 'confirm the list', 'candidate list is complete',
  'complete the list', 'confirm the candidate',
];
const hasAc2Intake = ac2IntakePatterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC2: instructs skill to acknowledge/confirm candidate list before proceeding',
  hasAc2Intake,
  `Expected one of: ${ac2IntakePatterns.join(', ')}`
);

// AC2 \u2014 ask for missing context
const ac2ContextPatterns = ['goals', 'time horizon', 'decision audience', 'missing context'];
const hasAc2Context = ac2ContextPatterns.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC2: instructs skill to ask for missing context before framework selection',
  hasAc2Context,
  `Expected one of: ${ac2ContextPatterns.join(', ')}`
);

// AC3 \u2014 framework suggestion states a reason/rationale
const ac3Rationale = ['primary reason', 'fits', 'because', 'rationale', 'reason it fits'];
const hasAc3Rationale = ac3Rationale.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC3: framework suggestion includes a stated reason/rationale',
  hasAc3Rationale,
  `Expected one of: ${ac3Rationale.join(', ')}`
);

// AC3 \u2014 confirm or override before proceeding to scoring
const ac3Confirm = [
  'confirm or override', 'explicit confirm', 'does not proceed without',
  'proceed without an explicit', 'confirm before', 'without confirmation',
];
const hasAc3Confirm = ac3Confirm.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC3: instructs skill to wait for confirm/override before scoring',
  hasAc3Confirm,
  `Expected one of: ${ac3Confirm.join(', ')}`
);

// AC4 \u2014 override accepted without re-arguing
const ac4Override = [
  'without re-arguing', 'accept the choice', 'does not re-suggest',
  'accepts the override', 'override is final',
];
const hasAc4 = ac4Override.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC4: instructs skill to accept override without re-arguing',
  hasAc4,
  `Expected one of: ${ac4Override.join(', ')}`
);

// AC5 \u2014 at most two clarifying questions
const ac5Limit = ['at most two', 'two clarifying', 'no more than two', 'maximum two', 'max two'];
const hasAc5 = ac5Limit.some(p => content.toLowerCase().includes(p.toLowerCase()));
assert(
  'AC5: instructs skill to ask at most two clarifying questions before suggesting',
  hasAc5,
  `Expected one of: ${ac5Limit.join(', ')}`
);

// AC6 \u2014 check-skill-contracts.js exits 0
// Note: the 'prioritise' contract entry is added by pr.5; this test verifies the
// partial file does not break any existing contracts.
try {
  execSync('node .github/scripts/check-skill-contracts.js', { cwd: ROOT, stdio: 'pipe' });
  assert('AC6: check-skill-contracts.js exits 0 with no violations', true);
} catch (e) {
  const stderr = e.stderr ? e.stderr.toString().slice(0, 300) : e.message;
  assert('AC6: check-skill-contracts.js exits 0 with no violations', false, stderr);
}

// NFR \u2014 no non-comment HTML tags in SKILL.md
const commentStripped = content.replace(/<!--[\s\S]*?-->/g, '');
const htmlTags = commentStripped.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
assert(
  'NFR: SKILL.md contains no embedded HTML except HTML comments',
  htmlTags.length === 0,
  `Found ${htmlTags.length} non-comment HTML tag(s): ${htmlTags.slice(0, 3).join(', ')}`
);

// Summary
process.stdout.write(`\n[check-pr.1] Results: ${passed} passed, ${failed} failed\n\n`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Run test — must fail**

```bash
cd .worktrees/pr.1
node tests/check-pr.1.js
```

Expected output:
```
pr.1 — Candidate intake and framework selection

  ✘ SKILL.md exists at .github/skills/prioritise/SKILL.md
  ✘ AC1: names WSJF and mentions "cost of delay" in proximity
  ✘ AC1: names RICE with all four factors (Reach, Impact, Confidence, Effort)
  ✘ AC1: names MoSCoW with all four buckets (Must-have, Should-have, Could-have, Won't-have)
  ✘ AC2: instructs skill to acknowledge/confirm candidate list before proceeding
  ✘ AC2: instructs skill to ask for missing context before framework selection
  ✘ AC3: framework suggestion includes a stated reason/rationale
  ✘ AC3: instructs skill to wait for confirm/override before scoring
  ✘ AC4: instructs skill to accept override without re-arguing
  ✘ AC5: instructs skill to ask at most two clarifying questions before suggesting
  ✔ AC6: check-skill-contracts.js exits 0 with no violations
  ✘ NFR: SKILL.md contains no embedded HTML except HTML comments

[check-pr.1] Results: 1 passed, 11 failed
```

(AC6 passes immediately — `prioritise` is not yet in `CONTRACTS[]`, so the script exits 0 for the existing skills.)

- [ ] **Step 3: No implementation here — commit the failing test**

```bash
git add tests/check-pr.1.js
git commit -m "test(pr.1): add failing tests for candidate intake and framework selection"
```

---

## Task 2: Create SKILL.md to make tests pass

**Files:**
- Create: `.github/skills/prioritise/SKILL.md`

- [ ] **Step 1: Create the directory and file**

Create `.github/skills/prioritise/` if it does not exist, then create `.github/skills/prioritise/SKILL.md` with the exact content below.

```markdown
---
name: prioritise
description: >
  Guides tech leads, product managers, and business leaders through structured
  prioritisation sessions using WSJF, RICE, or MoSCoW frameworks. Accepts
  candidate items, suggests a framework with rationale, conducts a conversational
  scoring pass, and produces a saved ranked artefact with rationale. Supports
  single-framework scoring, multi-framework comparison, workshopping with
  distributed teams, and divergence handling.
triggers:
  - "/prioritise"
  - "prioritise"
  - "prioritization"
  - "prioritisation"
  - "help me prioritise"
  - "rank these items"
  - "score these features"
---

# /prioritise — Multi-Framework Prioritisation Skill

## Opening

When the skill is invoked, open with a brief statement that explains the skill's
purpose and introduces the three available frameworks. Use this exact structure:

> **`/prioritise` helps you rank a list of candidate items using a structured
> framework so that your decision is traceable and rationale-driven.**
>
> **Three frameworks are available:**
>
> - **WSJF (Weighted Shortest Job First):** Ranks items by their cost of delay
>   relative to effort. The primary signal is cost of delay — how much value is
>   lost the longer you wait. Use WSJF when time pressure and opportunity cost
>   are the main decision drivers.
>
> - **RICE (Reach, Impact, Confidence, Effort):** Scores items across four
>   factors — Reach (how many people are affected), Impact (magnitude of the
>   change), Confidence (how certain you are), and Effort (time or resources
>   needed). Use RICE when you need a multi-signal score that accounts for
>   uncertainty.
>
> - **MoSCoW:** Classifies items into four buckets — Must-have, Should-have,
>   Could-have, and Won't-have. Use MoSCoW when you need a fast, team-aligned
>   categorisation rather than a numerical ranking.

Then invite the operator to provide their candidate items:

> **To start, describe the items you want to prioritise. You can list them in
> any order and in plain language — bullet points, numbered list, or free text
> all work.**

---

## Step 1 — Candidate intake

### Receiving the candidate list

When the operator provides their items, acknowledge all items explicitly.
State the count and list them back to confirm before proceeding:

> "I've received your list of [N] items:
>
> 1. [Item 1]
> 2. [Item 2]
> ...
>
> Before we select a framework, I want to make sure the candidate list is
> complete and I have the right context."

Do not proceed to framework selection until the candidate list is confirmed.

### Gathering missing context

Ask for any missing context needed to suggest the right framework.
Ask at most two clarifying questions in a single turn — no more than two —
before making a suggestion. Do not wait for perfect information.

The highest-value questions are:

- **Goals:** "What decision does this prioritisation need to support — e.g.
  sprint planning, roadmap sequencing, budget allocation, or stakeholder
  communication?"
- **Time horizon:** "What's the timeframe for acting on this? (e.g. next
  sprint, next quarter, next year)"
- **Decision audience:** "Who will use this ranking — engineers, executives,
  or a mixed group?"

If the operator has already provided context (e.g. their description includes
a goal or timeframe), do not re-ask for it. Ask only for what is missing.

### Confirming the candidate list is complete

Before proceeding to framework selection, confirm the candidate list is
complete:

> "Does this list look right? Are there any items missing or any you'd like
> to remove before we start scoring?"

Do not proceed until the operator confirms the candidate list is complete
or indicates they are ready to continue.

---

## Step 2 — Framework suggestion

### Making a suggestion

Once the candidate list is confirmed and context gathered, suggest a framework.
The suggestion must:

1. **Name the framework** explicitly (e.g. "I suggest WSJF")
2. **State the primary reason it fits** — tie the rationale to something
   the operator said. For example:
   - "WSJF — you mentioned delivery timeline and opportunity cost are the key
     drivers, and cost of delay is WSJF's primary signal."
   - "RICE — you have a mixed audience and need a score that accounts for both
     reach and uncertainty, which RICE handles via the Confidence factor."
   - "MoSCoW — you need fast team alignment on scope boundaries rather than
     a numerical ranking, which is exactly what MoSCoW is designed for."
3. **Invite confirmation or override** — do not proceed without an explicit
   confirm from the operator:
   > "Does this work for you, or would you prefer a different framework?
   > (WSJF / RICE / MoSCoW)"

### Accepting an override

If the operator chooses a different framework, accept the choice without
re-arguing. The operator's override is final.

- Confirm the selected framework
- Proceed to scoring immediately
- Do not re-suggest the original recommendation
- Do not explain why the original choice was better

Example:
> Operator: "Actually, let's use MoSCoW."
> Skill: "MoSCoW it is. Let's score your [N] items."

---

<!-- pr.2: conversational scoring section (WSJF, RICE, MoSCoW passes) added here -->

<!-- pr.3: multi-pass orchestration and divergence handling added here -->

<!-- pr.4: socialisation and workshopping features added here -->

<!-- pr.5: output format, artefact save, rationale enforcement, and extension point added here -->
```

- [ ] **Step 2: Run test — must pass**

```bash
node tests/check-pr.1.js
```

Expected output:
```
pr.1 — Candidate intake and framework selection

  ✔ SKILL.md exists at .github/skills/prioritise/SKILL.md
  ✔ AC1: names WSJF and mentions "cost of delay" in proximity
  ✔ AC1: names RICE with all four factors (Reach, Impact, Confidence, Effort)
  ✔ AC1: names MoSCoW with all four buckets (Must-have, Should-have, Could-have, Won't-have)
  ✔ AC2: instructs skill to acknowledge/confirm candidate list before proceeding
  ✔ AC2: instructs skill to ask for missing context before framework selection
  ✔ AC3: framework suggestion includes a stated reason/rationale
  ✔ AC3: instructs skill to wait for confirm/override before scoring
  ✔ AC4: instructs skill to accept override without re-arguing
  ✔ AC5: instructs skill to ask at most two clarifying questions before suggesting
  ✔ AC6: check-skill-contracts.js exits 0 with no violations
  ✔ NFR: SKILL.md contains no embedded HTML except HTML comments

[check-pr.1] Results: 12 passed, 0 failed
```

- [ ] **Step 3: Run full npm test — confirm pre-existing failures only**

```bash
npm test 2>&1 | tail -15
```

Expected output:
```
[assurance-gate-check] Results: 16 passed, 2 failed

  Failures:
    ✘ workflow-yaml-uses-pinned-immutable-ref: ...
    ✘ download-uses-https-not-http: ...
```

These 2 failures are pre-existing p3.3 issues, unrelated to pr.1. Confirmed acknowledged in DoR.

- [ ] **Step 4: Commit**

```bash
git add .github/skills/prioritise/SKILL.md
git commit -m "feat(pr.1): create /prioritise SKILL.md — intake and framework selection"
```

---

## Task 3: Open draft PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin feature/pr.1
```

- [ ] **Step 2: Open draft PR**

```bash
gh pr create --draft \
  --title "feat(pr.1): /prioritise skill — candidate intake and framework selection" \
  --body "## Summary

Implements pr.1 (candidate intake and framework selection) for the /prioritise skill.

## Story

artefacts/2026-04-27-prioritise-skill/stories/pr.1.md

## What this PR adds

- \`.github/skills/prioritise/SKILL.md\` (partial — intake + framework selection sections only)
- \`tests/check-pr.1.js\` (11 tests for pr.1 ACs)

## Tests

\`node tests/check-pr.1.js\` — 12 passed, 0 failed

## Pre-existing failures

npm test: 2 failures (p3.3 workflow pinned ref / HTTPS) — pre-existing, unrelated to pr.1.

## Oversight

High — operator reviews SKILL.md content for conversational quality before merging." \
  --base master
```

---

## Self-review checklist

- [x] Exact file paths — no `[placeholder]` remaining
- [x] Complete code in Step 3 of each task — not "add validation here"
- [x] Failing test written before implementation step (Task 1 → Task 2)
- [x] Expected output for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond pr.1 ACs (no scoring, no divergence, no workshopping, no output format)
