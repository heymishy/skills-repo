---
evidence: >
  Two independently-caused instances of the same false-positive symptom in
  skills/definition/SKILL.md Step 6 (scope accumulator), five days apart,
  both requiring manual operator-facing reasoning to resolve rather than the
  skill distinguishing them itself. Instance 1 (2026-07-09,
  workspace/learnings.md "Scope-ratio heuristic assumes 1:1 granularity
  between discovery bullets and stories"): 2026-07-09-beta-readiness-infra's
  discovery named 3 MVP scope items as dense prose paragraphs already naming
  ~5 granular technical items each; decomposition produced 17 stories, a
  5.7x ratio, tripping the 1.5x drift-flag threshold purely from
  prose-vs-bullet granularity mismatch, not real drift. Instance 2
  (2026-07-14, workspace/learnings.md "Scope-ratio heuristic produces false
  positives for a second, distinct reason"): 2026-07-14-product-repo-config,
  choosing the walking-skeleton slicing strategy at Step 2 produced 14
  stories against 6 MVP items (2.33x), again tripping the same threshold —
  but this time because 2 of the 14 stories (prc-s1.4, prc-s4.3) were
  verification/measurement stories that exist because of the Step 2 strategy
  choice and the benefit-metric artefact's own metric definitions, not
  because of scope growth. Both instances were resolved manually via a
  decisions.md SCOPE entry rather than the skill offering a built-in
  resolution path for either root cause.
proposed_diff: >
  In skills/definition/SKILL.md Step 6 (scope accumulator), before computing
  the drift ratio: (1) for discovery MVP scope items written as prose
  paragraphs rather than a flat bulleted list, count granular sub-items
  already named within each paragraph as the baseline denominator, not the
  top-level item count — or explicitly ask the operator at Step 1 to confirm
  intended MVP-item granularity before any story is written. (2) Exclude two
  story categories from the ratio's numerator before flagging drift: stories
  whose sole purpose is verifying a preceding story in the same epic (a
  walking-skeleton/risk-first pattern, named as such in the epic's own
  Slicing Strategy field), and stories that are a metric's own named
  measurement mechanism (traceable directly to a benefit-metric.md entry's
  "Measurement method" field). Both categories are structurally required by
  decisions the same skill run already locked in earlier (Step 2's chosen
  strategy, the benefit-metric artefact's own metric definitions) — the
  ratio check currently re-litigates those decisions instead of trusting
  them.
confidence: high
anti_overfitting_gate: >
  Two independent instances, five days apart, on two unrelated features
  (beta-readiness-infra, product-repo-config), each with a distinct and
  specific root cause rather than a vague shared complaint — this is a
  materially stronger evidence base than a single-session observation.
  Watch for a 3rd occurrence with yet another root cause before assuming (1)
  and (2) above are an exhaustive fix — if a 3rd false-positive class
  appears after this change ships, the scope-ratio check likely needs a
  more fundamental rework (e.g. replacing the fixed 1.5x threshold entirely
  with a per-story classification pass) rather than a further patch.
status: pending_review
created_at: 2026-07-14
skill_target: definition
source: improve
---

# Proposal: Scope accumulator (Step 6) produces false positives from two independent, now-documented root causes

## Context

`skills/definition/SKILL.md` Step 6 flags scope drift whenever the story-count-to-MVP-item ratio exceeds 1.5x. This is meant to catch real scope creep hiding inside individually-reasonable stories. Two real feature decompositions have now tripped this threshold for reasons that have nothing to do with scope creep.

## What happened

**2026-07-09 (beta-readiness-infra):** MVP scope was written as 3 dense prose paragraphs, each already naming roughly 5 granular technical items. Decomposition into 17 stories was a faithful 1:1 mapping to those granular items — but the ratio check only sees "3 MVP items," producing a 5.7x reading with no real drift behind it.

**2026-07-14 (product-repo-config):** MVP scope was written as 6 flat bullet items (no granularity mismatch this time). Decomposition into 14 stories produced a 2.33x ratio. 12 of the 14 map cleanly 1:1 onto the 6 items. The other 2 — a walking-skeleton proof-of-mechanism story and an automated cross-tenant-isolation E2E spec — exist because of choices made earlier in the same `/definition` run (the Step 2 slicing-strategy choice, and the benefit-metric artefact's own Metric 3 definition naming this exact spec as its measurement method), not because of scope growth.

Both times, the operator and I resolved the false positive manually, writing a `decisions.md` SCOPE entry to justify why the ratio was misleading. Both times, the skill itself offered no path to distinguish "this ratio is misleading for reason X" from "this is real drift" — Option 3 ("Correct — some stories cover multiple MVP items, ratio is misleading") exists in the prompt text, but nothing in Step 6 actually helps identify *which* stories are inflating the ratio for a structural, already-decided reason versus genuine, undecided-yet growth.

## Proposed change

Two independent fixes, matching the two independent root causes:

1. **Granularity mismatch** (2026-07-09's cause): when discovery MVP scope is prose rather than a flat list, count sub-items named in the prose as the real baseline — or ask the operator to confirm intended granularity at Step 1, before any story exists to create a false signal later.

2. **Strategy/metric-blindness** (2026-07-14's cause): exclude from the ratio's numerator any story that is (a) a verification-only story for a walking-skeleton/risk-first slicing strategy, or (b) a metric's own named measurement mechanism per benefit-metric.md. Both are already-decided, upstream commitments the ratio check shouldn't re-litigate.

## Why this belongs in the skill (not just an operator-side fix)

The scope accumulator exists specifically to catch drift that individual story guards miss — but a check that requires manual override reasoning on 2 of its last 2 real invocations isn't discriminating real drift from false signal; it's just adding a mandatory justification step regardless of whether drift is real. That defeats the check's own purpose (catching drift that would otherwise be missed) while still costing the time a real check should cost only when it fires correctly.
