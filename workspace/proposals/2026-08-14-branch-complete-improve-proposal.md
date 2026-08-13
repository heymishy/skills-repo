---
evidence: >
  A DoR artefact named a REQUIRED pre-merge manual verification step
  (confirming a mocked external API's real response shape against the
  actual live API before trusting the mock in production code). The only
  trace of this requirement anywhere in the delivery flow was an unchecked
  markdown checkbox in the PR description template. Nothing in
  branch-complete's own gate validation (src/enforcement/cli-outer-loop.js's
  validateBranchComplete) checked for it. The PR merged with the step never
  performed, discovered only when the operator was directly asked whether
  it had been done and confirmed it had not (wugs-s6, DoD Observation #2,
  web-ui-guardrails-standards-surface, 2026-08-13). Logged as a RISK-ACCEPT
  and, as of this proposal's writing, still not performed.
proposed_diff: >
  Extend skills/branch-complete/SKILL.md's own gate validation to check for
  a DoR-flagged required-manual-step marker before the branch-complete gate
  can pass. Concretely: when a DoR artefact contains a REQUIRED manual
  verification step (detectable via a structured marker in the DoR
  template, e.g. a "Required Manual Steps" section with named items), the
  branch-complete artefact must carry a corresponding
  manualVerificationRequired: true field plus a
  manualVerificationRecorded: <url-or-evidence-reference | null> field. If
  manualVerificationRequired is true and manualVerificationRecorded is null,
  the gate fails with a clear message naming the specific required step and
  where its procedure/evidence should be recorded — rather than allowing
  the PR to merge on the strength of an unchecked markdown box a human may
  or may not have actually reviewed.
confidence: medium
anti_overfitting_gate: >
  This is a single occurrence in the evidence base, not a recurring
  pattern across multiple stories — the proposed fix is justified by the
  severity of the gap (a required verification step silently skipped with
  no mechanical trace) rather than by frequency. Before implementing,
  confirm this is not already covered by an existing, differently-named
  mechanism elsewhere in the DoR/branch-complete chain that this session
  simply didn't discover — a quick audit of DoR templates across 2-3 other
  features for a similar "required manual step" pattern would help confirm
  whether this is a first occurrence or a recurring-but-previously-unnamed
  gap.
status: pending_review
created_at: 2026-08-14
skill_target: branch-complete
source: improve
---

# Proposal: branch-complete's gate should mechanically enforce DoR-required manual verification steps

## Context

`skills/branch-complete/SKILL.md` opens a draft PR once a story's implementation is verified. The gate that governs this transition currently has no mechanism to check whether a DoR-flagged REQUIRED manual step (something that cannot be automated, e.g. a real-external-API sandbox verification) was actually performed before the PR merges.

## What happened

A story's DoR named a required manual verification step — confirming a hand-authored API mock's assumed response shape against the real external API, since the entire test suite exercised that mock, never the real API. The PR's description template included a checkbox for this step, but nothing mechanically enforced it. The PR merged with the checkbox unchecked and the step never performed — the gap was only discovered because the operator was directly asked, after merge, whether it had been done.

## Proposed change

Add a structured, machine-checkable field pair to the branch-complete artefact (`manualVerificationRequired` / `manualVerificationRecorded`), and extend branch-complete's own gate validation to fail when a DoR-required step has no recorded evidence — detailed in `proposed_diff` above.

## Why this belongs in the skill (not just an operator-side fix)

A markdown checkbox in a PR description is not a gate — it is a suggestion that happens to be easy to overlook once the automated test suite is green and everything else looks ready to merge. Moving this check into the same mechanical gate validation that already blocks branch-complete on other criteria means a required manual step can no longer silently merge unperformed, regardless of how confident the automated signals look.
