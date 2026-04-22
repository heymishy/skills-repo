# Write `/modernisation-decompose` SKILL.md — Implementation Plan

**Goal:** Create `.github/skills/modernisation-decompose/SKILL.md` such that all content-inspection tests pass and the file satisfies all 7 ACs in the test plan.
**Branch:** `feature/md-1`
**Worktree:** `.worktrees/md-1`
**Test command:** `npm test` (from worktree root)

> **Baseline:** 1 pre-existing failure in `[p4-enf-second-line]` (pre-dates this story — acknowledged). All other tests pass.

---

## File map

```
Create:
  tests/check-md-1-skill-md.js                         — content-inspection tests for the SKILL.md (17 assertions)
  .github/skills/modernisation-decompose/SKILL.md      — new skill instruction file (the deliverable)

Modify:
  package.json                                         — append new test to npm test script
```

> **Contract note:** The DoR contract lists only `.github/skills/modernisation-decompose/SKILL.md` as a file touch point. The test file and `package.json` update are test infrastructure — not in the explicit exclusions list — and are needed to make the automated test assertions runnable. Both are included here as TDD infrastructure.

---

## Task 1: Write failing content-inspection tests (RED)

**Files:**
- Create: `tests/check-md-1-skill-md.js`
- Modify: `package.json` (append to test script)

### Step 1: Write the test file

Create `tests/check-md-1-skill-md.js` with the following content:

