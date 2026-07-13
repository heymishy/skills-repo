---
evidence: >
  During the 2026-07-09-team-identity-roles feature's /discovery and /definition
  runs (2026-07-13), the estimate prompt ("Run /estimate to record a rough
  focus-time forecast... Reply: /estimate — or skip to continue") was surfaced
  per skills/discovery/SKILL.md and skills/definition/SKILL.md, but the
  operator's actual reply moved the conversation forward without literally
  matching "/estimate" or "skip" (e.g. "Ready for review"). No estimate.e1/e2
  entry and no null marker were ever written to workspace/state.json for this
  feature — checked directly: workspace/state.json's estimate field only
  contains an e2 entry for the unrelated 2026-07-09-beta-readiness-infra
  feature, nothing for team-identity-roles at all. The skill's own instruction
  ("If the operator replies skip, write e1: null to estimate in
  workspace/state.json") only fires on a literal "skip" reply — a real,
  fast-moving session reply that implicitly moves past the prompt without
  literally saying so leaves no record the prompt was ever asked, silently
  defeating the E1/E2/E3 estimation-norms model CLAUDE.md describes.
proposed_diff: >
  In skills/discovery/SKILL.md's "Estimate prompt — E1" section and
  skills/definition/SKILL.md's "Estimate prompt — E2" section: broaden the
  skip-handling condition from "If the operator replies skip" to "If the
  operator's reply does not explicitly invoke /estimate" — i.e. any reply
  that isn't a literal /estimate invocation is treated as an implicit skip,
  and the skill still writes the null marker to workspace/state.json before
  proceeding, rather than only writing it on a literal "skip" reply. This
  keeps the actual estimation behaviour identical (E1/E2 remain fully
  optional, no new blocking behaviour introduced) while ensuring the record
  of "this was asked and not answered" is never silently lost.
confidence: medium
anti_overfitting_gate: >
  This is based on a single feature's estimate-prompt history
  (team-identity-roles), not a repeated pattern across many features — the
  earlier 2026-07-09-beta-readiness-infra feature DID get an E2 entry recorded
  correctly. The proposed fix is a narrow, low-risk broadening of an existing
  skip-detection condition (not a new mechanism), so the risk of overfitting
  to one session's specific conversational flow is low, but this should be
  watched over 2-3 more features before treating the broadened condition as
  fully validated — if operators frequently want to explicitly defer the
  estimate prompt without it being recorded as skipped (e.g. "answer this
  later in the same session"), the broadened condition may need a "deferred"
  state distinct from "skipped."
status: pending_review
created_at: 2026-07-13
skill_target: discovery,definition
source: improve
---

# Proposal: Treat any non-`/estimate` reply to the estimate prompt as an implicit skip, and always write the null marker

## Context

`skills/discovery/SKILL.md`'s "Estimate prompt — E1" section and `skills/definition/SKILL.md`'s "Estimate prompt — E2" section both ask the operator to reply `/estimate` or `skip`, and both correctly specify writing `"e1": null` (or `"e2": null`) to `workspace/state.json` when the operator replies `skip`. Neither skill currently specifies what to do when the operator's reply does neither — moves the conversation forward with an adjacent reply (e.g. confirming a different next step) that never literally answers the prompt.

## What happened

For the `2026-07-09-team-identity-roles` feature, both the discovery and definition estimate prompts were surfaced correctly per the skill's own text, but the operator's actual replies moved past them without a literal `/estimate` or `skip`. No `null` marker was ever written. This was only discovered incidentally, weeks later in delivery, when running `/definition-of-done` and checking `workspace/state.json` for estimate data to reconcile — finding the field entirely absent for this feature, with no way to distinguish "never asked" from "asked, operator chose not to answer" from "a bug lost the record."

## Proposed change

Broaden the skip-detection condition in both skills from "the operator replies `skip`" to "the operator's reply does not explicitly invoke `/estimate`" — any non-`/estimate` reply is treated as an implicit skip, and the `null` marker write still happens. This requires no new interaction pattern and does not make estimation any more mandatory than it already is (E1/E2 remain fully optional) — it only ensures the *record* that the prompt was surfaced and not explicitly answered is never silently lost.

## Why this belongs in the skills (not just an operator-side fix)

The estimation-norms model (`CLAUDE.md`'s "Estimation model" section) depends on E1/E2/E3 actuals accumulating across features to calibrate defaults after 3+ features. A silently-lost prompt-and-skip is invisible to that model and to any future `/improve`/`/estimate` E3 run trying to reconcile — the fix belongs in the skill's own instruction text, not in operator discipline, since operators in fast-moving sessions will predictably keep moving past a prompt that isn't the literal next thing they're thinking about.
