---
evidence: >
  A single-page bug report ("the Products nav is missing on /org/kanban")
  triggered a full-codebase audit (undertaken because the fix pattern was
  a shared render-shell helper, and the operator wanted to confirm no
  sibling instances existed before scoping the story) that surfaced 21
  additional sites with the identical defect across 10 files — a 22x scope
  increase over the reported symptom (pncg-s1, products-nav-coverage-gap,
  2026-08-26). This is not a first occurrence of the shape: an earlier
  story in this same defect family (pan-s1, 2026-07-30) made a narrower,
  undocumented-tradeoff choice to wire only 3 handlers and left an
  unactioned revisit trigger that sat for four weeks before pncg-s1's
  audit found the rest. When the scope-explosion was found this time, the
  orchestrating session paused before writing any story artefact and
  presented the operator with four concrete options (patch all sites
  directly with no abstraction; split into several smaller stories by
  area; fix only the originally-reported page and backlog the rest; wrap
  in one shared helper and fix everything found) rather than silently
  picking one. The operator chose the shared-helper option specifically
  for its property of making the defect class structurally harder to
  reintroduce — a reason that would not have surfaced from a narrower,
  single-page fix.
proposed_diff: >
  Add a named pattern to skills/discovery/SKILL.md (or wherever this repo's
  scope-verification guidance for a reported-defect-shaped intake lives):
  when investigation prior to writing a story artefact reveals the reported
  symptom is one instance of a broader, mechanically-identical defect class
  (same root cause, repeatable pattern, multiple call sites), do not
  silently narrow scope to the report nor silently expand scope to fix
  everything found. Instead, before any story/test-plan artefact is
  written, present the operator with an explicit small set of scoping
  options covering at minimum: (a) fix only the reported instance, (b) fix
  all found instances as individual patches, (c) split fixing all found
  instances across multiple smaller stories, (d) fix all found instances
  via one shared abstraction that also reduces recurrence risk for future
  instances. Record the operator's chosen option and rationale in
  decisions.md as a SCOPE or ARCH entry before proceeding to /test-plan.
  This generalizes the four-option framing used ad hoc in pncg-s1 into a
  standing instruction so future sessions don't have to reinvent it, and
  so a future "found more than reported" moment doesn't silently default
  to the narrowest fix (as pan-s1 did, with an accepted but unactioned
  revisit trigger left dangling).
confidence: medium
anti_overfitting_gate: >
  Only two known occurrences of this exact shape exist in this repo's
  history (pan-s1's narrow choice, pncg-s1's four-option resolution), and
  they differ in outcome specifically because the second one used the
  options-presentation pattern the first one lacked — this is directional
  evidence the pattern helps, not yet proof it generalizes across
  discovery contexts unrelated to shared-render-helper-shaped defects.
  Recommend keeping this as a discovery-time judgment prompt (not a hard
  gate) until a third occurrence either confirms the general applicability
  or reveals a domain where the four-option framing doesn't fit (e.g. a
  defect class with no viable shared-abstraction option).
status: pending_review
created_at: 2026-08-26
skill_target: discovery
source: improve
---

# Proposal: Present explicit scoping options when investigation reveals a defect class broader than the report

## Context

Short-track stories (test-plan → DoR → coding, bypassing full discovery) can still involve investigation before a story is written — e.g. confirming whether a reported single-page bug is actually a broader pattern. This repo has no standing instruction for what to do when that investigation finds the defect is repeated across many sites, only two prior occurrences to learn from.

## What happened

`pan-s1` (2026-07-30) found a version of the missing-Products-nav defect, wired 3 handlers, and left an explicit but unactioned "revisit if more sites are found" trigger. Nobody revisited it for four weeks. `pncg-s1` (2026-08-26) started from a single reported page, ran a full-codebase audit before writing any story artefact, found 22 total sites across 10 files, and — rather than repeating pan-s1's narrow-fix pattern or silently fixing everything without checking in — presented the operator with four explicit options (patch all, split into stories, fix-report-only, shared-helper). The operator chose the shared-helper option, citing its recurrence-prevention property as the deciding factor.

## Proposed change

Encode the four-option framing (fix-report-only / patch-all-individually / split-into-stories / shared-abstraction) as a standing discovery-time instruction for any investigation that finds a reported defect is one instance of a broader mechanically-identical class, with the chosen option and rationale logged in `decisions.md` before the story artefact is written.

## Why this belongs in the skill

Without an encoded instruction, the default failure mode (demonstrated by `pan-s1`) is a narrow fix plus an unactioned revisit trigger — the exact gap `pncg-s1`'s audit later had to rediscover and pay down. Encoding the options-presentation step means a future session facing the same "found more than reported" moment surfaces the choice to the operator up front rather than defaulting silently.
