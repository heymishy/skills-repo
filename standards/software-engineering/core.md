---
title: Software Engineering Core Standards
discipline: software-engineering
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Software Engineering Core Standards

**Discipline:** software-engineering
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These standards define the universal baselines for software engineering delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Requirements

- MUST have a passing automated test suite committed before the implementation PR is merged
- MUST express all public API contracts in a machine-readable schema before the API is deployed
- MUST record all architectural decisions in a decision log entry at the time the decision is made
- SHOULD structure code so that each named service boundary can be deployed independently of others
- SHOULD declare all external dependencies with pinned version references in a manifest file
- MAY include performance benchmarks in the test suite when a latency SLO is defined for the service
