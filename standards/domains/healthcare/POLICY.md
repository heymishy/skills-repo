---
title: Healthcare Domain Policy Floor
domain: healthcare
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Healthcare Domain Policy Floor

**Domain:** healthcare
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These floors are binary. A delivery either meets them or it does not. No discipline or squad override may relax these floors. These requirements extend the applicable discipline floors — they do not replace them.

## Overview

These binary floors define the minimum delivery bar for work in the healthcare domain. They address data-privacy, patient-safety, and clinical-integrity obligations specific to healthcare systems.

## Outcomes

- Patient data is protected from unauthorised disclosure so that individuals are not harmed by exposure of their health information.
- Clinical data is stored with sufficient integrity that care decisions based on system records are reliable.
- Access to patient data is auditable so that unauthorised access is detectable after the fact.

## Requirements

- MUST classify all patient-identifiable data and apply access controls that restrict read access to authorised clinical and administrative principals so that patient health information is not disclosed to unauthorised parties
- MUST record an audit log entry for every access to patient-identifiable data, including the accessing principal and the timestamp, so that unauthorised access is detectable after the fact
- MUST maintain clinical data records with immutable write semantics so that previously recorded clinical values cannot be silently overwritten, protecting the integrity of care decisions
- MUST obtain explicit informed consent records before collecting patient health information so that data collection is auditable and reversible at the patient's request

## Out of Scope for this standard

- Clinical decision-support methodology and medical protocol design
- Jurisdiction-specific healthcare regulatory interpretation
- Specific [FILL IN: clinical data platform] — any platform that supports immutable audit records and access controls satisfies this standard