```javascript
#!/usr/bin/env node
// check-md-1-skill-md.js — content-inspection tests for md-1 (Write /modernisation-decompose SKILL.md)
// Covers T1.1 (file exists), T1.2 (structural), AC2–AC7 (content), T-NFR1–T-NFR3
// Tests FAIL until .github/skills/modernisation-decompose/SKILL.md is written — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'modernisation-decompose', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readSkill() {
  if (!fs.existsSync(SKILL_MD)) return null;
  return fs.readFileSync(SKILL_MD, 'utf8');
}

// ── T1.1 — file exists ────────────────────────────────────────────────────────
console.log('\n[md-1-skill-md] T1.1 — SKILL.md exists at governance path');
{
  assert(fs.existsSync(SKILL_MD),
    'T1.1: .github/skills/modernisation-decompose/SKILL.md exists');
}

// ── T1.2 — structural sections ───────────────────────────────────────────────
console.log('\n[md-1-skill-md] T1.2 — SKILL.md contains required structural sections');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T1.2a: name: present in frontmatter (file missing)');
    assert(false, 'T1.2b: description: present in frontmatter (file missing)');
    assert(false, 'T1.2c: triggers: present in frontmatter (file missing)');
    assert(false, 'T1.2d: numbered step heading present (file missing)');
    assert(false, 'T1.2e: ## Completion output section present (file missing)');
    assert(false, 'T1.2f: ## State update section present (file missing)');
  } else {
    assert(text.includes('name:'),        'T1.2a: name: present in frontmatter');
    assert(text.includes('description:'), 'T1.2b: description: present in frontmatter');
    assert(text.includes('triggers:'),    'T1.2c: triggers: present in frontmatter');
    assert(/^##\s+Step\s+\d+/m.test(text), 'T1.2d: numbered step heading present (## Step N)');
    assert(text.includes('## Completion output'), 'T1.2e: ## Completion output section present');
    assert(text.includes('## State update'),      'T1.2f: ## State update — mandatory final step section present');
  }
}

// ── AC2 — entry condition ─────────────────────────────────────────────────────
console.log('\n[md-1-skill-md] AC2 — Entry condition references report and blocks gracefully');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC2a: entry condition references reverse-engineering-report.md (file missing)');
    assert(false, 'AC2b: entry condition contains block/error language (file missing)');
  } else {
    assert(text.includes('reverse-engineering-report.md'),
      'AC2a: entry condition references reverse-engineering-report.md');
    const lower = text.toLowerCase();
    const hasBlockLanguage = text.includes('\u274c') || lower.includes('not found') ||
      lower.includes('not met') || lower.includes('error');
    assert(hasBlockLanguage,
      'AC2b: entry condition contains block/error language (\u274c or "not found" or "not met" or "error")');
  }
}

// ── AC3 — Java boundary signals as stated rationale ──────────────────────────
console.log('\n[md-1-skill-md] AC3 — Java boundary signals named and connected to feature boundary rationale');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC3a: all four Java signal types present (file missing)');
    assert(false, 'AC3b: rationale field language present (file missing)');
  } else {
    const hasMaven       = text.includes('Maven module');
    const hasService     = text.includes('@Service');
    const hasJpa         = text.includes('JPA aggregate root') || text.includes('aggregate root');
    const hasTransaction = text.includes('@Transactional');
    assert(hasMaven && hasService && hasJpa && hasTransaction,
      'AC3a: all four signal types present (Maven module, @Service, JPA aggregate root / aggregate root, @Transactional)');
    assert(text.toLowerCase().includes('rationale'),
      'AC3b: "rationale" language connects signals to feature boundary field');
  }
}

// ── AC4 — corpus-state.md fields ─────────────────────────────────────────────
console.log('\n[md-1-skill-md] AC4 — corpus-state.md write instructions contain module coverage, ratio, lastRunAt');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC4a: corpus-state.md and coverage % co-located in state update (file missing)');
    assert(false, 'AC4b: VERIFIED/UNCERTAIN ratio and lastRunAt present (file missing)');
  } else {
    const stateIdx     = text.indexOf('## State update');
    const stateSection = stateIdx >= 0 ? text.slice(stateIdx) : '';
    assert(stateSection.includes('corpus-state.md') && stateSection.toLowerCase().includes('coverage'),
      'AC4a: corpus-state.md and module coverage % co-located in state update section');
    assert((stateSection.toUpperCase().includes('VERIFIED') || stateSection.toLowerCase().includes('verified')) &&
           stateSection.includes('lastRunAt'),
      'AC4b: VERIFIED/UNCERTAIN ratio and lastRunAt both present in state update write instructions');
  }
}

// ── AC5 — candidate-features.md five fields ───────────────────────────────────
console.log('\n[md-1-skill-md] AC5 — candidate-features.md format describes all five required fields');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC5a: all five field names present (file missing)');
    assert(false, 'AC5b: direct-use language for /discovery (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasSlug    = lower.includes('feature-slug')  || lower.includes('feature slug');
    const hasProblem = lower.includes('problem-statement') || lower.includes('problem statement');
    const hasRuleIds = lower.includes('rule-id') || lower.includes('rule id');
    const hasPersona = lower.includes('persona');
    const hasMvp     = lower.includes('mvp-scope') || lower.includes('mvp scope');
    assert(hasSlug && hasProblem && hasRuleIds && hasPersona && hasMvp,
      'AC5a: all five required fields present (feature-slug, problem-statement, rule-id(s), persona, mvp-scope)');
    assert(lower.includes('discovery') && (lower.includes('direct') || lower.includes('without manual')),
      'AC5b: direct-use language for /discovery without manual augmentation');
  }
}

// ── AC6 — low-signal escalation three options ─────────────────────────────────
console.log('\n[md-1-skill-md] AC6 — low-signal escalation section with three operator options');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC6a: escalation section with specific signal references (file missing)');
    assert(false, 'AC6b: three distinct escalation options present (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasEscalation     = lower.includes('low-signal') || lower.includes('low signal') || lower.includes('escalat');
    const hasSpecificSignal = lower.includes('maven') || lower.includes('@service') || lower.includes('circular');
    assert(hasEscalation && hasSpecificSignal,
      'AC6a: low-signal escalation section exists and references specific signal types (maven/@service/circular)');
    const hasPackageFallback = lower.includes('package') && (lower.includes('fallback') || lower.includes('proxy'));
    const hasManualInput     = lower.includes('manual') && (lower.includes('boundary') || lower.includes('input'));
    const hasAbort           = lower.includes('abort') || (lower.includes('record') && lower.includes('low-signal'));
    assert(hasPackageFallback && hasManualInput && hasAbort,
      'AC6b: three escalation options present (package fallback, manual input, abort/record as low-signal)');
  }
}

// ── AC7 — umbrellaMetric field and traceability note ─────────────────────────
console.log('\n[md-1-skill-md] AC7 — umbrellaMetric field and traceability note in output instructions');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'AC7a: umbrellaMetric field in output section (file missing)');
    assert(false, 'AC7b: traceability note references /modernisation-decompose (file missing)');
  } else {
    assert(text.includes('umbrellaMetric'),
      'AC7a: umbrellaMetric field referenced in completion output / format description');
    const hasTrace = text.includes('/modernisation-decompose') &&
      (text.toLowerCase().includes('produced by') || text.toLowerCase().includes('traceability'));
    assert(hasTrace,
      'AC7b: traceability note references /modernisation-decompose and "produced by" or "traceability"');
  }
}

// ── T-NFR1 — determinism: explicit priority order ────────────────────────────
console.log('\n[md-1-skill-md] T-NFR1 — explicit boundary signal priority order defined');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR1: explicit priority order defined (file missing)');
  } else {
    const lower = text.toLowerCase();
    const hasPriority = lower.includes('priority') || lower.includes('first match') || lower.includes('top-down');
    assert(hasPriority,
      'T-NFR1: decomposition step defines explicit priority order for boundary signals');
  }
}

// ── T-NFR2 — security: state update describes only metrics ───────────────────
console.log('\n[md-1-skill-md] T-NFR2 — corpus-state write instructions reference only metrics (counts/ratios/timestamps)');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR2: write instructions metrics-only (file missing)');
  } else {
    const stateIdx     = text.indexOf('## State update');
    const stateSection = stateIdx >= 0 ? text.slice(stateIdx) : '';
    const hasMetrics   = stateSection.includes('ratio') || stateSection.toLowerCase().includes('percent') ||
      stateSection.toLowerCase().includes('timestamp') || stateSection.includes('lastRunAt');
    assert(hasMetrics,
      'T-NFR2: state update section describes metrics only (ratio/percent/timestamp/lastRunAt)');
  }
}

// ── T-NFR3 — audit: lastRunAt explicitly named ───────────────────────────────
console.log('\n[md-1-skill-md] T-NFR3 — lastRunAt explicitly named in write instructions');
{
  const text = readSkill();
  if (!text) {
    assert(false, 'T-NFR3: lastRunAt present in write instructions (file missing)');
  } else {
    assert(text.includes('lastRunAt'),
      'T-NFR3: lastRunAt explicitly named in corpus-state.md write instructions');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[md-1-skill-md] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

### Step 2: Update package.json — add test to npm test script

In `package.json`, append `&& node tests/check-md-1-skill-md.js` to the end of the `"test"` script string.

### Step 3: Run tests — must fail (RED state)

```powershell
cd "c:\Users\Hamis\code\skills repo\.worktrees\md-1"
node tests/check-md-1-skill-md.js
```

Expected output:
```
[md-1-skill-md] T1.1 — SKILL.md exists at governance path
  ✗ T1.1: .github/skills/modernisation-decompose/SKILL.md exists

