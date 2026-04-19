# Implementation Plan: Spike A — Governance Logic Extractability

**Story:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-a.md
**DoR:** artefacts/2026-04-19-skills-platform-phase4/dor/p4-spike-a-dor.md
**Test file:** tests/check-p4-spike-a.js
**Plan saved:** 2026-04-19
**Model class:** balanced (context.yml routing default)

**Loaded:** Spike A — Governance Logic Extractability
ACs: 5 | Tests: T1–T12 + T-NFR1 (13 assertions) | Arch constraints: ADR-004, MC-CORRECT-02, C5, C4, C11, MC-SEC-02

> **Oversight: HIGH** — heymishy explicit approval required; coding agent must NOT run the investigation (Task 2); draft PR only; no self-merge.

---

## Deviation note

The DoR contract lists the spike output path as `reference/spike-a-output.md`. The test file (`tests/check-p4-spike-a.js`) and test plan use `spikes/spike-a-output.md`. **Resolved: use `spikes/spike-a-output.md`** to match the tests. This deviation is noted here; the DoR contract artefact is read-only and is not updated.

---

## File map

| File | Action | Tests served |
|------|--------|-------------|
| `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md` | CREATE | T1, T2, T3, T4+T5 (PROCEED), T6+T7 (REDESIGN), T9, T-NFR1 |
| `.github/pipeline-state.schema.json` | MODIFY | Pre-condition for MC-CORRECT-02 compliance |
| `.github/pipeline-state.json` | MODIFY | T8, T9 |
| `artefacts/2026-04-19-skills-platform-phase4/decisions.md` | MODIFY | T10 |
| `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md` | MODIFY | T12 |

---

## Tasks

---

### Task 1 — Add `phase4.spikes` to pipeline-state schema
**Model class:** balanced
**AC:** pre-condition (MC-CORRECT-02 — schema before data)
**Type:** agent-executable now (no verdict needed; scaffold only)

#### Step 1 — Run test to confirm T8 fails cleanly
```
cd .worktrees/p4-spike-a
node tests/check-p4-spike-a.js 2>&1
```
Expected output: T1 fails (spike file missing), T8 fails ("pipeline-state.json contains a spike-a entry under phase4").

#### Step 2 — Add `phase4` property to `.github/pipeline-state.schema.json`

Add inside the root `"properties"` object, after the `"features"` property:

```json
    "phase4": {
      "type": "object",
      "description": "Phase 4 spike verdicts shortcut — convenience lookup for tests and tooling that need to check spike verdicts without navigating features[]. Updated at spike closeout alongside features[0].spikes[].verdict.",
      "properties": {
        "spikes": {
          "type": "object",
          "description": "Spike verdict map. Keys are spike-id strings (spike-a, spike-b1, spike-b2, spike-c, spike-d). Values are verdict objects.",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "verdict":        { "type": ["string", "null"], "enum": ["PROCEED", "REDESIGN", "DEFER", "REJECT", null] },
              "verdictAt":      { "type": "string", "format": "date-time" },
              "outputArtefact": { "type": "string", "description": "Relative path to the spike output artefact" }
            }
          }
        }
      }
    }
```

#### Step 3 — Add `phase4` scaffold to `.github/pipeline-state.json`

Add at the top level (after `"programmes"` array), **before the verdict is known** — all verdicts null:

```json
  "phase4": {
    "spikes": {
      "spike-a":  { "verdict": null, "verdictAt": null, "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md" },
      "spike-b1": { "verdict": null, "verdictAt": null, "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b1-output.md" },
      "spike-b2": { "verdict": null, "verdictAt": null, "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md" },
      "spike-c":  { "verdict": null, "verdictAt": null, "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-c-output.md" },
      "spike-d":  { "verdict": null, "verdictAt": null, "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-d-output.md" }
    }
  }
```

#### Step 4 — Add Spike A reference to `p4-enf-mcp.md` Dependencies section

In `artefacts/2026-04-19-skills-platform-phase4/stories/p4-enf-mcp.md`, the Dependencies section currently reads:

```markdown
- **Upstream:** p4.enf-decision must be committed ...; p4.spike-b1 must have PROCEED or REDESIGN verdict
```

Add one additional bullet:

```markdown
- Spike A output artefact: the governance package interface that p4-enf-package implements is derived from Spike A's verdict at `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md`; the MCP adapter depends on the governance package (p4.enf-package) which in turn implements the Spike A interface — this story must not enter DoR until Spike A has a PROCEED or REDESIGN verdict
```

