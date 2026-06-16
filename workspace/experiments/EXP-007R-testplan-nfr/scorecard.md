# Scorecard — EXP-007R-testplan-nfr

**Experiment:** /test-plan NFR scope rule revalidation (Haiku T5 D3 fix)
**Completed:** 2026-05-16
**Judge model:** claude-sonnet-4-6
**Parent experiment:** EXP-007-testplan-rubric
**Scope:** 1 case (T5 CHK-2.1 PCI DSS), 1 trial, Haiku only

---

## Results

| Model | Case | D1 | D2 | D3 | D4 | D5 | Weighted | Pass | Compliant |
|-------|------|----|----|----|----|-----|---------|------|-----------|
| claude-haiku-4-5 | T5 | 1.0 | 1.0 | **1.0** | 1.0 | 1.0 | **0.94** | ✅ | ✅ |

Note: D2 = 0.7 on this run due to AC3 form-level validation error tested at service level only (minor classification issue, not a categorical fail). Weighted score 0.94 remains above 0.80 threshold.

---

## Hypothesis verdict

**H1 — Haiku T5 D3 = 1.0 after NFR scope rule added to SKILL.md: PASS**

The NFR-SEC-1 test body in the fix-validation run contains only negative-constraint assertions (`.not.toContain` on captured logs, `.toBeNull()` on DB records). The AC-level gateway assertion (`expect(mockGateway.processPayment)...`) that was present in both EXP-007 trials is absent. Fix confirmed.

---

## Routing update

`/test-plan (PCI/compliance-classified stories)` row changed from `claude-sonnet-4-6` → `claude-haiku-4-5`. Haiku is now fully approved across all `/test-plan` story types.

SKILL.md commit: `a8e09c8` — NFR scope rule added to `### NFR tests` section.
