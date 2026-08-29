---
evidence: >
  CLAUDE.md's standing instruction ("For UI or frontend changes, start the
  dev server and use the feature in a browser before reporting the task as
  complete") was not followed for res-s4 (2026-08-27-revise-earlier-stage)
  at any point in its delivery — not at /verify-completion, not at
  /branch-complete, not at /definition-of-done. All three closed the story
  as complete on the strength of 36 automated (jsdom-free, source-inspection
  or handler-level) tests and two rounds of manual code-path tracing, with
  zero real-browser rendering. A live browser check was only performed when
  the operator explicitly requested one AFTER /definition-of-done had
  already marked the story COMPLETE. That check found a genuine, real gap
  (a flag marker present in the DOM but not visible without horizontal
  scroll at a normal viewport, on one of three render sites) that none of
  the 36 tests, two DoR gates, or two final-review rounds had caught,
  because none of them rendered the page.
proposed_diff: >
  Add a conditional mandatory step to skills/verify-completion/SKILL.md,
  positioned alongside the existing "Route/handler E2E coverage check"
  section (same trigger condition: diff touches src/web-ui/routes/ or a
  rendering function). When true, and no browser check has occurred this
  session (checked by asking the operator, or by requiring a
  session-scoped marker like the E2E coverage check's own residual-risk
  list), the story cannot proceed to /branch-complete without either (a)
  a real Claude-in-Chrome (or equivalent) browser check of the changed
  render output, or (b) an explicit RISK-ACCEPT in decisions.md deferring
  it, mirroring exactly how CSS-layout-dependent ACs are already required
  to be classified per CLAUDE.md's B2 rule. This turns the existing
  standing instruction (currently just prose in CLAUDE.md with no
  pipeline enforcement point) into an actual gate, the same way the E2E
  route-coverage check already turned "run e2e tests too" into a
  mandatory, diff-conditional step rather than an optional good practice.
confidence: medium
anti_overfitting_gate: >
  This is a single-story data point (res-s4) for the SPECIFIC finding
  (viewport overflow hiding a marker), but the underlying gap — a standing
  CLAUDE.md instruction with no enforcement point in any skill — is
  structural, not story-specific: the same instruction existed, unenforced,
  for every prior UI-touching story in this session (res-s1 through res-s3
  also shipped without a live browser check). Confidence is medium rather
  than high because the specific proposed mechanism (a session-scoped
  "was a browser check performed" marker) needs design work to avoid being
  either too easy to game (a hollow confirmation) or too rigid (blocking
  stories with no meaningfully renderable diff, e.g. a pure backend route
  change). The CSS-layout-dependent RISK-ACCEPT escape hatch already
  proven at B2 is the right shape to reuse, reducing the risk of this
  becoming an unconditional blocker.
status: pending_review
created_at: 2026-08-29
skill_target: verify-completion
source: improve
---

# Proposal: /verify-completion should gate on a real browser check for UI-rendering diffs, mirroring the E2E route-coverage check

## Context

`skills/verify-completion/SKILL.md` already has one diff-conditional mandatory step: "Route/handler E2E coverage check (mandatory when the diff touches route/handler files)," added after `evcg-s1` found that a clean local full-suite result could still hide CI-only E2E failures. That step works well — it turned an easily-skipped good practice into an actual, enforced gate with a clear trigger condition.

CLAUDE.md separately carries a standing instruction: "For UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete. Make sure to test the golden path and edge cases... Type checking and test suites verify code correctness, not feature correctness - if you can't test the UI, say so explicitly rather than claiming success." This instruction has no corresponding gate in any skill file — it relies entirely on the agent choosing to follow it unprompted, session after session.

## What happened

res-s4 (`2026-08-27-revise-earlier-stage`) shipped a UI feature (a flag marker on three separate step-nav render sites, plus a client-side DOM-patch mechanism) through the full pipeline — DoR, four implementation tasks, two rounds of mandatory final cross-task review, `/verify-completion`, `/branch-complete`, `/definition-of-done` — entirely on the strength of automated tests and manual code-path tracing. No step in that chain rendered the actual page in a browser. `/definition-of-done` closed the story as COMPLETE.

Only after the operator explicitly asked for "a chrome review" — a request outside the normal pipeline flow, made after DoD had already closed — was a real browser check performed. It found a genuine gap: the flag marker existed correctly in the DOM (confirmed by 36 passing tests and two review rounds) but was not visible without horizontal scroll at a normal ~1272px viewport width, on one of the three render sites. This is exactly the class of finding CLAUDE.md's own instruction exists to catch, and exactly the class of finding that instruction, unenforced, failed to catch across four consecutive stories in this same feature (res-s1 through res-s4).

## Proposed change

Add a step to `/verify-completion` — the same skill that already has a working precedent for exactly this shape of gate (the E2E route-coverage check) — requiring either a real browser check or an explicit RISK-ACCEPT before a UI-rendering diff can proceed to `/branch-complete`. Full mechanism detail in `proposed_diff` above.

## Why this belongs in the skill (not just an operator-side fix)

An instruction that only exists as prose in CLAUDE.md, with no gate anywhere in the pipeline, depends entirely on the delivering agent remembering to follow it unprompted on every single UI story — this session's own res-s1 through res-s4 delivery is direct evidence that reminder-only enforcement doesn't reliably work, the same lesson `evcg-s1` already taught for E2E coverage specifically. `/verify-completion` is the right skill for this because it is the last gate before a PR opens, and it already has the exact conditional-step pattern (diff touches route/handler files → mandatory check) this proposal needs to replicate for diffs that touch rendering.
