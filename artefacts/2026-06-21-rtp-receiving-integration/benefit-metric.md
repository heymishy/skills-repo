# Benefit Metric: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Active (mock — EXP-008 S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-06-21
**Skill version:** /benefit-metric

---

## Outcome statement

Enable the enterprise to receive real-time inbound payments on the Payments NZ scheme and credit customer accounts within the 10-second acknowledgement window, meeting the 2026-09-01 go-live obligation and eliminating the $50,000/day contractual penalty risk.

---

## Primary metrics

| Metric | Baseline | Target | Measurement method |
|--------|---------|--------|-------------------|
| Scheme go-live status | Not live | Live as receiving participant by 2026-09-01 | Binary — Payments NZ scheme admission reference received |
| End-to-end P99 latency (pacs.008 receipt → pacs.004 send) | N/A (batch only) | ≤ 10 seconds at 40,000 tph | Load test at peak volume (Story 3.2, T-E2E-001) |
| AML screening P99 latency at peak | 8s at 10,000 tph | ≤ 6s at 40,000 tph | AML load test (T-AML-LOAD) |
| Daily reconciliation success rate | N/A (batch only) | 100% with zero unresolved discrepancies within settlement window | Daily reconciliation report |
| Scheme certification completion | 31 of 47 items | 47 of 47 items confirmed; scheme admission granted | Payments NZ certification reference |

---

## Guardrail metrics

| Guardrail | Threshold | Action if breached |
|-----------|----------|-------------------|
| AML false positive rate | < 0.5% of payments held | Escalate to Financial Crime Compliance; do not adjust thresholds without sign-off |
| Reconciliation exception rate | 0 per day | Immediate escalation to payment operations; hold further crediting until resolved |
| Scheme acknowledgement timeout rate | < 0.001% of payments | Alert payment operations; investigate processing budget breach |

---

## Measurement activation

All primary metrics begin measurement from go-live date (2026-09-01). The AML load test metric (T-AML-LOAD) must be measured and confirmed before Story 2.2 implementation begins — this metric is active immediately from the spike.

Certification completion metric is active from day one of the project — Story 3.1 gap assessment must begin in week 1.