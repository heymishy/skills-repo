---
name: estimate
description: >
  Records a phase-by-phase focus-time estimate at feature start and refines it
  as scope becomes clearer. Compares estimates against actuals at /levelup to
  normalise the model over time and suggest flow improvements. Invoked
  automatically by /discovery (E1, at exit) and /definition (E2, at exit).
  Run manually with /estimate to record, update, or review.
  The key bottleneck signal is outer-loop operator focus time — inner-loop
  agent runs are largely autonomous once stories are DoR-ready.
  Focus hours are derived, not recalled: `scripts/parse-session-timing.js`
  extracts actual focus time from Copilot Chat JSONL transcripts, cutting
  idle gaps automatically. Engagement fraction is confirmed, not guessed.
triggers:
  - "/estimate"
  - "record estimate"
  - "refine estimate"
  - "review estimate"
  - "record actuals"
  - "/estimate actuals"
  - "estimate this feature"
  - "how did we go"
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

**Operator input is minimised by design.** Focus hours are derived — not recalled —
from calendar time and a single engagement fraction selection. The operator is
never asked to remember or calculate hours spent per phase.

---

## Entry condition

None. Can be invoked at any pipeline stage.

Auto-detect mode from `workspace/state.json`:

- `estimate` block absent → **E1 — Record rough estimate**
- `estimate.e1` present, `estimate.e2` absent, `currentPhase` is `"definition"` or later → **E2 — Refine estimate**
- `currentPhase` is `"definition-of-done"` or /levelup is running → **E3 — Actuals + calibration**

If `estimate.e1` is `null` (operator skipped at E1) and E3 is triggered: skip the delta table, write actuals only. See E3 null-path below.

---

## Derivation sources — priority order

When reconstructing phase durations in E3, use these sources in priority order.
Report which tier was used for each phase in the derivation summary.

1. **`state.json` `startedAt` / `completedAt` ISO datetimes** — written when each phase skill begins and exits; accurate to the second. Use when present. *(Available from Phase 2 onwards — see State update section.)*

2. **git log `phase:` prefix commits** — parse `git log --pretty="%ad %s" --date=iso` for commits matching `phase: [name]`. Less precise (commit granularity) but reliable where phase-boundary commit conventions are followed.

3. **JSONL transcript first/last message timestamps** — each JSONL file in the Copilot debug-logs directory is one session. Use the first and last message timestamps for session span. Always available for Copilot-hosted sessions.

If no source is found for a phase: mark the row "— manual input needed" and ask the operator to supply the date.

---

## E1 — Record rough estimate (at discovery)

Triggered automatically at the end of /discovery, or manually.

Context available at this stage: problem scope, MVP boundary, known constraints.
No story count yet — estimate is based on scope complexity and operator experience.

If `workspace/estimation-norms.md` has 3+ rows, surface the calibrated baseline
before asking (see Calibrated suggestions below).

Ask:

> **Quick estimate before we move forward.**
>
> How many calendar days do you expect the outer loop to span?
> (Outer loop = discovery through DoD/levelup — from first session to final commit.)
>
> Expected calendar span: __ days
>
> How focused do you expect your sessions to be?
>
> 1. **25%** — mostly waiting (agent-heavy, lots of idle time between runs)
> 2. **50%** — mixed (typical outer loop — half active, half waiting for agent)
> 3. **75%** — focused (short intensive sessions, mostly active keyboard work)
> 4. **90%** — heads down (near-continuous operator work, minimal agent waiting)
>
> Expected story count (rough): __
>
> Any key assumptions?
> (e.g. "~8 stories", "no Bitbucket scope", "1h sessions across 4 weeks")
>
> **Optional — Copilot Pro users:** two things to record now if applicable:
> (a) Current usage gauge % (e.g. "23%") — recording this at E1 enables automatic subtraction at E3; without it you’ll need the CSV report at E3 (which lags ~1 day and requires date filtering).
> (b) Request forecast for this feature (rough estimate or skip).
>
> Reply: calendar days, option 1/2/3/4, story count[, gauge %][, requests forecast] — or `skip`

Derive: `outerLoopFocusH ≈ calendarDays × 2 × engagementFraction`
(Assumes ~2h active session time per calendar day as a baseline; revised at E2 with story count.)

If skipped: write `"e1": null`. E3 will write actuals-only with no delta table.

Write to `workspace/state.json` under `estimate.e1`:

