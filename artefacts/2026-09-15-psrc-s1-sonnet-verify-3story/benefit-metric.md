# Benefit Metric: psrc-s1 Sonnet 4.6 Artefact Marker Verification

**Status:** Active
**Metric owner:** Hamish King
**Reviewers:** N/A (verification feature)

---

## Tier 1: Product metric

| Metric | Baseline | Target | Minimum signal | Feedback loop |
|--------|----------|--------|-----------------|----------------|
| Artefact marker fidelity (Sonnet 4.6) | N/A (new) | 100% correct emission across 3 stories | ≥90% correct marker placement | Manual verification of each story's output; compare actual marker positions against template expectations |

---

## Tier 3: Compliance / verification metric

| Obligation | Metric | Target | Validated by |
|------------|--------|--------|--------------|
| Model sweep experimental data integrity | Artefact markers present and valid in all Sonnet 4.6 runs (EXP-010 corpus T1-T5) | 100% | Manual inspection during this session |

---

## Notes

This is a throwaway verification feature used to confirm Sonnet 4.6 emits `---ARTEFACT-START---` / `