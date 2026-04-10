---
title: Quality Assurance Core Standards
discipline: quality-assurance
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Quality Assurance Core Standards

**Discipline:** quality-assurance
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These standards define the universal baselines for quality assurance across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Requirements

- MUST have a test plan authored and approved before implementation begins
- MUST maintain the automated regression suite — the suite must not shrink without an approved justification recorded in a decision log entry
- MUST produce test evidence in a format that allows independent verification of coverage claims
- SHOULD classify tests according to the test pyramid layers with explicit counts per layer recorded
- SHOULD automate regression tests for any defect whose root cause has been identified and resolved
- MAY use manual test checklists for surface types where automated execution is not available, provided each execution is signed off with a named reviewer
