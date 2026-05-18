# Benefit Metric: Skill Robustness Improvements (Consumer-Reported)

**Discovery reference:** artefacts/2026-05-18-skill-robustness-improvements/discovery.md
**Date defined:** 2026-05-18
**Metric owner:** Platform Operator (heymishy)
**Reviewers:** abhijeet-qsofte (OrderHub team — issue #344 reporter)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a targeted reliability fix to three inner loop skills based on directly observed consumer failures. No process or tooling hypothesis is being tested. All three metrics measure whether the reported gaps are closed.

---

## Tier 1: Product Metrics (Operator Value)

### M1 — Inner loop hang-free rate on no-origin repos

| Field | Value |
|-------|-------|
| **What we measure** | Whether `/branch-complete`, `/implementation-plan`, and `/subagent-execution` complete without hanging when no `origin` remote is configured in the repository |
| **Baseline** | 0% — any session in a no-origin repo currently blocks indefinitely on `git fetch origin master` with no timeout; requires manual cancellation and loses session state (confirmed by OrderHub team, 2026-05-10) |
| **Target** | 100% — all three skills handle a missing or unreachable `origin` remote with a logged warning and fallback to local branch or worktree file; zero hangs |
| **Minimum validation signal** | At least one confirmed session on a no-origin repo completes without hanging after fix ships |
| **Measurement method** | Manual test by platform operator against each of the three affected skills in a local-only repo (no `origin` configured); run once per skill post-ship. OrderHub team to confirm on their environment. |
| **Feedback loop** | If any of the three skills still hangs in a no-origin repo post-ship, the story is not complete — reopen and fix before closing. No partial credit. |

---

### M2 — DoD entry condition actionability (structural completeness)

| Field | Value |
|-------|-------|
| **What we measure** | Whether the `/definition-of-done` early-exit block (invoked before PR merge) contains all three required guidance elements: (a) how to check PR merge status, (b) what steps to take next to progress to merge, (c) why the gate exists |
| **Baseline** | 0 of 3 elements present — current output is a single line with no contextual guidance (confirmed by abhijeet-qsofte, issue #344) |
| **Target** | 3 of 3 elements present in the shipped SKILL.md entry condition block |
| **Minimum validation signal** | At least one operator who did not author the fix reads the new message and takes the correct next action without asking a follow-up question |
| **Measurement method** | Structural inspection of the shipped SKILL.md at DoD time (element checklist); post-ship confirmation from OrderHub team on next DoD run |
| **Feedback loop** | If any of the three elements is absent in the shipped text, the story is not complete. If OrderHub reports a follow-up question was needed, review message clarity before closing. |

---

### M3 — Infrastructure story DoD Step 6 completion time

| Field | Value |
|-------|-------|
| **What we measure** | Time for an operator to complete DoD Step 6 on a story where measurement is not yet possible (infrastructure / foundational story with no user-facing signal yet) |
| **Baseline** | Not yet established — OrderHub reports a multi-question confusion cycle on every infrastructure story DoD run; estimated >2 minutes per story for Step 6 alone, with no satisfactory outcome (the question cannot be answered meaningfully) |
| **Target** | Under 30 seconds for Step 6 on an infrastructure story — operator answers the measurement-ready gate question with "not yet", records a brief evidence note (`not-yet-measured`), and moves on; no further Step 6 prompts |
| **Minimum validation signal** | OrderHub team confirms that the next DoD run on an infrastructure story completes Step 6 without encountering unanswerable measurement prompts |
| **Measurement method** | Timed session by abhijeet-qsofte on the first DoD run after fix ships; reported back via issue #344 or a follow-up comment |
| **Feedback loop** | If the operator is still asked for a measurable signal on an infrastructure story post-ship, the Step 6 gate condition is not working correctly — reopen and fix. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Inner loop hang-free rate | sri.1 (git fetch timeout in 3 skills) | To be linked at /definition |
| M2 — DoD entry condition actionability | sri.2 (DoD entry condition message expansion) | To be linked at /definition |
| M3 — Infrastructure story DoD Step 6 time | sri.3 (DoD Step 6 measurement-ready gate) | To be linked at /definition |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is /definition and /implementation-plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based
- Automated measurement infrastructure — all three metrics are verified manually at ship time; the fixes are too small to warrant instrumentation overhead