#### Step 5 — Validate JSON and run tests

```
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.github/pipeline-state.json','utf8')); console.log('valid')"
node tests/check-p4-spike-a.js 2>&1
```

Expected: T1 still fails (spike file missing), but T8 now passes ("pipeline-state.json contains a spike-a entry under phase4"). T8b fails (verdict is null, not a valid verdict string — this is correct TDD; T8b will pass after verdict is written in Task 4).

#### Commit message
```
chore: scaffold phase4.spikes in schema + state; add spike-a ref to p4-enf-mcp
```

---

### Task 2 — Run governance logic extractability investigation
**Model class:** deep-reasoning
**AC:** AC1, AC2, AC3
**Type:** OPERATOR-ONLY — heymishy; coding agent must not execute this task

This is the spike investigation proper. It is manual analytical work.

#### What to investigate

The question: **Can the governance logic currently embedded in `scripts/`, `tests/check-governance-gates.js`, and `src/` be extracted into a shared npm package that consumer repos can install — without violating C11 (no persistent hosted runtime)?**

The five operations that must be extractable:

| Operation | Current location | Key question |
|-----------|-----------------|--------------|
| `skill-resolution` | scripts/ or SKILL.md reader logic | Does it need file-system state beyond the package itself? |
| `hash-verification` | scripts/validate-trace.sh, check-governance-gates.js | Pure function — just needs skill content + expected hash? |
| `gate-evaluation` | tests/check-*.js governance checks | Stateless per-feature evaluation or does it read live pipeline-state? |
| `state-advancement` | pipeline-state.json write logic (skill-level) | Can it be a pure transform function (takes state in, returns new state)? |
| `trace-writing` | scripts/validate-trace.sh or trace-registry | Does it need a server process, or is it a CLI invocation / file write? |

#### Questions to answer during investigation

1. Is each operation a pure function (same inputs → same outputs, no side effects beyond return value)?
2. Can all 5 be distributed as a single `npm install`-able package without a persistent process?
3. Does any operation require an always-on server (violates C11)?
4. Is there a natural package boundary, or do the operations have circular dependencies on repo-local config?
5. Would a package work for both CI (headless) and interactive (VS Code/MCP) surfaces without modification?

#### Decision tree for verdict

| Finding | Verdict | Consequence |
|---------|---------|-------------|
| All 5 operations are pure functions, packageable without persistent runtime | **PROCEED** | Define the interface (Task 3 — PROCEED template); E3 stories implement the package |
| Operations are pure but share runtime state that can't be cleanly injected | **REDESIGN** | Define the constraint and minimum shared contract (Task 3 — REDESIGN template) |
| Operations require persistent runtime (violates C11) | **REDESIGN** | C11 is the blocking constraint; define schema-only contract instead |
| Too many unknowns to recommend PROCEED or REDESIGN | **DEFER** | Record the open questions; do not begin E3 stories |

---

### Task 3 — Write spike output artefact
**Model class:** balanced (heymishy writes; agent can review)
**AC:** AC1, AC2 (PROCEED), AC3 (REDESIGN)
**Type:** operator writes content; agent provides template

Create the file at:
```
artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md
```

#### Template — PROCEED verdict

```markdown
# Spike A Output: Governance Logic Extractability

**Spike:** p4-spike-a
**Verdict: PROCEED**
**Date:** [YYYY-MM-DD]
**Author:** heymishy

## Rationale

[3+ sentences explaining why PROCEED. Example structure:
The five governance operations — skill-resolution, hash-verification, gate-evaluation, state-advancement, and trace-writing — are each pure functions that take explicit inputs and produce deterministic outputs without requiring a persistent runtime process.
A shared npm package or git-subtree distribution is feasible within the C11 constraint: consumer repos install once and invoke the functions per-call, with no server startup required.
The interface is self-contained enough that both CI/headless and MCP/interactive surfaces can call the same functions with surface-appropriate configuration injected via context.yml.]

## Package Interface

The shared governance package must export at minimum the following five entry points:

### `resolveSkill(skillId, contextPath)` (skill-resolution)
- Input: skill identifier string, path to `.github/context.yml`
- Output: `{ skillBody: string, hash: string, version: string }`
- No persistent state required

### `verifyHash(skillBody, expectedHash)` (hash-verification)
- Input: raw skill body string, expected SHA-256 hash string from lockfile
- Output: `{ result: "HASH_MATCH" | "HASH_MISMATCH", actualHash: string }`
- Pure function — no I/O

### `evaluateGate(gateId, featureState)` (gate-evaluation)
- Input: gate identifier string, feature state object (from pipeline-state.json feature entry)
- Output: `{ state: "pass" | "warn" | "fail" | "na", findings: string[] }`
- Stateless evaluation — caller provides state

### `advanceState(currentState, transition, payload)` (state-advancement)
- Input: current feature/story state object, transition name string, payload object
- Output: updated state object (pure transform — caller writes to file)
- No file I/O inside the function

### `writeTrace(traceEntry, traceFilePath)` (trace-writing)
- Input: structured trace entry object, output file path
- Output: `{ written: true, path: string }` — writes one trace entry to JSONL file
- Minimal I/O — one file write per call; no server process

## C11 Compliance

[Explain how the package satisfies C11: no persistent hosted runtime. Example:
All five functions terminate on return. There is no background process, no server to start, and no keepalive mechanism. The package is a pure function library.]
```

