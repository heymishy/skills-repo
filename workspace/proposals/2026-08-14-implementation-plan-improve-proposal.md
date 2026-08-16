---
evidence: >
  Four related gaps observed across a 12-story feature's implementation-plan
  authoring, three of them recurring 2-3 times independently before being
  named as systemic: (1) plans written against story/DoR text rather than
  the real, merged upstream code produced worse review outcomes than plans
  written after re-deriving the real shape from source — the one story in a
  10-story run with zero blocking findings across two full review rounds was
  the first to consistently apply the read-real-code discipline from its own
  planning stage (wugs-s10 DoD Observation #1, web-ui-guardrails-standards-surface,
  2026-08-13). (2) Three independent removal/deletion-framed stories each had
  their own AC text undercount the real cross-reference/route/test-file scope
  needing changes (wugs-s9: 2 of 5 real function names wrong; wugs-s11: 3 of 7
  real routes named, 2 of 5 real test files named; wugs-s12: 1 of 3 real
  cross-references named, one spanning a different epic's script) — each
  found only via an unprompted, exhaustive grep sweep across the whole repo,
  not by anything the story's own text signalled. (3) A plan's own per-task
  test-count predictions, written as absolute totals before Task 1 starts,
  were invalidated by review-round test additions in earlier tasks on at
  least two stories (wugs-s4, wugs-s9), requiring manual correction at later
  dispatch time. (4) A plan's own AC3 test design (drafted before any code
  existed) missed that the story's AC3 text required dual coverage
  ("approve or reject"), caught only by a pre-dispatch re-read of the story
  text against the plan's draft, not by any review round (wugs-s9 DoD
  Observation #1). (5) [Added 2026-08-16, wuce-self-serve-invites epic] A
  shared-code or shared-documentation change not being checked against
  every OTHER artefact that already depends on it recurred 4 times across
  one 6-story epic, always caught live by a reviewer rather than by any
  named step: wsi-s1's own D2/D4 test files hardcoded a route count that a
  new admin-gated route silently invalidated; wsi-s4 touched wsi-s2's and
  wsi-s3's existing mock pools without either story's plan flagging the
  dependency upfront; wsi-s5's own AC4/NFR tests were themselves affected by
  a later change and had to be re-verified; wsi-s6 cited an accessibility
  guardrail (MC-A11Y-01) whose citation scope didn't match how the guardrail
  was actually written. See workspace/learnings.md, 2026-08-16 entry, for
  full detail on all 4 instances.
proposed_diff: >
  Add to skills/implementation-plan/SKILL.md: (1) A mandatory step, before
  drafting the plan's Design note, to grep the real repo for the actual
  current shape of any function/route/table the plan will build on or
  remove — not just read the story/DoR text's description of it. (2) For
  stories explicitly framed as removal/deletion (detectable via story title
  or Architecture Constraints language like "remove", "delete", "drop"), an
  explicit mandatory sub-step: run an exhaustive `grep -rln` sweep for the
  real symbol/route/table names being removed across the WHOLE repository,
  not just the files/exports the story's own AC text names, and log any
  scope expansion beyond the literal AC text as a SCOPE-EXPANSION decision
  in the feature's decisions.md before finalizing the plan. (3) Change
  per-task expected test-count guidance in the plan template from absolute
  numbers ("Expected: 6 passed") to relative phrasing ("Expected: N more
  than currently committed, i.e. current total + this task's new checks").
  (4) Add an explicit "final AC-text sanity pass" instruction: immediately
  before each task's dispatch (not just once when the whole plan is
  authored), re-read the relevant AC's exact wording against that task's
  own test snippet to catch drift between plan-authoring time and
  dispatch time. (5) Add an explicit "shared-dependency sweep" step: before
  finalizing any plan that modifies shared code, a shared test fixture/mock
  pool, or a cited shared standard/guardrail, list every OTHER story or
  artefact in the same feature (or, for guardrails, any other feature) that
  already depends on the thing being changed, and confirm each one still
  holds under the change — not just the current story's own ACs.
