---
title: M365-Admin Policy Floor
surface: m365-admin
lastReviewedBy: TBD
lastReviewedDate: TBD
---

# M365-Admin Policy Floor

**Surface:** m365-admin
**lastReviewedBy:** TBD
**lastReviewedDate:** TBD

These floors are binary. A delivery either meets them or it does not. No domain or squad override may relax these floors.

## Governance Criteria

- MUST reference an admin audit log (`m365.audit_log`) so that all M365 admin changes are traceable and the audit trail is preserved
- MUST link a change ticket (`m365.change_ticket`) so that every M365 tenant configuration change is associated with an approved change record before it is applied
- MUST obtain admin approval (`m365.admin_approval`) so that M365 tenant configuration changes are reviewed and authorised by a designated admin approver before deployment

## Evidence Requirements

[TBD: Specify what evidence a squad must provide — e.g. audit log export reference, change ticket ID, admin approver name and approval timestamp]

## Minimum Thresholds

[TBD: Specify minimum threshold values — e.g. audit log must be retained for minimum 90 days, change ticket must be in approved state before changes are applied, admin approver must be different from the change author]