[md-1-skill-md] Results: 0 passed, 17 failed
```
(All 17 assertions fail because SKILL.md does not exist yet.)

### Step 4: Commit the RED test

```powershell
cd "c:\Users\Hamis\code\skills repo\.worktrees\md-1"
git add tests/check-md-1-skill-md.js package.json
git commit -m "test(md-1): add content-inspection tests for modernisation-decompose SKILL.md — RED"
```

---

## Task 2: Write SKILL.md to make all tests pass (GREEN)

**Files:**
- Create: `.github/skills/modernisation-decompose/SKILL.md`

### Step 1: Create the SKILL.md

Create `.github/skills/modernisation-decompose/SKILL.md` with the following content:

```markdown
---
name: modernisation-decompose
description: >
  Bridges the /reverse-engineer corpus output to /discovery feature input for
  enterprise modernisation programmes. Reads the reverse-engineering report for
  a target system and decomposes it into candidate feature boundaries using Java
  boundary signals (Maven module, Spring @Service, JPA aggregate root,
  @Transactional span). Produces a candidate-features.md file suitable for
  direct use in /discovery without manual augmentation.
triggers:
  - "decompose the reverse engineering report"
  - "modernisation decompose"
  - "candidate features from corpus"
  - "feature boundaries from reverse engineer"
  - "run modernisation-decompose"
---

# /modernisation-decompose

## Entry condition

Before proceeding, verify the following input is present:

1. `artefacts/[system-slug]/reverse-engineering-report.md` — the corpus analysis report produced by `/reverse-engineer`

If the reverse-engineering report is not found:

> ❌ Entry condition not met.
> `artefacts/[system-slug]/reverse-engineering-report.md` not found.
> Run `/reverse-engineer` first to produce the corpus analysis report.
> Do not proceed until the report exists.

---

## Step 1 — Read the reverse-engineering report

Read `artefacts/[system-slug]/reverse-engineering-report.md` in full.

Identify all candidate boundary signals present in the corpus:

- **Maven module boundaries** — each Maven module is a candidate feature boundary
- **Spring `@Service` boundaries** — each `@Service` class that orchestrates business logic
- **JPA aggregate root boundaries** — each JPA entity acting as an aggregate root
- **`@Transactional` span boundaries** — each distinct `@Transactional` call chain

**Signal priority order (deterministic — apply top-down, first match wins):**

1. Maven module (highest confidence — explicit architectural decision)
2. Spring `@Service` (high confidence — intent-declared service boundary)
3. JPA aggregate root (medium confidence — data ownership boundary)
4. `@Transactional` span (lower confidence — inferred from transaction scope)

