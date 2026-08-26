---
evidence: >
  pncg-s1 Task 4's first implementation attempt (fixing settings.js's
  missing Products-nav sidebar) split renderSettingsPage into a new
  _buildSettingsBody helper plus an unchanged renderSettingsPage, with
  handleGetSettings calling both _buildSettingsBody() and
  renderShellWithNav() itself. The implementer wrote a decisions.md ARCH
  entry explicitly claiming this "follows Task 2's precedent" (Task 2
  being products.js's _renderRoadmapTab/_renderGuardrailsForm/
  _renderProductNew fixes). A code-quality review re-read Task 2's actual
  diff rather than accepting the decisions.md citation at face value, and
  found the claim was false: Task 2 never split any function — it only
  added navProducts/noProductJourneyCount as new optional trailing
  parameters to existing render functions, with the calling handler
  fetching getProductsNavSummary and passing the result straight in. The
  settings.js implementation was reverted and redone as parameter-
  threading to genuinely match Task 2, and the decisions.md entry was
  rewritten to honestly document both the original incorrect claim and
  the correction (2026-08-26, products-nav-coverage-gap decisions.md,
  Task 4 ARCH entry). Had the reviewer trusted the citation instead of
  re-reading the cited diff, the mismatch would have shipped: not a
  functional bug (the split implementation worked and passed its tests),
  but a maintainability defect (a production function with no production
  caller, a duplicated options literal) justified by a false paper trail
  that would have misled the next reader of decisions.md into treating
  the split as the repo's actual established pattern.
proposed_diff: >
  Add an explicit instruction to skills/subagent-execution/SKILL.md's
  code-quality (or cross-cutting) reviewer dispatch template: when a
  task's implementation or its decisions.md entry cites a specific prior
  task, commit, or file as precedent/justification for an approach ("this
  follows Task N's pattern", "matches the existing X convention"), the
  reviewer MUST independently re-read the cited prior diff or file before
  accepting the claim — never accept a precedent citation as true on the
  strength of the citation's own wording. If the cited precedent doesn't
  actually match, flag it as a finding regardless of whether the
  implementation itself is otherwise spec-compliant, since an inaccurate
  precedent citation in decisions.md is itself a defect (misleads future
  readers) independent of whether the code works.
confidence: medium
anti_overfitting_gate: >
  One confirmed occurrence in this repo's history. The failure mode
  (citing a precedent without re-verifying it) is a generic category of
  reviewer error rather than specific to render-shell fixes or this
  story, so the fix generalizes cleanly as a standing reviewer
  instruction — but with only one occurrence, there isn't yet evidence on
  how often review dispatches currently skip this check versus how often
  it's caught anyway by incidental re-reading (as happened here). Revisit
  after a second occurrence, or after this instruction has been in place
  for several stories with cited precedents, to confirm it doesn't add
  reviewer overhead disproportionate to the (so far, single) defect it
  would have caught.
status: pending_review
created_at: 2026-08-26
skill_target: subagent-execution
source: improve
---

# Proposal: Reviewer dispatches must re-verify cited precedents, not trust the citation

## Context

Implementation tasks and their decisions.md entries sometimes justify an approach by citing a specific prior task or file as precedent ("follows Task N's pattern"). This citation can be wrong even when the implementer isn't being careless — cross-referencing a prior task's actual shape from memory, mid-implementation, is exactly the kind of claim that's easy to get subtly wrong without noticing.

## What happened

pncg-s1 Task 4's settings.js fix cited Task 2 as precedent for a function-split approach. Task 2 had actually used parameter-threading, not a split. A code-quality review caught the mismatch only because it happened to re-read Task 2's real diff rather than taking the citation at its word. The implementation was reverted and correctly redone; the decisions.md entry was rewritten to document the correction honestly rather than erasing the history.

## Proposed change

Make precedent re-verification an explicit, named step in the reviewer dispatch template: any cited "this follows X" claim triggers a direct re-read of X before the reviewer can pass the task on that basis.

## Why this belongs in the skill

The catch this time was incidental — the reviewer happened to check. Without an explicit instruction, whether a future review catches the same class of error depends on the individual reviewer's diligence rather than the dispatch template's own design. Naming the check makes it a designed catch instead of a lucky one.