```json
"estimate": {
  "e1": {
    "date": "[YYYY-MM-DD]",
    "expectedCalendarDays": [n],
    "engagementFraction": [0.25|0.50|0.75|0.90],
    "outerLoopFocusH": "[derived: calendarDays × 2 × fraction]",
    "innerLoopHuman": [h],
    "expectedStoryCount": [n],
    "confidence": "low",
    "assumptions": "[free text]",
    "gaugeAtStart": null,
    "premiumRequestsForecast": null
  }
}
```

Confirm:

> **E1 estimate recorded ✅**
> Calendar span: ~[n] days | Engagement: [fraction × 100]% | Est. focus: ~[n]h | Stories: ~[n]
> Confidence: low | Assumptions: [summary]
> Copilot Pro gauge at start: [n%] [or "not recorded — CSV fallback at E3"]
>
> I'll refine this once stories are written in /definition.

---

## E2 — Refine estimate (at definition)

Triggered automatically at the end of /definition once story count and complexity
are known, or manually.

Context available: story count, complexity scores, scope stability.

If `estimate.e1` is null: record this as the first forecast for this feature; note
"no E1 to compare."

Present what's known and ask only for revision if needed:

> **Refining estimate — story count and complexity now known.**
>
> Stories: [n] | Complexity: [1: n, 2: n, 3: n] | Scope stability: [Stable/Unstable]
> E1 forecast: ~[n] calendar days at [fraction × 100]% engagement → ~[n]h focus [or "no E1 recorded"]
>
> Does the calendar span estimate still hold, or do you want to revise?
>
> 1. **25%** — mostly waiting
> 2. **50%** — mixed (typical outer loop)
> 3. **75%** — focused
> 4. **90%** — heads down
>
> **Optional — Copilot Pro users:** set or revise your premium requests forecast now if not already set at E1. (Skip if not applicable)
>
> Reply: "looks right" — or: [new calendar days] + [1/2/3/4 for fraction][, requests forecast]

