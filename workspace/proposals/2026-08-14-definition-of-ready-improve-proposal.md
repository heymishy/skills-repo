---
evidence: >
  The same defect class — a story's own AC verification script missing a
  scenario for one of its named ACs — was found and fixed independently on
  three separate stories in the same feature (wugs-s1, wugs-s2, wugs-s5),
  each time only at /verify-completion, not at DoR sign-off where it would
  have been cheaper to catch. All three instances were the same mechanical
  gap: an AC number appearing in the story text with no corresponding
  "Covers: ACn" scenario in that story's verification script, only named as
  a systemic pattern after the third occurrence (wugs-s5 DoD Observation #3,
  web-ui-guardrails-standards-surface, 2026-08-13).
proposed_diff: >
  Add a mandatory check to skills/definition-of-ready/SKILL.md's own DoR
  hard-block list: before sign-off, cross-check that every AC number
  referenced in the story artefact has at least one corresponding "Covers:
  ACn" scenario in that story's verification script
  (artefacts/[feature]/verification-scripts/[story-slug]-verification.md).
  If any AC has zero covering scenarios, this is a hard block — DoR cannot
  sign off until either the verification script is updated or the AC is
  explicitly marked as covered by a named alternative mechanism (a test
  plan test, a manual check with a RISK-ACCEPT entry).
confidence: high
anti_overfitting_gate: >
  Three independent occurrences, same mechanical root cause each time,
  across three different stories with otherwise-unrelated content (an
  adapter-extension story, a read-only view story, a form story) — this is
  not a story-type-specific quirk, it is a generic authoring gap in how
  verification scripts get written relative to the story's own AC list.
  The proposed check is purely mechanical (a name-matching cross-check, not
  a judgment call), so there is minimal risk of the fix itself introducing
  new false positives.
status: pending_review
created_at: 2026-08-14
skill_target: definition-of-ready
source: improve
---

# Proposal: DoR sign-off should cross-check every AC has a covering verification-script scenario

## Context

`skills/definition-of-ready/SKILL.md` runs a set of hard-block checks (H1-H9 and extensions) before a story can proceed to implementation. Currently, no hard block verifies that every AC named in the story has a corresponding scenario in that story's own verification script.

## What happened

Across a single 12-story feature, this exact gap — an AC with no covering verification-script scenario — was found and fixed three separate times, each time only discovered at `/verify-completion`, the last possible point before a PR is opened. Each occurrence cost a full review-and-fix cycle at the most expensive point in the pipeline to catch it, when the same check applied five minutes earlier at DoR sign-off would have caught it before any implementation work began.

## Proposed change

Add a mechanical cross-check to DoR's existing hard-block list, detailed in `proposed_diff` above: every AC number in the story must have at least one matching "Covers: ACn" scenario in the verification script, or DoR cannot sign off.

## Why this belongs in the skill (not just an operator-side fix)

This is exactly the kind of five-minute, purely mechanical check DoR's hard-block system already exists to enforce (see H2's existing "≥3 ACs Given/When/Then" style check) — it recurred three times in one feature specifically because nothing in the current DoR flow verifies this relationship, leaving it to whoever writes the verification script to remember unprompted. A hard block closes the gap for every future story across every future feature, not just this one.
