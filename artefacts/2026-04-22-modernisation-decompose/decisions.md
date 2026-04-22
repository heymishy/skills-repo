# Decision Log: modernisation-decompose

**Feature:** 2026-04-22-modernisation-decompose
**Discovery reference:** artefacts/2026-04-22-modernisation-decompose/discovery.md
**Last updated:** 2026-04-22

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-04-22 | RISK-ACCEPT | definition-of-ready (W3 — md-1 review finding 1-M1)**
**Decision:** Accept incomplete benefit linkage in story md-1 — M3 (outer-loop unassisted replication rate) and MM-B (replication rate meta-metric) are moved by ACs 5 and 6 respectively but are not listed in the story's Benefit Linkage field. Proceed without correcting the story artefact.
**Alternatives considered:** (1) Reopen the story, update the Benefit Linkage field to list all four metrics (M1, MM-A, M3, MM-B), re-run DoR. (2) Accept the gap and proceed.
**Rationale:** The test plan and ACs correctly capture the intended scope. The omission from the Benefit Linkage field is a documentation gap only — the coding agent has the full context from the ACs. Reopening the story would delay the inner loop with no implementation risk. The gap is visible in the review report and this decisions log for audit purposes.
**Made by:** Hamish — operator and platform maintainer, personal pipeline.
**Revisit trigger:** If a future /trace or /definition-of-done run raises the missing metrics as a chain gap, update the story artefact at that point.
---

---
**2026-04-22 | RISK-ACCEPT | definition-of-ready (W3 — md-1 review finding 1-M2)**
**Decision:** Accept ambiguous `umbrellaMetric: true` format specification in AC7 of story md-1. The DoR coding agent instructions explicitly require the SKILL.md implementation to make the format unambiguous (exact format must be stated: e.g. YAML front matter key, markdown table column, or labelled paragraph).
**Alternatives considered:** (1) Reopen the story, rewrite AC7 with explicit format specification. (2) Accept the ambiguity, resolve it in the implementation instructions.
**Rationale:** The ambiguity is at the documentation level (what format counts as a valid `umbrellaMetric` field). The DoR contract and coding agent instructions impose the resolution obligation on the implementer. The risk of an incorrect implementation is caught by the content-inspection unit test (T1.7) which will assert the field is present and explicit. Reopening the story introduces pipeline overhead without reducing implementation risk.
**Made by:** Hamish — operator and platform maintainer, personal pipeline.
**Revisit trigger:** If T1.7 fails during implementation because the format chosen by the coding agent is ambiguous, the story AC should be updated to add the explicit format before the next implementation attempt.
---

---
**2026-04-22 | RISK-ACCEPT | definition-of-ready (W3 — md-3 review finding 1-M1)**
**Decision:** Accept the AC coverage gap in story md-3 — no AC requires updating the `guardrails-registry` YAML block in `architecture-guardrails.md` alongside the ADR-014 table row and write-up. The YAML block update is deferred.
**Alternatives considered:** (1) Add a new AC to md-3 requiring the guardrails-registry YAML block update; re-run test-plan and DoR. (2) Create a follow-up story for the YAML block update. (3) Accept the gap and proceed with the existing 3 ACs.
**Rationale:** The `guardrails-registry` YAML block is a machine-readable index that supports tooling — its absence for ADR-014 does not break the ADR's human-readable intent or the npm test suite. The risk is that automated tooling consuming the YAML block will not see ADR-014 until a follow-up story addresses it. This is low-severity for a personal pipeline with no automated YAML block consumers in the current cycle. Reopening the story would delay the inner loop with no immediate functional impact.
**Made by:** Hamish — operator and platform maintainer, personal pipeline.
**Revisit trigger:** If automated tooling is added that consumes the guardrails-registry YAML block and ADR-014 is not visible to it, create a follow-up story to add the YAML block entry.
---

---
**2026-04-22 | SLICE | definition**
**Decision:** Sequence md-1 (SKILL.md) before md-2 (contracts) and md-3 (ADR). md-2 and md-3 unblock once md-1 is committed — they can be coded in parallel after that.
**Alternatives considered:** All three stories in parallel from the start.
**Rationale:** md-2 requires knowing the final structural markers in the SKILL.md to write accurate contract definitions. md-3 benefits from knowing the settled dual-scope model design from md-1. Parallel execution of md-2/md-3 before md-1 is committed would require speculative marker definitions that may need rework.
**Made by:** Hamish — operator and platform maintainer, personal pipeline.
**Revisit trigger:** No obvious trigger — sequencing is a one-time decomposition decision.
---

---

## Architecture Decision Records

<!-- No feature-level ADRs for this feature. The structural ADR (ADR-014) is written to .github/architecture-guardrails.md via story md-3, which is the governed path for repo-level ADRs. -->
