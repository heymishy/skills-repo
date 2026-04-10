---
name: estimate
description: >
  Records a phase-by-phase focus-time estimate at feature start and refines it
  as scope becomes clearer. Compares estimates against actuals at /levelup to
  normalise the model over time and suggest flow improvements. Invoked
  automatically by /discovery (E1 rough estimate) and /definition (E2 refined
  estimate). Run manually with /estimate to record, update, or review.
  The key bottleneck signal is outer-loop operator focus time — inner-loop
  agent runs are largely autonomous once stories are DoR-ready.
triggers:
  - "/estimate"
  - "record estimate"
  - "refine estimate"
  - "review estimate"
  - "record actuals"
  - "/estimate actuals"
  - "estimate this feature"
  - "how are we tracking vs estimate"
---

# Estimate Skill

## Purpose

Record a forward-looking time estimate at the start of each feature. Refine it
when scope is known. Compare actuals at /levelup. Over time, the comparison
builds a normalised model that makes future estimates more accurate and surfaces
concrete flow improvements (e.g. "a focused 2h discovery block saves ~1h of
definition rework on average").

The outer loop — discovery through DoR — is the primary bottleneck because it
requires operator focus. The inner loop is predominantly autonomous agent
execution once stories are DoR-ready. Estimates should reflect this split.

---

## Entry condition

None. Can be invoked at any pipeline stage.

Auto-detect mode from `workspace/state.json`:

- `estimate` block absent → **E1 — Record rough estimate**
- `estimate.e1` present, `estimate.e2` absent, `currentPhase` is `"definition"` or later → **E2 — Refine estimate**
- `currentPhase` is `"definition-of-done"` or /levelup is running → **E3 — Actuals + calibration**

If `estimate.e1` is `null` (operator skipped at E1) and E3 is triggered: skip the delta table, write actuals only, note "no prior estimate — this run establishes the baseline." See E3 null-path below.

---

## E1 — Record rough estimate (at discovery)

Triggered automatically at the end of /discovery, or manually.

Context available at this stage: problem scope, MVP boundary, known constraints.
No story count yet — estimate is based on scope complexity and operator experience.

Ask:

> **Quick estimate before we move forward.**
>
> Based on the discovery scope, how long do you expect the outer loop to take?
> The outer loop is: discovery → benefit-metric → definition → review → test-plan → DoR.
> Inner loop (coding agent runs) is separate — we track that independently.
>
> For each phase, give your best guess for **operator focus time** (not calendar time).
> "Focus time" = hours you are actively working, not waiting for the agent.
>
> | Phase | Focus time estimate |
> |-------|-------------------|
> | Discovery (incl. clarify) | ? h |
> | Benefit-metric | ? h |
> | Definition (epics + stories) | ? h |
> | Review | ? h |
> | Test-plan | ? h |
> | Definition-of-ready | ? h |
> | DoDs + /levelup | ? h |
> | **Outer loop total** | **? h** |
>
> Inner loop (agent dispatch + PR merges, human time only): ? h
> Expected story count (rough): ?
>
> Any assumptions baked into these numbers?
> (e.g. "assuming ~8 stories", "assuming no Bitbucket scope")
>
> Reply: fill in numbers — or type "skip" to proceed without an estimate

If skipped: write `"e1": null`. E2 will still run but will note no rough to compare against. E3 will write actuals-only with no delta table.

Write to `workspace/state.json` under `estimate.e1`:

```json
"estimate": {
  "e1": {
    "date": "[YYYY-MM-DD]",
    "discovery": [h],
    "benefitMetric": [h],
    "definition": [h],
    "review": [h],
    "testPlan": [h],
    "definitionOfReady": [h],
    "dods_levelup": [h],
    "outerLoopTotal": [h],
    "innerLoopHuman": [h],
    "expectedStoryCount": [n],
    "confidence": "low",
    "assumptions": "[free text]"
  }
}
```

Confirm:

> **E1 estimate recorded ✅**
> Outer loop: [n]h focus time | Inner loop (human): [n]h | Stories: ~[n]
> Confidence: low | Assumptions: [summary]
>
> I'll ask you to refine this once stories are written in /definition.

---

## E2 — Refine estimate (at definition)

Triggered automatically at the end of /definition once story count and complexity
are known, or manually.

Context available: story count, complexity scores, scope stability.

If `estimate.e1` is null: skip the "change from rough" comparison. Still record
the E2 estimate as the first recorded forecast for this feature.

State what's known:

> **Refining estimate based on definition output:**
> Stories: [n] | Complexity distribution: [1: n, 2: n, 3: n] | Scope stability: [Stable/Unstable]
> E1 estimate (from discovery): outer loop [n]h, inner loop [n]h [or "no E1 estimate recorded"]
>
> With [n] stories at this complexity mix, does the E1 forecast still hold?
> Or do you want to revise any phase?
>
> | Phase | E1 estimate | Revised? |
> |-------|------------|----------|
> | Definition | [n]h | — |
> | Review | [n]h | |
> | Test-plan | [n]h | |
> | Definition-of-ready | [n]h | |
> | DoDs + /levelup | [n]h | |
> | Inner loop (human) | [n]h | |
>
> Reply: "looks right" — or type revised values for any row

Write to `workspace/state.json` under `estimate.e2`:

```json
"e2": {
  "date": "[YYYY-MM-DD]",
  "storyCount": [n],
  "byStory": {
    "count": [n],
    "complexity": { "1": [n], "2": [n], "3": [n] },
    "p75FocusHPerStory": [h]
  },
  "review": [h],
  "testPlan": [h],
  "definitionOfReady": [h],
  "dods_levelup": [h],
  "outerLoopTotal": [h],
  "innerLoopHuman": [h],
  "confidence": "medium",
  "notes": "[changes from E1 and why, or 'no E1 to compare']"
}
```

Confirm:

> **E2 estimate recorded ✅**
> Outer loop: [n]h | Inner loop (human): [n]h | [n] stories
> Change from E1: [delta or "unchanged" or "no E1 recorded"]

---

## E3 — Actuals + calibration (at /levelup)

Triggered automatically during /levelup Category E, or manually.

### Step E3a — Propose actuals from state.json timestamps

Do not rely on commit message text for phase boundary detection — message
conventions are inconsistent. Instead, read phase boundaries from
`workspace/state.json` `cycle.*` timestamp fields, which are written at each
phase completion:

- `cycle.discovery.completedAt` → discovery end
- `cycle.benefitMetric.completedDate` → benefit-metric end
- `cycle.definition.completedDate` → definition end
- `cycle.review.completedDate` → review end (if present)
- `cycle.testPlan.completedDate` → test-plan end (if present)
- `cycle.definitionOfReady.completedDate` → DoR end (if present)

From these timestamps, compute elapsed calendar time per phase. Then present
the table to the operator for focus-time confirmation:

> **Actuals reconstruction — [feature-slug]**
>
> Phase boundaries from `workspace/state.json`:
>
> | Phase | Start | End | Calendar time |
> |-------|-------|-----|---------------|
> | Discovery | [date] | [date] | [n]h |
> | Benefit-metric | [date] | [date] | [n]h |
> | Definition | [date] | [date] | [n]h |
> | Review | [date] | [date] | [n]h |
> | Test-plan | [date] | [date] | [n]h |
> | DoR | [date] | [date] | [n]h |
> | DoDs + /levelup | [date] | [date] | [n]h |
>
> Calendar time ≠ focus time. Please correct the focus hours column:
>
> | Phase | Calendar time | Actual focus time |
> |-------|-------------|------------------|
> | Discovery | [n]h | ? h |
> | Benefit-metric | [n]h | ? h |
> | Definition | [n]h | ? h |
> | Review | [n]h | ? h |
> | Test-plan | [n]h | ? h |
> | DoR | [n]h | ? h |
> | DoDs + /levelup | [n]h | ? h |
> | **Outer loop total** | | **? h** |
> | Inner loop (human) | | ? h |
> | Agent-autonomous time | | ? h |
> | Calendar span (total) | [n] days | |
>
> Reply: fill in focus hours — or "looks right" to accept calendar times as-is

If state.json timestamps are absent for a phase: note "timestamp not found —
please supply manually" for that row.

### E3 null-path — no prior estimate (bootstrap or skip)

If `estimate.e1` is null AND `estimate.e2` is null:

> **No prior estimate recorded for this feature.**
> This run will establish the baseline — actuals will be written without a delta comparison.
> Confirm focus hours above and I'll write the E3 record and the first row of the normalisation table.

Skip steps E3b delta table and flow findings based on estimate delta; still generate
flow findings based on phase duration patterns (e.g. parallel execution, autonomous runs).

### Step E3b — Compute deltas and flow findings

If E2 estimate exists, compute: delta = actual − E2 estimate (positive = over, negative = under).

Present comparison table:

> **E2 estimate vs Actuals — [feature-slug]**
>
> | Phase | E2 estimate | Actual focus | Delta | Signal |
> |-------|------------|-------------|-------|--------|
> | Discovery | [n]h | [n]h | [±n]h | [over/under/on] |
> | Benefit-metric | [n]h | [n]h | [±n]h | |
> | Definition | [n]h | [n]h | [±n]h | |
> | Review | [n]h | [n]h | [±n]h | |
> | Test-plan | [n]h | [n]h | [±n]h | |
> | DoR | [n]h | [n]h | [±n]h | |
> | DoDs + /levelup | [n]h | [n]h | [±n]h | |
> | **Outer loop total** | **[n]h** | **[n]h** | **[±n]h** | |
> | Inner loop (human) | [n]h | [n]h | [±n]h | |
> | Calendar span | — | [n] days | — | |

Generate flow findings for:
- Any phase > 30% over E2 estimate: cause hypothesis + improvement + effort
- Parallelisation discovered mid-run: "parallelisation opportunity — phases [X/Y] can run concurrently; estimate model should treat as parallel, not sequential"
- Autonomous agent execution replacing expected human time: "inner loop autonomous — [n]h agent-autonomous vs [n]h estimated human time; revise E1/E2 inner loop default downward"

Finding format:

> **Flow finding — [phase name]**
> Actual: [n]h | E2 estimate: [n]h | Delta: +[n]h
> Cause hypothesis: [text]
> Improvement: [e.g. "a focused 2h discovery block would save ~1h of definition rework per feature"]
> Effort to implement: [Low / Medium / High]

### Step E3c — Append to normalisation table

Append one row to `workspace/estimation-norms.md` (create if absent):

The file format is a human-readable summary table followed by a machine-readable YAML block:

```markdown
## Estimation norms — cross-feature actuals

| Date | Feature | Stories | Outer loop estimate | Outer loop actual | Delta | Inner loop (human) | Calendar days |
|------|---------|---------|--------------------|--------------------|-------|--------------------|---------------|
| [YYYY-MM-DD] | [slug] | [n] | [n]h | [n]h | [±n]h | [n]h | [n] |
```

```yaml estimation-norms
- date: "[YYYY-MM-DD]"
  feature: "[slug]"
  storyCount: [n]
  outerLoopEstimateH: [n]
  outerLoopActualH: [n]
  outerLoopDeltaH: [n]
  innerLoopHumanH: [n]
  agentAutonomousH: [n]
  calendarDays: [n]
  focusHPerStory: [n]
  source: "[e1|e2|none — which estimate was used for delta]"
```

If the file does not exist, create it with the header row, then append the data row.

### Step E3d — Write actuals + delta to state.json

Write to `workspace/state.json` under `estimate`:

```json
"actuals": {
  "date": "[YYYY-MM-DD]",
  "discovery": [h],
  "benefitMetric": [h],
  "definition": [h],
  "review": [h],
  "testPlan": [h],
  "definitionOfReady": [h],
  "dods_levelup": [h],
  "outerLoopTotal": [h],
  "innerLoopHuman": [h],
  "agentAutonomousH": [h],
  "calendarDays": [n],
  "storyCount": [n]
},
"delta": {
  "baseline": "[e2|e1|none]",
  "outerLoopFocusH": [±n],
  "calendarDays": [±n],
  "notes": "[summary of main over/under phases]",
  "flowFindings": [
    {
      "phase": "[phase]",
      "deltaH": [±n],
      "hypothesis": "[text]",
      "improvement": "[text]",
      "effort": "[Low|Medium|High]"
    }
  ]
}
```

### E3 completion output

> ✅ **E3 actuals recorded — [feature-slug]**
>
> Outer loop: [E2: n]h → actual [n]h ([±n]h delta) [or "no prior estimate — baseline established"]
> Inner loop (human): [n]h | Agent-autonomous: [n]h | Calendar: [n] days
> Focus hours per story: [n]h
>
> Flow findings: [n]
> - [finding 1 one-liner]
> - [finding 2 one-liner]
>
> Normalisation table updated: `workspace/estimation-norms.md`

---

## Calibrated suggestions (after 3+ features)

When E1 is invoked and `workspace/estimation-norms.md` contains 3 or more rows,
read the YAML block and compute:

- Mean focus hours per story: sum(outerLoopActualH) ÷ sum(storyCount) across all rows
- P75 outer loop: mean × 1.25 (planning headroom)
- Mean inner loop (human): average innerLoopHumanH

Surface before asking for the operator's estimate:

> **Historical baseline from [n] features:**
> Mean outer loop: [n]h/story × ~[estimated story count] stories = ~[n]h
> P75 outer loop (planning headroom): ~[n]h
> Mean inner loop (human): ~[n]h
>
> Use these as a starting point — or override with your own numbers.

---

## What this skill does NOT do

- Does not track team velocity or story points
- Does not assign stories to sprints or people
- Does not measure agent execution time (only human focus time)
- Does not replace /benefit-metric MM1 — this skill feeds evidence into MM1

---

## State update — mandatory final step

After any invocation point:
- Write the relevant `estimate.e1`, `estimate.e2`, `estimate.actuals`, or `estimate.delta` block to `workspace/state.json`
- Append to `workspace/estimation-norms.md` in E3 only
- Confirm the write in closing message: "Pipeline state updated ✅"
