# Decisions: Rubber-Duck Review Capture

## D1 — No speech-to-text service exists in this codebase; integration folded into rdrc-s1 rather than deferred

**Date:** 2026-08-09 (/definition, D2-platform gate check)
**Context:** `rdrc-s1`'s original AC1 draft assumed a speech-to-text transcription service was available to call. A source search (package.json dependencies, `src/`, `scripts/`) confirmed no such integration exists anywhere in this codebase — the only matches for "transcript" were unrelated (a UI label, GitHub Copilot Chat's own text-chat logs).
**Decision:** Rather than deferring `rdrc-s1` to a later phase (which would stall the epic's first, riskiest, foundational story), the speech-to-text API selection and integration is folded into `rdrc-s1`'s own scope as first-time implementation work, not treated as a pre-existing capability the story merely consumes.
**Rationale:** `rdrc-s1` is deliberately the cheapest, fastest path to test the riskiest assumption (does extraction produce signal, not noise) — deferring it further would delay validating that assumption without a compelling reason, and a basic cloud speech-to-text API integration is a well-understood, low-risk piece of work in its own right (unlike the extraction-quality question itself, which is genuinely uncertain).
**Revisit trigger:** None expected — this is a one-time integration; revisit only if the chosen speech-to-text provider proves unsuitable during implementation, in which case log a new decision entry naming the replacement and why.

---

## RISK-ACCEPT-1 — W4 acknowledged for all 5 stories: verification scripts not yet reviewed by a separate domain expert before DoR sign-off

**Date:** 2026-08-09 (/definition-of-ready, all 5 rdrc stories)
**Context:** `/definition-of-ready`'s W4 warning checks that each story's AC verification script has been reviewed by a domain expert before sign-off. This is a solo-operator repo — the metric owner, discovery approver, and the only available reviewer are the same person (per `benefit-metric.md`'s own "no separate non-engineering reviewer exists outside the metric owner" note).
**Decision:** Acknowledge and proceed to sign-off without a separate pre-code review pass. The operator will use each verification script directly as their own pre-code sign-off check and again as the post-merge smoke test, per the script's own stated "three moments" (pre-code, post-merge, demo) — collapsing the first two roles into one person rather than skipping the check.
**Rationale:** Blocking sign-off on scheduling a formal second-reviewer pass that structurally cannot happen in a solo-operator context would stall the pipeline without adding real verification value — the same verification script still gets read and used, just by the same person who will also implement it.
**Revisit trigger:** If a second contributor joins this repo, restore the separate-reviewer expectation for future DoR runs.
