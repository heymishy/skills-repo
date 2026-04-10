---
title: Software Engineering Policy Floor
discipline: software-engineering
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Software Engineering Policy Floor

**Discipline:** software-engineering
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Floor Requirements

- MUST have a passing automated test suite committed before the implementation PR is merged
- MUST declare all external dependencies in a version-pinned manifest file before the PR is merged
- MUST record a decision log entry for any architectural decision made during delivery
