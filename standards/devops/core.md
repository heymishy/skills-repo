---
title: DevOps Core Standards
discipline: devops
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# DevOps Core Standards

**Discipline:** devops
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for DevOps delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

DevOps standards govern the design and operation of delivery pipelines, deployment automation, and observability practices that connect code changes to production. These standards apply to any delivery that creates or modifies a CI/CD pipeline or production observability configuration.

## Outcomes

- Code changes travel from commit to production through an automated pipeline so that manual deployment steps cannot introduce unreviewed artefacts.
- Pipeline failures surface immediately so that broken builds do not block the team.
- Production systems emit structured observability signals so that incidents are detectable and diagnosable without privileged access to host environments.

## Requirements

- MUST automate the path from a merged commit to a production deployment through a pipeline that requires no manual file copy or ad-hoc shell access so that deployment artefacts are always traceable to a reviewed commit
- MUST block a deployment pipeline on any failing automated test so that a known-broken build cannot be promoted to production
- MUST emit structured logs and health metrics from all production services so that incidents are detectable and diagnosable from observability tooling without requiring direct host access
- SHOULD automate rollback to the previous stable release so that a failed deployment can be reversed within the agreed recovery time objective without manual reconstruction
- SHOULD enforce branch protection rules on the default branch so that direct commits bypass automated checks only via an approved exception process
- MAY deploy to production on demand rather than on a fixed schedule, provided each deployment passes all pipeline gates and produces a deployment record traceable to the originating commit

## Out of Scope for this standard

- Infrastructure provisioning — that is governed by the infrastructure discipline standard
- Specific [FILL IN: CI/CD platform] — any platform that produces auditable deployment records and enforces test gates satisfies this standard
- Observability tooling selection — any tool that produces structured, queryable signals satisfies this standard
