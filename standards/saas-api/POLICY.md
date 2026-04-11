---
title: SaaS-API Policy Floor
surface: saas-api
lastReviewedBy: TBD
lastReviewedDate: TBD
---

# SaaS-API Policy Floor

**Surface:** saas-api
**lastReviewedBy:** TBD
**lastReviewedDate:** TBD

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Governance Criteria

- MUST declare an API version (`api.version`) so that consumers can pin to a stable interface and breaking changes are detectable
- MUST configure an authentication scheme (`api.auth`) so that all endpoints require authentication and unauthenticated access is prevented
- MUST configure breaking-change detection (`api.breaking_change_detection`) so that API schema changes that break existing consumers are caught before deployment
- MUST reference contract tests (`api.contract_tests`) so that the API contract is verified against consumer expectations before each release

## Evidence Requirements

[TBD: Specify what evidence a squad must provide — e.g. OpenAPI spec version field, auth scheme declaration, breaking-change detection tool output attached to PR, contract test run results]

## Minimum Thresholds

[TBD: Specify minimum threshold values — e.g. version must follow semver, breaking changes require RISK-ACCEPT or rollback plan, contract tests must pass with zero failures before deployment]
