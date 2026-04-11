---
title: IaC (Infrastructure as Code) Policy Floor
surface: iac
lastReviewedBy: TBD
lastReviewedDate: TBD
---

# IaC (Infrastructure as Code) Policy Floor

**Surface:** iac
**lastReviewedBy:** TBD
**lastReviewedDate:** TBD

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Governance Criteria

- MUST configure a remote state backend (`iac.state_backend`) so that infrastructure state is never stored only on a local developer machine
- MUST declare version-pinned module references (`iac.module_version`) so that unreviewed upstream changes cannot enter the infrastructure undetected
- MUST configure a changeset review step (`iac.changeset_review`) so that infrastructure changes are reviewed before being applied to any environment
- MUST configure drift detection (`iac.drift_detection`) so that manual changes to infrastructure are surfaced and reconciled

## Evidence Requirements

[TBD: Specify what evidence a squad must provide to demonstrate each governance criterion is met — e.g. state backend URL, plan output attached to PR, drift detection schedule]

## Minimum Thresholds

[TBD: Specify minimum threshold values for each criterion — e.g. state backend must be remote (not local), module versions must be pinned (not floating ranges), drift detection must run at least weekly]