#### Template — REDESIGN verdict

```markdown
# Spike A Output: Governance Logic Extractability

**Spike:** p4-spike-a
**Verdict: REDESIGN**
**Date:** [YYYY-MM-DD]
**Author:** heymishy

## Rationale

[3+ sentences explaining why REDESIGN. Example:
The investigation found that [specific operation X] cannot be cleanly isolated as a pure function because [reason].
While four of the five operations are packageable, [operation Y] requires [problematic dependency], which cannot be injected cleanly at call time.
The minimum viable shared contract is a schema-and-contracts approach rather than a shared code package: consumers agree on the skill-format schema and trace-schema, and each surface class implements its own governance logic against those schemas.]

## Blocking Constraint

[Specific technical reason. Example:
The `gate-evaluation` operation reads `governance-gates.yml` from the consumer's `.github/` directory using a hardcoded relative path that assumes a specific repo layout. This path assumption cannot be parameterised without breaking all existing consumers. Packaging this function would require a breaking change to consumer repo layout, which violates the non-fork constraint (C1).]

## Minimum Shared Contract

The following two schemas must be versioned and shared across all consumer repos regardless of whether a shared code package exists:

### `skill-format` schema
A JSON Schema or YAML schema defining the required fields in any `SKILL.md` file: `name`, `description`, `triggers`, and at least one `entry-condition` block. All skills in all consumer repos must conform to this schema.

### `trace-schema`
A JSON Schema defining the required fields in any trace entry: `skillId`, `skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`. Consumers validate trace entries against this schema during CI.

## Per-Surface Implementation

[Brief table showing which surface class implements what, referencing Spike B1/B2 findings.]
```

#### Run command after writing the file

```
node tests/check-p4-spike-a.js 2>&1
```

Expected (after PROCEED verdict): T1 ✓, T2 ✓, T3 ✓ (rationale ≥3 sentences), T4 ✓ (all 5 operations present), T5 ✓ (each has signature detail), T6+T7 skipped (not REDESIGN), T8 ✗ (verdict still null in state), T9 ✗, T10 ✗, T-NFR1 ✓.

---

### Task 4 — Write verdict to pipeline-state.json (both paths)
**Model class:** balanced
**AC:** AC4 (T8, T9)
**Type:** execute after verdict is known from Task 3

After heymishy has written the spike output artefact with a verdict, update `.github/pipeline-state.json`:

#### Update 1 — `phase4.spikes.spike-a`

Replace the null scaffold written in Task 1 with the actual verdict:

```json
"spike-a": { "verdict": "[VERDICT]", "verdictAt": "[ISO-8601-TIMESTAMP]", "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md" }
```

#### Update 2 — `features[0].spikes[0]` (the canonical location)

Set `verdict` on the `spike-a` entry in the feature-level spikes array:

```json
{ "id": "spike-a", "storySlug": "p4-spike-a", "verdict": "[VERDICT]", "verdictAt": "[ISO-8601-TIMESTAMP]", "outputArtefact": "artefacts/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md" }
```

#### Run command

```
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.github/pipeline-state.json','utf8')); console.log('valid')"
node tests/check-p4-spike-a.js 2>&1
```

Expected: T8 ✓, T8b ✓, T9 ✓ (both state verdict and artefact verdict match).

#### Commit message

```
feat(spike-a): record [VERDICT] verdict in pipeline-state.json — both phase4.spikes and features[0].spikes
```

---