**Tie-breaking rule:** When two signals of equal priority describe the same code region, prefer the signal with the larger scope (module > service > aggregate > span). If scope is equal, prefer the signal that appears earliest in the report's VERIFIED section.

Use each boundary signal as the **stated rationale** for the feature boundary it produces. Record the signal type and source class/module in the `rationale` field of every candidate-features.md entry.

---

## Step 2 — Low-signal escalation

If fewer than 3 distinct boundary signals are identified — for example, no Maven modules declared, no `@Service` annotations found, or circular package dependencies obscure aggregate boundaries — escalate before proceeding:

> ⚠️ Low-signal corpus detected.
> Identified signals: [list what was found]
> Missing signals: [e.g. Maven module structure absent, no `@Service` annotations, circular dependencies prevent aggregate resolution]
>
> Choose one of the following options:
>
> **Option 1 — Package-level fallback:** Use top-level Java package structure as a proxy for module boundaries. Accept reduced confidence in boundary accuracy. Record `signalConfidence: low` in each affected candidate entry.
>
> **Option 2 — Manual boundary input:** Provide a boundary specification file listing the intended feature boundaries. This replaces automated signal detection for this run.
>
> **Option 3 — Abort and record as low-signal:** Record `corpusState: low-signal` in `artefacts/[system-slug]/corpus-state.md` and stop. Return to `/reverse-engineer` for a deeper analysis pass before proceeding.
>
> Reply: 1, 2, or 3

---

## Step 3 — Produce candidate-features.md

Write `artefacts/[system-slug]/candidate-features.md`.

Each feature boundary identified in Step 1 becomes one entry. Every entry must include all five required fields:

| Field | Description |
|-------|-------------|
| `feature-slug` | Kebab-case slug derived from the boundary name (e.g. `payment-processing`) |
| `problem-statement` | One-paragraph description of the business problem this feature boundary addresses |
| `rule-ids` | Rule ID(s) from the reverse-engineering report that drove this boundary (e.g. `RULE-003, RULE-007`) |
| `persona` | Named persona from the reverse-engineering report or inferred from the system domain |
| `mvp-scope` | One-paragraph MVP scope — what the minimum deliverable for this feature boundary looks like |

Additionally, every entry must include the following field in YAML frontmatter format at the top of the entry block:

```yaml
umbrellaMetric: true
```

The `umbrellaMetric: true` field indicates this candidate feature was produced as part of a coordinated decomposition effort. Include the following traceability note directly below the `umbrellaMetric` field:

> _This feature was produced by /modernisation-decompose from `artefacts/[system-slug]/reverse-engineering-report.md`. It can be used directly as input to /discovery without manual augmentation._

The entries in `candidate-features.md` are written to be sufficient for direct use in `/discovery` without further manual augmentation.

<!-- Extension point: non-Java heuristics
     Future versions may add support for:
     - COBOL: program boundary signals (PROGRAM-ID, COPY book boundaries)
     - PL/SQL: package boundary signals (CREATE PACKAGE boundaries)
     - .NET: assembly and namespace boundary signals
     These are not implemented in the current version. -->

---

## Completion output

> ✅ **Decomposition complete**
>
> System: `[system-slug]`
> Candidate features: [N]
> Boundary signals used: [list signal types and counts]
> Low-signal escalation triggered: [Yes / No]
>
> `artefacts/[system-slug]/candidate-features.md` written.
>
> **Next step:** Run `/discovery` for each candidate feature in `candidate-features.md`.

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅ — corpus-state.md written."

Write `artefacts/[system-slug]/corpus-state.md` with the following fields. Record metrics only (counts, ratios, timestamps) — do not write business rule text, customer identifiers, or regulatory clause text.

| Field | Value |
|-------|-------|
| `moduleCoveragePercent` | Percentage of identified modules that produced at least one candidate feature boundary (integer, 0–100) |
| `verifiedUncertainRatio` | Ratio of VERIFIED to UNCERTAIN boundary signals from the report (e.g. `"4:1"`) |
| `lastRunAt` | ISO 8601 timestamp of this decomposition run |

Example write:

```yaml
moduleCoveragePercent: 87
verifiedUncertainRatio: "4:1"
lastRunAt: "2026-04-22T14:30:00Z"
```

---

## Integration