confidence: high
anti_overfitting_gate: >
  Findings (1) and (2) each recurred independently across 3+ separate
  stories with distinct root causes each time (wrong names vs. undercounted
  routes vs. undercounted cross-references spanning a different epic) — this
  is a materially stronger evidence base than a single-session observation,
  and the undercounting pattern specifically grew in scope each time it
  recurred rather than shrinking, suggesting it is not self-correcting
  without a structural fix. Findings (3) and (4) each occurred twice.
  Finding (5) recurred 4 times within a single 6-story epic — a higher
  density than findings (1)-(4), but confined to one feature so far; worth
  confirming it recurs across a second, unrelated feature before treating
  the fix as fully validated rather than epic-specific noise.
  Watch for: whether the mandatory grep-sweep step materially slows down
  plan authoring for genuinely small removal stories where the story text
  IS already complete — if so, the check may need a size/complexity gate
  rather than applying unconditionally to every removal-framed story. For
  finding (5), watch for whether the shared-dependency sweep becomes a
  rubber-stamped checkbox rather than a genuine check once it's routine.
status: pending_review
created_at: 2026-08-14
skill_target: implementation-plan
source: improve
---

# Proposal: Implementation plans should verify against real upstream code, not story text, especially for removal-framed stories

## Context

`skills/implementation-plan/SKILL.md` currently drafts a plan's Design note primarily from the story/DoR/test-plan artefacts. Across a 12-story feature this session, plans that instead re-derived the real, current shape of the code they built on or removed — by reading the actual merged source directly — produced measurably cleaner downstream review outcomes than plans that trusted the story text as-is.

## What happened

Three removal-framed stories in the same feature each independently found their own AC text undercounted real scope, not overcounted or correctly-counted — every single removal story in the epic found MORE real cross-references than its own text named, and the size of the gap grew each time (2 wrong names → 3-of-7 routes named → 1-of-3 cross-references named, one in a different epic entirely). This is not a random distribution; it's a systematic pattern where removal-framed stories are structurally harder to scope completely at `/definition` time than addition-framed ones, because there's no positive test a removal story's own author can write to prove nothing was missed — only an exhaustive negative search does that.

Separately, plans that predicted absolute test counts per task were invalidated whenever an earlier task's review round added tests the plan hadn't anticipated, and a plan's own AC-derived test design was found to have missed a dual-coverage requirement (an AC text plural — "approve or reject" — implying two endpoints needed testing, not one) that only a fresh re-read at dispatch time caught.

**[Added 2026-08-16]** A separate, distinct 6-story epic (`wuce-self-serve-invites`) surfaced its own recurring pattern: a change to shared code, a shared test fixture, or a cited shared standard not being checked against every other artefact that already depends on it. This happened 4 times — a new admin-gated route silently invalidating two other test files' hardcoded route counts (wsi-s1), a later story touching two earlier stories' mock pools without either plan flagging it upfront (wsi-s4), a story's own tests needing re-verification after a later change (wsi-s5), and a guardrail citation whose scope didn't match how the guardrail was actually written (wsi-s6). Every instance was caught live by a human or review pass, never by a named step in the plan itself — the same shape of gap as findings (1)-(2) above (real state diverging from what the plan/story text assumed), but about shared dependencies rather than removal scope.

## Proposed change

Four concrete additions to the skill's own instructions, detailed in `proposed_diff` above: a real-code verification step before drafting, a removal-story-specific exhaustive grep-sweep sub-step with mandatory SCOPE-EXPANSION logging, relative (not absolute) test-count phrasing, and a per-task pre-dispatch AC-text sanity re-read.

## Why this belongs in the skill (not just an operator-side fix)

This pattern recurred independently across multiple stories within a single feature, each time requiring the same manual investigation to be re-derived from scratch rather than following a named, repeatable procedure. Making the real-code-verification and removal-story grep-sweep steps explicit in the skill's own instructions means future removal stories in ANY feature inherit this discipline automatically, rather than depending on whoever happens to be planning that specific story independently rediscovering the same lesson a fourth, fifth, and sixth time.