### Task 5 — Add Spike A ADR entry to decisions.md
**Model class:** balanced
**AC:** AC4 (T10)
**Type:** heymishy writes content; agent provides template

Append the following entry to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` after the last existing `---` separator:

```markdown
---
**2026-04-19 | ARCH | p4-spike-a closeout**
**Decision:** [One sentence: PROCEED/REDESIGN — brief summary of what was decided about governance logic extractability. Example: "Governance logic is extractable as a shared package (PROCEED) — five named operations are pure functions that satisfy C11."]
**Alternatives considered:** (A) PROCEED — shared npm package exporting all 5 governance operations as pure functions. (B) REDESIGN — schema-only shared contract (skill-format schema + trace-schema); each surface class implements its own governance logic. (C) DEFER — insufficient evidence to choose; spike window extended. (D) REJECT — governance logic cannot be shared; each consumer duplicates independently.
**Rationale:** [2–4 sentences: why this verdict? What specific evidence from the investigation led here? Which operations were examined and what was the key finding?]
**Made by:** heymishy — operator manual investigation; verdict not automated
**Revisit trigger:** If Spike B1 or B2 reveals that the chosen package interface cannot support the MCP or CI surface class without a persistent runtime, reopen this ADR and reconsider REDESIGN path.
---
```

#### Run command after adding the entry

```
node tests/check-p4-spike-a.js 2>&1
```

Expected: T10a ✓ (Spike A ARCH entry found), T10b ✓ (decision statement), T10c ✓ (alternatives considered), T10d ✓ (rationale), T10e ✓ (revisit trigger).

#### Commit message

```
docs(spike-a): add Spike A ADR to decisions.md — [VERDICT] verdict for governance logic extractability
```

---

## Pre-investigation scaffold (Tasks 1, 4-part-1, and AC5 fix) — agent-executable now

The following actions do not require the verdict and can be executed immediately:
- Task 1 (schema + state scaffold + p4-enf-mcp.md fix) — execute now
- After investigation: Task 4 (write actual verdict values)
- After investigation: Task 5 (write ADR)

---

## Full test run expectations

**Before investigation (after Task 1 scaffold):**
- T1 ✗ (spike file missing)
- T2 ✗ (no file)
- T3 ✗ (no file)
- T4+T5 skipped (not PROCEED yet)
- T6+T7 skipped (not REDESIGN yet)
- T8 ✓ (phase4.spikes.spike-a entry exists)
- T8b ✗ (verdict is null, not a valid string)
- T9 ✗ (no artefact to compare)
- T10 ✗ (no ARCH entry yet)
- T11 ✓ (p4-enf-package.md already references spike-a)
- T12 ✓ (p4-enf-mcp.md updated in Task 1 Step 4)
- T-NFR1 ✗ (file missing)

**After full completion (Tasks 2–5 done, PROCEED verdict):**
- T1 ✓, T2 ✓, T3 ✓, T4 ✓, T5 ✓, T6+T7 skipped, T8 ✓, T8b ✓, T9 ✓, T10a–T10e ✓, T11 ✓, T12 ✓, T-NFR1 ✓

**After full completion (REDESIGN verdict):**
- T1 ✓, T2 ✓, T3 ✓, T4+T5 skipped, T6 ✓, T7a ✓, T7b ✓, T8 ✓, T8b ✓, T9 ✓, T10a–T10e ✓, T11 ✓, T12 ✓, T-NFR1 ✓

---

## AC coverage

| AC | Tasks | Status |
|----|-------|--------|
| AC1 — verdict artefact exists with valid verdict + 3-sentence rationale | Task 3 | ❌ awaiting investigation |
| AC2 — PROCEED: 5 function interfaces defined | Task 3 (PROCEED template) | ❌ conditional |
| AC3 — REDESIGN: blocking constraint + skill-format + trace-schema | Task 3 (REDESIGN template) | ❌ conditional |
| AC4 — verdict in pipeline-state.json + decisions.md ADR | Tasks 1, 4, 5 | ⏳ partial (null scaffold in Task 1) |
| AC5 — E3 stories reference Spike A | Task 1 Step 4 | ✅ (both p4-enf-package.md + p4-enf-mcp.md fixed) |

---

## Next step after plan saved

1. Execute Task 1 (scaffold) — agent
2. Run `/tdd` task-by-task for Tasks 2–5 — heymishy (High oversight)

Reply: 1 (execute Task 1 now) or 2 (review plan first)