Derive: `outerLoopFocusH = calendarDays × 2 × engagementFraction`
Compute: `p75FocusHPerStory = outerLoopFocusH × 1.25 ÷ storyCount` for normalisation.

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
  "expectedCalendarDays": [n],
  "engagementFraction": [0.25|0.50|0.75|0.90],
  "outerLoopFocusH": "[derived]",
  "innerLoopHuman": [h],
  "confidence": "medium",
  "notes": "[changes from E1 and why, or 'no E1 to compare']",
  "premiumRequestsForecast": null
}
```

Confirm:

> **E2 estimate recorded ✅**
> Calendar: ~[n] days | Engagement: [fraction × 100]% | Focus: ~[n]h | [n] stories
> Change from E1: [delta or "unchanged" or "no E1 recorded"]

---

## E3 — Actuals + calibration (at /levelup)

Triggered automatically during /levelup Category E, or manually.

### Step E3a — Derive phase durations

Follow the priority order in "Derivation sources" above. For each phase, record which source tier was used.

For `state.json` `completedDate` date-only fields (as used in Phase 1): treat as noon on that date (12:00:00 local) for duration computation and mark source as "state.json date-only (±12h precision)".

Compute: `calendarDays = (completedAt of last phase) − (startedAt of first phase)` in whole days.

Present the phase duration table before asking any question:

> **Phase duration derivation — [feature-slug]**
>
> | Phase | Start | End | Calendar span | Source tier |
> |-------|-------|-----|--------------|-------------|
> | Discovery | [date] | [date] | [n]h | [tier-1/2/3/date-only] |
> | Benefit-metric | [date] | [date] | [n]h | |
> | Definition | [date] | [date] | [n]h | |
> | Review | [date] | [date] | [n]h | |
> | Test-plan | [date] | [date] | [n]h | |
> | DoR | [date] | [date] | [n]h | |
> | DoDs + /levelup | [date] | [date] | [n]h | |
> | **Total** | [first date] | [last date] | **[n] days** | |

### Step E3b — JSONL session reconstruction

**Primary method — `scripts/parse-session-timing.js`:**

Run the session timing parser, then filter output to sessions whose start time falls within the feature date range (E3a start → last DoD date):

```powershell
node scripts/parse-session-timing.js --summary
# For per-prompt detail on a specific session:
node scripts/parse-session-timing.js path/to/session.jsonl --detail
```

The `--summary` output is auto-discovered from all workspace transcript directories under `%APPDATA%\Code\User\workspaceStorage\`. Default idle-gap threshold is 15 min (`--max-gap 15`) — gaps longer than this are excluded from focus time automatically. Adjust with `--max-gap N` if sessions involve long reading pauses.

Present the filtered reconstruction immediately after E3a:

> **Session reconstruction — `parse-session-timing.js` output (feature date range: [start] → [end]):**
>
> | Session start | Prompts | Span | Focus | Model | Idle excluded |
> |--------------|---------|------|-------|-------|---------------|
> | [date/time] | [n] | [n]h | [n]h | [n]m | [n]h (>[15]m) |
> | ... | | | | | |
> | **Total** | [n] | [n]h | **[n]h** | [n]h | [n]h |
>
> Max-gap threshold: [N] min

`outerLoopFocusH` = sum of `Focus` column across feature-range sessions (idle already excluded).
`totalCalendarH` = sum of `Span` column (wall-clock session time).
`actualEngagementFraction` = `outerLoopFocusH ÷ totalCalendarH` (computed — not estimated).

**Fallback — parser unavailable or JSONL not accessible:**

Read transcript JSONL files directly; extract first/last timestamps per file. Set `totalCalendarH` = sum of session wall-clock times. If no files are accessible, set `totalCalendarH = calendarDays × 2` and note "JSONL not accessible — calendar span estimate used". Proceed to E3c manual path.

### Step E3c — Engagement fraction (confirmatory when script data is available)

**Primary path — parser output available (normal case):**

Focus time is computed directly from the transcript — no estimation needed.
`outerLoopFocusH` and `actualEngagementFraction` are already set from E3b.

Present the computed result and ask for confirmation only:

> **Computed focus time: [n]h ([fraction × 100]% engagement)**
> [n]h active focus ÷ [n]h total session wall-clock time
> Idle excluded: [n]h (gaps > [N] min — overnight, agent runs, context switches)
> Max-gap threshold used: [N] min (default: 15 min)
>
> Does this look right, or adjust the idle threshold?
> Reply: `ok` — or: `--max-gap [N]` to recompute (e.g. `--max-gap 30` for longer reading sessions)

If the operator adjusts the threshold, re-run the parser with the new flag and recompute `outerLoopFocusH` and `actualEngagementFraction` before proceeding.

**Fallback path — parser unavailable or JSONL not accessible:**

After presenting E3a and E3b (calendar span estimate), ask exactly one question:

> **One question to convert session time to focus time.**
>
> Of that [n]h total session wall-clock time, what fraction was active keyboard work
> vs waiting for the agent?
>
> 1. **25%** — mostly waiting (agent-heavy, lots of idle time between messages)
> 2. **50%** — mixed (typical outer loop — half active, half waiting)
> 3. **75%** — focused (short sessions, mostly active keyboard work)
> 4. **90%** — heads down (near-continuous operator work, minimal agent waiting)
>
> Reply: 1 / 2 / 3 / 4

Derive: `outerLoopFocusH = totalCalendarH × engagementFraction`

Do not ask for per-phase hour breakdowns. Do not ask the operator to recall hours.

After recording the engagement fraction, ask one optional follow-up:

> **Optional — Copilot Pro users only.**
> How many premium requests did this feature consume?
>
> Derivation order (use whichever is available):
> 1. **Gauge subtraction (most accurate):** `(gaugeNow% − gaugeAtStart%) × monthlyQuota` — requires E1 gauge reading was recorded.
> 2. **CSV report:** Download from GitHub → filter rows to feature date range; sum the `quantity` column across all models. Note: report lags ~1 day, so the final day’s usage may be absent.
> 3. **Estimate from gauge:** Current gauge % − approximate start % if E1 reading was skipped.
>
> Note: the `coding_agent_premium_request` SKU (inner loop agent) appears separately from `copilot_premium_request` (outer loop chat). Sum both for total; record split if you want outer/inner cost visibility.
>
> Reply: a number (or “outer:[n] inner:[n]” for split), or `skip`

Set `premiumRequestsActual` to the provided number or split object, or `null` if skipped.

### Phase 1 bootstrap case

When E3 is triggered for a feature where both `estimate.e1` and `estimate.e2` are null
**and** a manually compiled session map already exists (e.g. logged in `workspace/learnings.md`):

- Skip fresh E3a/E3b derivation — the session map is already available
- Present the existing session map (e.g. "9 sessions, 2026-04-09 to 2026-04-11") and ask only the E3c engagement fraction question
- After the answer: compute `outerLoopFocusH = totalCalendarH × fraction`
- Write actuals to state.json with no delta table
- Append the row to `workspace/estimation-norms.md` and `workspace/results.tsv` with `note: "Phase 1 baseline — no prior estimate; seeds normalisation table"`
- Skip Step E3d delta table and estimate-based flow findings entirely; still generate flow findings from phase duration patterns (e.g. which phases ran long, parallelisation, autonomous inner loop)

### E3 null-path — no session map available

If both `estimate.e1` and `estimate.e2` are null and no prior session map exists:

> **No prior estimate recorded for this feature.**
> This run will establish the baseline — actuals will be written without a delta comparison.
> Confirm the engagement fraction above and I'll write the record and the first normalisation row.

Proceed with E3a/E3b/E3c normally. Skip the delta table (Step E3d).

### Step E3d — Compute deltas and flow findings

**Skip entirely if both `estimate.e1` and `estimate.e2` are null.** See null-path above.

If `estimate.e2` is present: delta = actual − e2 outerLoopFocusH (positive = over).
If only `estimate.e1` is present: delta = actual − e1 outerLoopFocusH.

Present comparison:

> **[E2|E1] estimate vs Actuals — [feature-slug]**
>
> | Metric | Estimate | Actual | Delta | Signal |
> |--------|---------|--------|-------|--------|
> | Calendar days | [n] | [n] | [±n] | [over/under/on] |
> | Focus hours (outer loop) | [n]h | [n]h | [±n]h | |
> | Engagement fraction | [frac] | [frac] | — | |
> | Inner loop (human) | [n]h | [n]h | [±n]h | |
> | Focus h/story | [n]h | [n]h | [±n]h | |

Generate flow findings for:
- Calendar span > 30% over estimate: cause hypothesis + improvement + effort
- Engagement fraction lower than estimated: "session intensity signal — sessions were more idle than expected; revise E1 default fraction downward"
- Parallelisation discovered mid-run: "parallelisation opportunity — phases [X/Y] ran concurrently; estimate model should treat as parallel, not sequential"
- Inner loop autonomous far exceeded estimate: "inner loop autonomous — agent ran [n]h vs [n]h estimated human time; revise E1/E2 inner loop default downward"

Finding format:

> **Flow finding — [topic]**
> Actual: [metric] | Estimate: [metric] | Delta: [±]
> Cause hypothesis: [text]
> Improvement: [text]
> Effort: [Low / Medium / High]

### Step E3e — Append to normalisation table and results.tsv

**Append to `workspace/estimation-norms.md`** (create if absent):

```markdown
## Estimation norms — cross-feature actuals

