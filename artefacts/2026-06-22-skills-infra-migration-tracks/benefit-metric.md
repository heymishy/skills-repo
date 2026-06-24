# Benefit Metric: Skills Infrastructure and Schema-Migration Pipeline Tracks

**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Date defined:** 2026-06-24
**Metric owner:** Hamish King (Platform Maintainer)
**Reviewers:** Hamish King

> **Attribution note:** Discovery artefact `Approved By` field absent (pre-i3.1 format). Operator: Hamish King. Attribution incomplete — revisit before DoR.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative both delivers user value (pipeline consumers can govern infra and migration changes within the same pipeline) and validates a platform extensibility hypothesis: the existing SKILL.md / gate-advance / chain-hash-trace model extends cleanly to non-code change types without architectural changes to STAGE_SEQUENCE or the journey data model.

---

## Tier 1: Product Metrics (Operator Value)

### M1: Infra track completion time

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time for a solo operator to complete `infra-definition` → `infra-review` → `infra-plan` for a typical non-trivial infra change (new service, config change, or secrets rotation) |
| **Baseline** | Not established — no infra track exists today. Measure on first 3 real uses after delivery. |
| **Target** | Under 30 minutes end-to-end |
| **Minimum validation signal** | Under 60 minutes (operator completes the track without abandoning or requiring external help) |
| **Measurement method** | Operator self-reports elapsed time in the `infra-plan` sign-off artefact; platform maintainer (Hamish King) reviews after 3 completed uses |
| **Feedback loop** | If first 3 uses average over 60 minutes, revisit artefact template length and checklist complexity before adding to DoR hard-block enforcement |

### M2: DoR gate enforcement correctness

| Field | Value |
|-------|-------|
| **What we measure** | % of stories flagged `hasInfraTrack: true` or `hasMigrationTrack: true` that are correctly hard-blocked at DoR when the required sign-off artefact (infra-plan or migration-review) is absent |
| **Baseline** | 0% — H-INF and H-MIG hard blocks do not exist today |
| **Target** | 100% — binary: the gate fires on every flagged story missing its artefact |
| **Minimum validation signal** | 100% (no partial credit — a gate that fires 9/10 times is a broken gate) |
| **Measurement method** | Automated — H-INF and H-MIG checks in `/definition-of-ready` skill checklist; verified by test suite assertions on delivery of inf.4 and mig.3 |
| **Feedback loop** | Any hard-block miss is a P0 defect — immediate fix before the H-INF/H-MIG blocks are considered released |

---

## Tier 2: Meta Metrics (Platform Extensibility Validation)

### MM1: Trace completeness for new artefact types

| Field | Value |
|-------|-------|
| **Hypothesis** | The existing `_writeTrace` + gate-map infrastructure (`src/enforcement/gate-map.js`) extends to infra-plan and migration-review sign-offs without architectural changes |
| **What we measure** | Whether `/trace` reports infra-plan and schema-migration-review artefacts as part of the audit chain for features that use those tracks — no gaps |
| **Baseline** | `/trace` currently emits 0 infra or migration trace events |
| **Target** | 100% of infra-plan sign-offs and migration-review sign-offs appear in the trace chain for their motivating feature |
| **Minimum signal** | At least one infra trace event and one migration trace event successfully emitted and read back by `/trace` on the first real feature using both tracks |
| **Measurement method** | Run `/trace` on first feature using both tracks after delivery; verify both artefact types appear in output; platform maintainer records result |

### MM2: No STAGE_SEQUENCE change required

| Field | Value |
|-------|-------|
| **Hypothesis** | Two new parallel tracks integrate without touching `STAGE_SEQUENCE` in `src/web-ui/modules/journey-store.js`, validating constraint C3 from discovery |
| **What we measure** | Whether `STAGE_SEQUENCE` length and content are identical before and after all 12 stories merge |
| **Baseline** | STAGE_SEQUENCE has 8 stages: ideate → discovery → benefit-metric → design → definition → review → test-plan → definition-of-ready |
| **Target** | STAGE_SEQUENCE length and content identical after delivery |
| **Minimum signal** | Same (binary pass/fail — no partial credit for "mostly unchanged") |
| **Measurement method** | `git diff` on `journey-store.js` STAGE_SEQUENCE after all inf.* and mig.* stories merge — zero diff expected; recorded in final DoD artefact |

---

## Tier 3: Risk-Reduction Metrics

### T3-M1: Breaking migration rollback coverage

| Field | Value |
|-------|-------|
| **Obligation / risk** | Breaking schema migrations (rename, remove, type change, NOT NULL without default) carry data-loss and cascading-failure risk on rollback; currently no rollback plan is required before production deployment |
| **What we measure** | % of `schema-migration-plan` artefacts classified as *breaking* that include CI-tier rollback execution evidence before production sign-off |
| **Baseline** | 0% — no schema migration governance exists today |
| **Target** | 100% |
| **Minimum signal** | 100% (no acceptable partial coverage on breaking changes) |
| **Validated by** | `schema-migration-review` checklist item (breaking migration rollback evidence field); Hamish King sign-off on each migration-review artefact |
| **Sign-off required at DoR** | Yes — H-MIG hard block |

### T3-M2: Blast-radius declaration coverage

| Field | Value |
|-------|-------|
| **Obligation / risk** | Infra changes today are undeclared in terms of tier applicability; a change validated only on local dev is indistinguishable from one validated on staging — creating silent deployment risk |
| **What we measure** | % of `infra-definition` artefacts with a populated tier-applicability section (which tiers are affected and which have been validated) |
| **Baseline** | 0% — infra changes today have no required blast-radius or tier-applicability statement |
| **Target** | 100% — mandatory template field enforced by infra-review checklist and H-INF gate |
| **Minimum signal** | 100% (binary — the field is either present or absent) |
| **Validated by** | `infra-review` checklist (tier-applicability coherence check) + H-INF hard block at DoR |
| **Sign-off required at DoR** | Yes — H-INF hard block |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Infra track completion time | inf.1, inf.2, inf.3 | ✅ Covered |
| M2 — DoR gate enforcement correctness | inf.4, mig.3 | ✅ Covered |
| MM1 — Trace completeness | inf.5, mig.4 | ✅ Covered |
| MM2 — No STAGE_SEQUENCE change | shr.1, shr.2 (and all stories — none touch STAGE_SEQUENCE) | ✅ Covered |
| T3-M1 — Breaking migration rollback coverage | mig.1, mig.2 | ✅ Covered |
| T3-M2 — Blast-radius declaration coverage | inf.1, inf.2 | ✅ Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