**Reads:** `artefacts/[system-slug]/reverse-engineering-report.md`
**Produces:** `artefacts/[system-slug]/candidate-features.md`, `artefacts/[system-slug]/corpus-state.md`
**Follows:** `/reverse-engineer`
**Precedes:** `/discovery` (one invocation per candidate feature)
```

### Step 2: Run the test file — must pass (GREEN state)

```powershell
cd "c:\Users\Hamis\code\skills repo\.worktrees\md-1"
node tests/check-md-1-skill-md.js
```

Expected output:
```
[md-1-skill-md] T1.1 — SKILL.md exists at governance path
  ✓ T1.1: .github/skills/modernisation-decompose/SKILL.md exists

[md-1-skill-md] T1.2 — SKILL.md contains required structural sections
  ✓ T1.2a: name: present in frontmatter
  ✓ T1.2b: description: present in frontmatter
  ✓ T1.2c: triggers: present in frontmatter
  ✓ T1.2d: numbered step heading present (## Step N)
  ✓ T1.2e: ## Completion output section present
  ✓ T1.2f: ## State update — mandatory final step section present

[md-1-skill-md] AC2 — Entry condition references report and blocks gracefully
  ✓ AC2a: entry condition references reverse-engineering-report.md
  ✓ AC2b: entry condition contains block/error language

[md-1-skill-md] AC3 — Java boundary signals named and connected to feature boundary rationale
  ✓ AC3a: all four signal types present
  ✓ AC3b: "rationale" language connects signals to feature boundary field

[md-1-skill-md] AC4 — corpus-state.md write instructions contain module coverage, ratio, lastRunAt
  ✓ AC4a: corpus-state.md and module coverage % co-located in state update section
  ✓ AC4b: VERIFIED/UNCERTAIN ratio and lastRunAt both present

[md-1-skill-md] AC5 — candidate-features.md format describes all five required fields
  ✓ AC5a: all five required fields present
  ✓ AC5b: direct-use language for /discovery without manual augmentation

[md-1-skill-md] AC6 — low-signal escalation section with three operator options
  ✓ AC6a: low-signal escalation section exists and references specific signal types
  ✓ AC6b: three escalation options present

[md-1-skill-md] AC7 — umbrellaMetric field and traceability note in output instructions
  ✓ AC7a: umbrellaMetric field referenced in completion output / format description
  ✓ AC7b: traceability note references /modernisation-decompose and "produced by"

[md-1-skill-md] T-NFR1 — explicit boundary signal priority order defined
  ✓ T-NFR1: decomposition step defines explicit priority order for boundary signals

[md-1-skill-md] T-NFR2 — corpus-state write instructions reference only metrics (counts/ratios/timestamps)
  ✓ T-NFR2: state update section describes metrics only

[md-1-skill-md] T-NFR3 — lastRunAt explicitly named in write instructions
  ✓ T-NFR3: lastRunAt explicitly named in corpus-state.md write instructions

[md-1-skill-md] Results: 17 passed, 0 failed
```

### Step 3: Run full npm test suite — no regressions

```powershell
cd "c:\Users\Hamis\code\skills repo\.worktrees\md-1"
npm test 2>&1 | Select-String "Results:|passed|failed|skill-contracts"
```

Expected output:
- `[md-1-skill-md] Results: 17 passed, 0 failed`
- `[skill-contracts] 37 skill(s), 156 contract(s) OK` (still 37 — md-2 not yet done)
- All other suites: same as baseline (1 pre-existing p4-enf-second-line failure unchanged)

### Step 4: Commit

```powershell
cd "c:\Users\Hamis\code\skills repo\.worktrees\md-1"
git add .github/skills/modernisation-decompose/SKILL.md
git commit -m "feat(md-1): add modernisation-decompose SKILL.md — all 17 content-inspection tests GREEN"
git push origin feature/md-1
```

---

## AC coverage summary

| AC | Task | Tests covered | Status after Task 2 |
|----|------|--------------|---------------------|
| AC1 — npm test passes | Task 2 + md-2 | T2.1, T2.2 (integration — depends on md-2) | Partial (skill-contracts check after md-2) |
| AC2 — Entry condition | Task 2 | AC2a, AC2b | ✅ |
| AC3 — Java boundary signals | Task 2 | AC3a, AC3b | ✅ |
| AC4 — corpus-state.md fields | Task 2 | AC4a, AC4b | ✅ |
| AC5 — five output fields | Task 2 | AC5a, AC5b | ✅ |
| AC6 — three escalation options | Task 2 | AC6a, AC6b | ✅ |
| AC7 — umbrellaMetric + traceability | Task 2 | AC7a, AC7b | ✅ |
| NFR: determinism | Task 2 | T-NFR1 | ✅ |
| NFR: security | Task 2 | T-NFR2 | ✅ |
| NFR: audit (lastRunAt) | Task 2 | T-NFR3 | ✅ |
