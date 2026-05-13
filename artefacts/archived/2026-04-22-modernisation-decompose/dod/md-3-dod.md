# Definition of Done: Add ADR-015 (Two-Tier Artefact Scope Model) to `architecture-guardrails.md`

**PR:** https://github.com/heymishy/skills-repo/pull/181 | **Merged:** 2026-04-22
**Story:** artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
**Test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-3-test-plan.md
**DoR artefact:** artefacts/2026-04-22-modernisation-decompose/dor/md-3-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1.1–T1.3 confirm ADR-015 row present in Active ADRs table with correct title ("Two-tier artefact scope model: system corpus vs feature delivery") and status "Active" | automated — `check-md-3-adr.js` T1.1–T1.3 | **ADR number: story specified ADR-014; implementation used ADR-015** (see Scope Deviations below). Table row and content intent fully satisfied. |
| AC2 | ✅ | T2.1–T2.4 confirm full `### ADR-015:` write-up section present with Context, Decision, Consequences headings and `**Decided:** 2026-04-22` date | automated — `check-md-3-adr.js` T2.1–T2.4 | ADR number deviation as above |
| AC3 | ✅ | T3.1 confirms `**Decided:**` date present. Additionally, guardrails-registry YAML block updated with ADR-015 entry (mitigating review finding 1-M1 — registry gap risk is resolved) | automated — `check-md-3-adr.js` T3.1; registry entry confirmed by code review of merged PR | None for AC3 itself; registry not in original AC scope but implemented as part of the PR |

**Overall: 3/3 ACs satisfied. 9/9 automated tests pass.**

---

## Scope Deviations

**ADR number: specified ADR-014, implemented as ADR-015.**

The story title and all three ACs reference ADR-014. During implementation it was discovered that the ADR-014 slot in `architecture-guardrails.md` was already occupied by the Sidecar distribution ADR write-up. ADR-015 was used instead. The conceptual intent of the decision (formalising the two-tier system corpus vs. feature delivery artefact scope model) is unchanged. Tests were written to verify ADR-015, and the CHANGELOG records the deviation.

This deviation is non-blocking. The ADR content and its registration in the guardrails-registry YAML block are complete and correct. Future features' `guardrails[]` arrays will reference ADR-015.

**In-scope addition: guardrails-registry YAML block entry.** The story did not explicitly require updating the machine-readable guardrails-registry block, but the implementation added an ADR-015 entry. This directly mitigated review finding 1-M1 (the risk that future features would silently lack the ADR in their `guardrails[]`). The addition is aligned with the story's intent and is non-controversial.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 total
**Tests passing in CI:** 9 / 9

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1–T1.3 — Active ADRs table row present with correct fields | ✅ | ✅ | Tests check ADR-015 (adjusted from original plan which said ADR-014) |
| T2.1–T2.4 — Full write-up section content | ✅ | ✅ | As above |
| T3.1 — Decided date present | ✅ | ✅ | |
| T4.1 — npm test exits 0 (no regressions) | ✅ | ✅ | |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| ADR write-up must not reference future unbuilt capabilities | ✅ | Decision and Consequences sections describe the current two-tier model as-built; no forward commitments |
| guardrails-registry entry must use correct ADR ID | ✅ | YAML block uses `ADR-015` consistent with the table row and write-up |
| No regressions to existing ADR entries | ✅ | T4.1 confirms `npm test` exits 0 |

---

## Review Finding Status

Review `md-3-review-1.md` had 0 HIGH and 1 MEDIUM finding:

- **1-M1** (guardrails-registry YAML block gap — AC coverage did not require updating the registry): **Resolved in implementation.** The PR added an ADR-015 entry to the guardrails-registry YAML block even though it was not in the original ACs. The risk is mitigated. Future features will have ADR-015 seeded in their `guardrails[]` array. No follow-up required.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Decomposition consistency | ✅ Baseline 0% | Not yet — requires real programme usage | ADR-015 provides the governance basis; metric measured when the skill is used |
| M2 — Outer-loop entry rate | ✅ Baseline 0% | Not yet | As above |

---

## Outcome

**Definition of done: COMPLETE WITH DEVIATIONS ⚠️**

ACs satisfied: 3/3 (all content intent satisfied)
Deviations:
1. ADR-014 → ADR-015 (ADR-014 slot was pre-occupied; intent unchanged; non-blocking)
2. In-scope addition: guardrails-registry YAML block updated (mitigated review finding 1-M1; beneficial)

Both deviations are non-blocking. `releaseReady: true`.
