---
title: Regulatory Compliance Core Standards
discipline: regulatory
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-11
---

# Regulatory Compliance Core Standards

**Discipline:** regulatory
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-11

These standards define the universal baselines for regulatory compliance delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Overview

Regulatory standards govern how teams identify, implement, and evidence compliance obligations arising from applicable laws, regulations, and contractual requirements. These standards apply to any delivery that is subject to an external regulatory or contractual compliance framework.

## Outcomes

- Applicable regulatory obligations are identified and mapped to delivery requirements before implementation begins, so that gaps are not discovered during audit.
- Compliance evidence is produced in a form that satisfies regulatory reviewers without requiring access to internal tooling or undocumented processes.
- Changes that affect regulatory posture are tracked and approved before they reach production.

## Requirements

- MUST identify and document all applicable regulatory obligations at the start of a delivery before implementation begins, so that compliance gaps are not discovered during post-delivery audit
- MUST produce compliance evidence for each mapped obligation in a form that an independent auditor can verify without access to squad-internal systems
- MUST obtain a change approval record before deploying any change that alters the compliance posture of a regulated system so that the change is auditable and reversible
- SHOULD map each regulatory obligation to at least one automated or manual control test so that compliance drift is detectable before audit
- SHOULD maintain a register of accepted derogations from regulatory requirements, each with an approval record and a review date, so that derogations do not remain open indefinitely
- MAY use compensating controls when a primary control cannot be implemented, provided the compensating control is documented and accepted by the named compliance reviewer

## Out of Scope for this standard

- Jurisdiction-specific regulatory interpretation — that is a domain-layer concern
- Legal advice on regulatory applicability — teams must obtain formal legal sign-off independently of this standard
- Specific [FILL IN: compliance management tooling] — any tool that produces auditable evidence records satisfies this standard
