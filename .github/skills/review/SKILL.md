---
name: review
description: >
  Reviews story artefacts for quality, completeness, traceability, and scope discipline.
  Produces a structured finding report with HIGH/MEDIUM/LOW severity ratings.
  On re-runs, produces a diff against the previous report showing what changed.
  HIGH findings block progression to /test-plan. Use when stories exist and someone
  says "review the stories", "check the definition", "quality check", "re-review", 
  or moves past definition. Run per story or per epic batch.
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

**Before proceeding**, verify:

1. At least one story artefact exists in `.github/artefacts/[feature]/stories/`
2. Parent epic artefact exists
3. Benefit-metric artefact exists (for metric linkage validation)
4. Discovery artefact exists (for scope validation)

If any condition is not met, output:

> ❌ **Entry condition not met**
> [Specific issue]
> Run `/workflow` to see the current pipeline state.

---

## Re-run detection

**Before running**, check whether a previous review report exists for this story 
at `.github/artefacts/[feature]/review/[story-slug]-review-[run-n].md`.

If a previous report exists:
- Note the run number — this is run N+1
- Load the previous findings
- After completing the full review, produce a **diff output** in addition to 
  the full report (see Diff Output Format below)
- Save as `[story-slug]-review-[run-n+1].md`

If no previous report exists:
- This is run 1
- Produce the standard full report
- Save as `[story-slug]-review-1.md`

---

## Review categories

Confirm which categories apply before running. Default: all four.
For short-track stories, C and D may be sufficient.

**A — Traceability:** Can every story be traced back through epic → benefit-metric → discovery?
**B — Scope discipline:** Do stories stay within declared MVP and epic out-of-scope?
**C — AC quality:** Are ACs testable, specific, in Given/When/Then format?
**D — Completeness:** Are all required template fields populated with real content?

Ask:
> "I'll run all four review categories by default. Confirm, or specify which to include."

---

## Severity model

**HIGH** — Blocks progression to /test-plan. Must be resolved.
**MEDIUM** — Should be resolved. Can proceed if risk explicitly acknowledged in /decisions.
**LOW** — Improvement opportunity. Proceed, note for retrospective.

---

## Category A: Traceability

For each story, check:
- Story references parent epic ✓/✗
- Story references discovery artefact ✓/✗
- Story references benefit-metric artefact ✓/✗
- "So that..." connects to a named metric, not just a feature ✓/✗
- Benefit linkage field contains a real mechanism sentence ✓/✗
- Metric exists in benefit coverage matrix ✓/✗

HIGH: any broken reference or missing metric linkage
MEDIUM: benefit linkage vague but metric referenced
LOW: coverage matrix not yet updated

---

## Category B: Scope discipline

For each story, check:
- Story doesn't implement anything in epic out-of-scope ✓/✗
- Story doesn't implement anything in discovery out-of-scope ✓/✗
- Story's own out-of-scope section names at least one excluded behaviour ✓/✗
- Scope additions have a scope note ✓/✗

HIGH: story implements something explicitly out of scope
MEDIUM: out-of-scope section is "N/A" or missing
LOW: scope note present but not linked back to discovery

---

## Category C: AC quality

For each AC in each story, check:
- Given/When/Then format ✓/✗
- Describes observable behaviour, not implementation ✓/✗
- Independently testable ✓/✗
- Uses "does/returns/displays" not "should" ✓/✗
- Edge cases have own AC, not sub-bullets ✓/✗
- Minimum 3 ACs per story ✓/✗

HIGH: fewer than 3 ACs, or not in Given/When/Then
MEDIUM: ACs use "should" or describe implementation approach
LOW: edge cases in sub-bullets

---

## Category D: Completeness

Check every field against `.github/templates/story.md`:
- User story in As/Want/So format ✓/✗
- Named persona (not "a user") ✓/✗
- Benefit linkage populated ✓/✗
- Out of scope populated (not blank, not "N/A") ✓/✗
- NFRs populated or explicitly "None — confirmed" ✓/✗
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
**Categories run:** A / B / C / D
**Outcome:** PASS / FAIL

### HIGH findings (must resolve before /test-plan)
- [Finding ID: H1] [Category] — [Story title] — [Description]
  Suggested fix: [Specific action]

### MEDIUM findings (resolve or acknowledge in /decisions)
- [Finding ID: M1] [Category] — [Story title] — [Description]
  Risk if proceeding: [What could go wrong]
  To acknowledge: run /decisions, category RISK-ACCEPT

### LOW findings (note for retrospective)
- [Finding ID: L1] [Category] — [Story title] — [Description]

### Summary
[n] HIGH, [n] MEDIUM, [n] LOW across [n] stories.
[PASS: Ready for /test-plan] or [FAIL: Resolve HIGH findings and re-run /review]
```

Save to `.github/artefacts/[feature]/review/[story-slug]-review-[N].md`

---

## Diff output format (re-runs only)

When this is run N > 1, prepend the diff block before the full report:

```markdown
## Review Diff: [Story title] — Run [N] vs Run [N-1]
**Date:** [date]

### Resolved since last run
<!-- Findings that existed in run N-1 and do not appear in run N -->
✅ [Finding ID from previous run] — [Original description] — RESOLVED
✅ [Finding ID] — [Original description] — RESOLVED

### New findings this run
<!-- Findings in run N that were not in run N-1 -->
🆕 [Finding ID] — [Category] — [Description]

### Carried forward unchanged
<!-- Findings present in both runs, not resolved -->
⏳ [Finding ID] — [Category] — [Description] — [how many runs open]

### Progress summary
Run [N-1]: [n] HIGH, [n] MEDIUM, [n] LOW
Run [N]:   [n] HIGH, [n] MEDIUM, [n] LOW
Change:    HIGH [+n/-n], MEDIUM [+n/-n], LOW [+n/-n]

[IMPROVED / SAME / REGRESSED]
```

### Finding IDs

Assign each finding a stable ID: `[Run]-[Severity]-[Sequence]`
Examples: `1-H1`, `1-M1`, `2-L1`

When a finding is resolved, reference it by its original run ID in the diff.
This creates a searchable history: "finding 1-H1 was opened in run 1, 
resolved in run 2."

---

## After review

**If PASS (run 1):**
> "Review passed. Next step: run `/test-plan` for each story."

**If PASS (re-run):**
> "Review passed on run [N]. All HIGH findings resolved.
> [If MEDIUM findings remain:] [N] MEDIUM findings carried forward — 
> acknowledge in /decisions before /definition-of-ready.
> Next step: run `/test-plan`."

**If FAIL:**
> "Review failed — [N] HIGH findings remain.
> Diff shows [N] resolved, [N] new, [N] carried forward since run [N-1].
> Return to the story artefacts, address each HIGH finding, 
> then re-run `/review`. Do not proceed to /test-plan."

---

## What this skill does NOT do

- Does not fix stories — identifies findings for human or /definition to address
- Does not run /test-plan
- Does not make scope decisions — flags issues, humans decide
- Does not review code — pre-coding artefact review only
