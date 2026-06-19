# Review Report: [Story Title] — Run [N]

<!--
  USAGE: Produced by the /review skill. One file per run, per story.

  Finding ID format: [Run]-[Severity]-[Sequence]
  e.g. 1-H1 (first run, first HIGH), 2-M1 (second run, first MEDIUM)

  When a finding is resolved, reference its original ID in the diff section.
  This creates a searchable history: "1-H1 opened run 1, resolved run 2."

  Severity:
  - HIGH   — blocks /test-plan. Must be resolved.
  - MEDIUM — should be resolved. Can proceed if acknowledged in /decisions.
  - LOW    — improvement opportunity. Note for retrospective.

  File naming: [story-slug]-review-[N].md
  To evolve: update this template, open a PR, tag BA lead + QA lead.
-->

**Story reference:** [Link to story artefact]
**Date:** [YYYY-MM-DD]
**Categories run:** [A — Traceability / B — Scope / C — AC quality / D — Completeness]
**Outcome:** PASS / FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** [Category] — [Description]
  Fix: [Specific action required]

<!-- None if no HIGH findings. -->

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** [Category] — [Description]
  Risk if proceeding: [What could go wrong]
  To acknowledge: run /decisions, category RISK-ACCEPT

<!-- None if no MEDIUM findings. -->

---

## LOW findings — note for retrospective

- **[1-L1]** [Category] — [Description]

<!-- None if no LOW findings. -->

---

## Summary

[n] HIGH, [n] MEDIUM, [n] LOW across [n] stories.
**Outcome:** PASS / FAIL

<!-- PASS = no HIGH findings remain. -->

---

## Review Diff — Run [N] vs Run [N-1]

<!--
  Include this section only on runs N > 1. Prepend before the finding sections above.
  For run 1, omit this section entirely.
-->

### Resolved since last run
✅ [Finding ID from previous run] — [Original description] — RESOLVED

### New findings this run
🆕 [Finding ID] — [Category] — [Description]

### Carried forward unchanged
⏳ [Finding ID] — [Category] — [Description] — [n runs open]

### Progress summary
Run [N-1]: [n] HIGH, [n] MEDIUM, [n] LOW
Run [N]:   [n] HIGH, [n] MEDIUM, [n] LOW
Change:    HIGH [+n/-n], MEDIUM [+n/-n], LOW [+n/-n]

[IMPROVED / SAME / REGRESSED]
