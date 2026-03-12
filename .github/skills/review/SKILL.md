---
name: review
description: >
  Reviews story artefacts for quality, completeness, traceability, and scope
  discipline. Produces structured findings with HIGH/MEDIUM/LOW severity.
  On re-runs, produces a diff showing exactly what changed. HIGH findings block
  progression to /test-plan. Use when stories exist and someone says "review the
  stories", "check the definition", "quality check", "re-review", or moves past
  definition. Run per story or per epic batch.
triggers:
  - "review the stories"
  - "check the definition"
  - "quality check"
  - "are these stories good"
  - "review this epic"
  - "re-review"
  - "findings"
---

# Review Skill

## Entry condition check

Before asking anything, verify:

1. At least one story artefact exists in `.github/artefacts/[feature]/stories/`
2. Parent epic artefact exists
3. Benefit-metric artefact exists (for metric linkage validation)
4. Discovery artefact exists (for scope validation)

If not met:

> ❌ **Entry condition not met**
> [Specific issue]
>
> Run /workflow to see the current pipeline state.

---

## Step 1 — Confirm scope and re-run status

State what was found first:

> **Stories found for review:**
> - [story title] — [previous review: Run N, PASS/FAIL / no previous review]
> - [story title] — [previous review: Run N, PASS/FAIL / no previous review]
>
> [If any have previous reviews:]
> This is a re-run for [n] stories. I'll produce a diff against the previous
> report showing what changed.
>
> Review all stories, or a specific one?
> Reply: all — or name the story

---

## Step 2 — Confirm review categories

> **Which review categories should I run?**
>
> A — Traceability: can every story be traced back to a metric and discovery?
> B — Scope discipline: do stories stay within declared MVP and out-of-scope?
> C — AC quality: are ACs testable, specific, Given/When/Then?
> D — Completeness: are all template fields populated with real content?
>
> 1. All four (default — recommended)
> 2. C and D only (short-track stories)
> 3. Custom — I'll specify
>
> Reply: 1, 2, or 3

---

## Step 3 — Run the review

### Category A: Traceability

For each story:
- Story references parent epic ✓/✗
- Story references discovery artefact ✓/✗
- Story references benefit-metric artefact ✓/✗
- "So that..." connects to a named metric, not just a feature ✓/✗
- Benefit linkage field contains a real mechanism sentence ✓/✗
- Metric exists in benefit coverage matrix ✓/✗

HIGH: any broken reference or missing metric linkage
MEDIUM: benefit linkage vague but metric referenced
LOW: coverage matrix not yet updated

### Category B: Scope discipline

For each story:
- Story doesn't implement anything in epic out-of-scope ✓/✗
- Story doesn't implement anything in discovery out-of-scope ✓/✗
- Story's own out-of-scope section names at least one excluded behaviour ✓/✗
- Scope additions have an approved scope note ✓/✗

HIGH: story implements something explicitly out of scope
MEDIUM: out-of-scope section is "N/A" or missing
LOW: scope note present but not linked back to discovery

### Category C: AC quality

For each AC:
- Given/When/Then format ✓/✗
- Describes observable behaviour, not implementation ✓/✗
- Independently testable ✓/✗
- Uses "does/returns/displays" not "should" ✓/✗
- Edge cases have own AC, not sub-bullets ✓/✗
- Minimum 3 ACs per story ✓/✗

HIGH: fewer than 3 ACs, or not in Given/When/Then
MEDIUM: ACs use "should" or describe implementation
LOW: edge cases in sub-bullets

### Category D: Completeness

For each field against `.github/templates/story.md`:
- User story in As/Want/So format ✓/✗
- Named persona — not "a user" ✓/✗
- Benefit linkage populated ✓/✗
- Out of scope populated — not blank, not "N/A" ✓/✗
- NFRs populated or "None — confirmed" ✓/✗
- Complexity rated ✓/✗
- Scope stability declared ✓/✗

HIGH: user story missing or persona is generic
MEDIUM: NFRs blank or benefit linkage missing
LOW: complexity or scope stability not rated

---

## Full report output format

```markdown
## Review Report: [Story title] — Run [N]
**Date:** [date]
**Categories:** [A / B / C / D as run]
**Outcome:** PASS / FAIL

### HIGH findings — must resolve before /test-plan
- [ID: N-H1] [Category] — [Story] — [Description]
  Fix: [specific action]

### MEDIUM findings — resolve or acknowledge in /decisions
- [ID: N-M1] [Category] — [Story] — [Description]
  Risk if proceeding: [what could go wrong]
  To acknowledge: run /decisions, category RISK-ACCEPT

### LOW findings — note for retrospective
- [ID: N-L1] [Category] — [Story] — [Description]

### Summary
[n] HIGH, [n] MEDIUM, [n] LOW across [n] stories.
```

Save to `.github/artefacts/[feature]/review/[story-slug]-review-[N].md`

Finding IDs: `[Run]-[Severity]-[Sequence]` e.g. `1-H1`, `1-M1`, `2-L1`

When a finding is resolved, reference it by its original run ID in the diff.
This creates a searchable history: "finding 1-H1 was opened in run 1, resolved in run 2."

---

## Diff output (re-runs only)

Prepend before the full report when this is run N > 1:

```markdown
## Review Diff: [Story title] — Run [N] vs Run [N-1]

### Resolved since last run
✅ [Finding ID from previous run] — [Original description] — RESOLVED

### New findings this run
🆕 [Finding ID] — [Category] — [Description]

### Carried forward unchanged
⏳ [Finding ID] — [Category] — [Description] — [how many runs open]

### Progress summary
Run [N-1]: [n] HIGH, [n] MEDIUM, [n] LOW
Run [N]:   [n] HIGH, [n] MEDIUM, [n] LOW
Change:    HIGH [+n/-n], MEDIUM [+n/-n], LOW [+n/-n]

[IMPROVED / SAME / REGRESSED]
```

---

## Completion output

**If PASS:**

> **Review PASSED ✅ — Run [N]**
>
> [n] HIGH: none | [n] MEDIUM: [n] (acknowledge in /decisions if proceeding)
>
> Ready to run /test-plan for [story title]?
> Reply: yes — or review another story first

**If FAIL:**

> **Review FAILED ❌ — Run [N]**
>
> [n] HIGH finding(s) must be resolved before /test-plan.
>
> Oldest open finding: [ID] — [description]
>
> Want me to walk through each HIGH finding with specific fix guidance?
> Reply: yes — or I'll fix them and re-run /review

---

## What this skill does NOT do

- Does not fix stories — identifies findings for human or /definition to address
- Does not run /test-plan
- Does not make scope decisions — flags issues, humans decide
- Does not review code — pre-coding artefact review only
