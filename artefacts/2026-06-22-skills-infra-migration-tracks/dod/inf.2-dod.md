# Definition of Done: Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale

**PR:** https://github.com/heymishy/skills-repo/pull/401 | **Merged:** 2026-06-25
**Story:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.2.md
**Test plan:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.2-test-plan.md
**DoR artefact:** artefacts/2026-06-22-skills-infra-migration-tracks/dor/inf.2-dor.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — DESTRUCTIVE severity level defined; review hard-blocks unless operator supplies explicit PROCEED acknowledgement | ✅ | Tests `skill-defines-destructive-severity` and `skill-requires-explicit-acknowledgement-for-destructive` pass; "DESTRUCTIVE" severity and explicit acknowledgement requirement present in SKILL.md | Automated test (12/12 passing) | None |
| AC2 — Production-before-CI tier ordering issue detected as ADVISORY finding (non-blocking) | ✅ | Tests `skill-defines-tier-coherence-check` and `skill-classifies-out-of-order-tiers-as-advisory` pass; tier coherence check described with ADVISORY severity for ordering findings | Automated test | None |
| AC3 — Secret pattern in plan/preview attachment raises REVERSIBLE-HIGH finding | ✅ | Tests `skill-defines-reversible-high-severity` and `skill-checks-for-secret-patterns-in-attachment` pass; REVERSIBLE-HIGH severity defined and secret pattern check described in review checklist | Automated test | None |
| AC4 — Zero unacknowledged findings → PASS artefact saved at `artefacts/[feature]/infra/[story-id]-infra-review.md` | ✅ | Tests `skill-specifies-pass-artefact-path` and `skill-requires-status-pass-on-zero-findings` pass | Automated test | None |
| AC5 — Unacknowledged DESTRUCTIVE finding blocks sign-off and PASS artefact cannot be produced | ✅ | Tests `skill-requires-explicit-acknowledgement-for-destructive` and `skill-blocks-sign-off-with-unacknowledged-destructive` pass | Automated test | None |

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing in CI:** 12 / 12

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| infra-review-skill-file-exists | ✅ | ✅ | |
| skill-defines-destructive-severity | ✅ | ✅ | |
| skill-requires-explicit-acknowledgement-for-destructive | ✅ | ✅ | |
| skill-defines-tier-coherence-check | ✅ | ✅ | |
| skill-classifies-out-of-order-tiers-as-advisory | ✅ | ✅ | |
| skill-defines-reversible-high-severity | ✅ | ✅ | |
| skill-checks-for-secret-patterns-in-attachment | ✅ | ✅ | |
| skill-specifies-pass-artefact-path | ✅ | ✅ | |
| skill-requires-status-pass-on-zero-findings | ✅ | ✅ | |
| skill-blocks-sign-off-with-unacknowledged-destructive | ✅ | ✅ | |
| skill-no-tool-cli-references-in-checklist | ✅ | ✅ | ADR-004 compliance |
| review-checklist-includes-mandatory-secrets-check (NFR) | ✅ | ✅ | Mandatory secrets check in review checklist |

**Test gaps:** 1 — AI instruction-text runtime verification. Tests confirm required instruction text and severity scale are present in SKILL.md; they cannot verify AI model enforcement output without a live session. Accepted by design.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — review checklist includes mandatory secrets/credentials check | ✅ | NFR test `review-checklist-includes-mandatory-secrets-check` passes; mandatory secrets check confirmed in review checklist (not optional or advisory-only) |

---

## Metric Signal

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|---------------|
| M1 — Infra track completion time (under 30 minutes end-to-end) | not-yet-measured | `infra-review` skill delivered and verified by test suite. Measurement requires 3 real operator sessions completing the full infra track. No real sessions have run yet. | null |
| T3-M2 — Blast-radius declaration coverage (100% of infra-definition artefacts with populated tier-applicability section) | not-yet-measured | `infra-review` SKILL.md includes tier-coherence check that validates the tier-applicability section (tests verify). No real infra-review sessions have run yet. | null |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: 1 (AI runtime — accepted by design)