| Date | Feature | Stories | Engagement | OL estimate | OL actual | Delta | IL (human) | Calendar days |
|------|---------|---------|-----------|------------|-----------|-------|------------|---------------|
| [YYYY-MM-DD] | [slug] | [n] | [fraction] | [n]h | [n]h | [±n]h | [n]h | [n] |
```

```yaml estimation-norms
- date: "[YYYY-MM-DD]"
  feature: "[slug]"
  storyCount: [n]
  engagementFraction: [0.25|0.50|0.75|0.90]
  outerLoopEstimateH: [n]
  outerLoopActualH: [n]
  outerLoopDeltaH: [n]
  innerLoopHumanH: [n]
  agentAutonomousH: [n]
  calendarDays: [n]
  outerLoopSessions: [n]
  focusHPerStory: [n]
  source: "[e1|e2|none]"
  note: "[optional — e.g. 'Phase 1 baseline — no prior estimate; seeds normalisation table']"
  premiumRequestsForecast: null
  premiumRequestsActual: null
```

**Append to `workspace/results.tsv`** one row:

```
[YYYY-MM-DD]\t[feature-slug]\test-actuals\t[story-count]\t[engagement-fraction]\t[ol-estimate]h\t[ol-actual]h\t[delta]h\t[il-estimate]h\t[il-actual]h\t[calendar-days]\t[requests-forecast]\t[requests-actual]
```

Columns in order: date, feature, type, story-count, engagement-fraction, outer-loop-estimate, outer-loop-actual, outer-loop-delta, inner-loop-estimate, inner-loop-actual, calendar-days, requests-forecast, requests-actual. Use `-` for skipped/null request fields.

### Step E3f — Write actuals + delta to state.json

Write to `workspace/state.json` under `estimate`:

```json
"actuals": {
  "date": "[YYYY-MM-DD]",
  "calendarDays": [n],
  "outerLoopSessions": [n],
  "engagementFraction": [0.25|0.50|0.75|0.90],
  "totalCalendarH": [n],
  "outerLoopFocusH": "[derived: totalCalendarH × fraction]",
  "innerLoopHuman": [h],
  "agentAutonomousH": [h],
  "storyCount": [n],
  "premiumRequestsActual": null,
  "premiumRequestsSplit": { "outerLoop": null, "innerLoop": null },
  "derivationSources": {
    "discovery": "[tier-1|tier-2|tier-3|date-only|manual]",
    "definition": "[tier]",
    "review": "[tier]",
    "testPlan": "[tier]",
    "definitionOfReady": "[tier]"
  }
},
"delta": {
  "baseline": "[e2|e1|none]",
  "outerLoopFocusH": "[±n]",
  "calendarDays": "[±n]",
  "notes": "[summary of main over/under signals]",
  "flowFindings": [
    {
      "topic": "[label]",
      "deltaH": "[±n]",
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
> [n] sessions | [n] calendar days | [fraction × 100]% engagement → [n]h focus
> Inner loop (human): [n]h | Agent-autonomous: [n]h | [n] stories
> Focus hours per story: [n]h
> Premium requests: [n] (Copilot Pro) [omit this line if null]
>
> Comparison: [e2/e1] estimate [n]h → actual [n]h ([±n]h delta) [or "no prior estimate — baseline established"]
>
> Flow findings: [n]
> - [finding 1 one-liner]
> - [finding 2 one-liner]
>
> Normalisation table updated: `workspace/estimation-norms.md`
> results.tsv row appended: `workspace/results.tsv`

---

## Calibrated suggestions (after 3+ features)

When E1 is invoked and `workspace/results.tsv` contains 3 or more `est-actuals` rows:

1. Parse the TSV — extract columns: story-count, engagement-fraction, outer-loop-actual, calendar-days
2. Group rows by engagement fraction band (0.25 / 0.50 / 0.75 / 0.90)
3. For each band with at least 1 row, compute mean `focusHPerStory = sum(ol-actual) ÷ sum(story-count)`

Surface per-band calibrated suggestions before asking for the operator's estimate:

> **Historical baseline from [n] features:**
>
> At **50% engagement** ([n] features): [n]h/story × ~[estimated story count] stories = ~[n]h outer loop
> At **75% engagement** ([n] features): [n]h/story × ~[estimated story count] stories = ~[n]h outer loop
> P75 planning headroom (+25%): ~[n]h
>
> Pick the engagement fraction that matches your expected working style — or use a different calendar span.

If no rows exist yet (first feature): note "No baseline yet — this run will be feature 1 in the normalisation table."

If 3+ features have non-null `requests-actual` values in results.tsv: surface a premium request baseline after the engagement-band table:

> **Premium request baseline** ([n] features with data): ~[mean] requests/feature (range: [min]–[max])
> Features of this scope typically consume ~[mean] requests — factor this into inner loop dispatch timing relative to your monthly reset date.

---

## What this skill does NOT do

- Does not track team velocity or story points
- Does not assign stories to sprints or people
- Does not use WakaTime, activity tracking, or any surveillance tooling
- All derivation uses git log, JSONL transcripts, and state.json — artefacts that already exist
- Does not ask the operator to recall hours or calculate per-phase breakdowns
- Does not replace /benefit-metric MM1 — this skill feeds evidence into MM1

---

## State update — mandatory final step

After any invocation point:
- Write the relevant `estimate.e1`, `estimate.e2`, `estimate.actuals`, or `estimate.delta` block to `workspace/state.json`
- In E3 only: append to `workspace/estimation-norms.md` and `workspace/results.tsv`
- Confirm the write in closing message: "Pipeline state updated ✅"

### Phase 2+ cycle block timestamp requirement

From Phase 2 onwards, every cycle block in `workspace/state.json` must include:
- `startedAt` — ISO datetime with timezone (e.g. `"2026-04-12T09:00:00+10:00"`), written when the phase skill begins
- `completedAt` — ISO datetime with timezone, written at phase exit

This makes E3 actuals derivation fully automatic via tier-1 sources. Skills that
currently write `completedDate: YYYY-MM-DD` (as used in Phase 1) must upgrade to
`completedAt: YYYY-MM-DDThh:mm:ss±TZ`.

**ARCH decision:** See `artefacts/2026-04-09-skills-platform-phase1/decisions.md` —
`2026-04-11 | ARCH | Phase 2+ cycle block timestamps — startedAt/completedAt ISO datetime`.

---

*Auto-invocation: /discovery invokes /estimate (E1 mode) at its exit step.
/definition invokes /estimate (E2 mode) at its exit step.
Hooks are in `.github/skills/discovery/SKILL.md` and `.github/skills/definition/SKILL.md`.*
