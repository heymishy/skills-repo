# Review Report: Extended workforce-map modes — profile-match and net-new gap — Run 1

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.4.md
**Date:** 2026-05-26
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** [E — Architecture] — The Architecture Constraints section states: "Output appends to or merges with `workforce/initiative-map.json` produced by wfp.3." This language implies a file-level append or merge operation — as if wfp.3 writes the file first and wfp.4 opens it and appends. The Dependencies section (correctly) clarifies that both stories share the same `workforce-map` script entrypoint and produce a single file in a single invocation — there is no intermediate file state between them. The architectural constraint wording could mislead an implementer into writing a sequential read-then-append instead of an in-memory single-pass write. Suggested fix: replace the constraint with: "Writes all allocation modes (direct, profile-match, net-new) to `workforce/initiative-map.json` in a single invocation. The file is overwritten atomically; it is not appended to between invocations."

---

## Summary scores

| Category | Score (1–5) | Notes |
|---|---|---|
| A — Traceability | 5 | Epic, discovery, benefit-metric all linked. M3 and M2 both named. M3 mechanism — skill structurally enforces gap specificity — stated explicitly. |
| B — Scope | 5 | Auto-inference of tags, ranking, partial allocation, and gap closure recommendations all excluded. No scope creep. |
| C — AC quality | 5 | 5 ACs in Given/When/Then. AC1 cross-initiative clarification explicit (per-initiative exclusion only). AC2 no-match output fields defined. AC3 net-new entry format with hiringGap:true. AC4 FTE counting rule explicit. AC5 stdout gap report format. |
| D — Completeness | 4 | All sections present. Implementation note explicit about same-script approach — prevents implementer from creating a second command. NFRs cover performance and security. Complexity rated. Score not 5 because the "same script" note in Dependencies is load-bearing architectural guidance that arguably belongs in Architecture Constraints, not Dependencies. |
| E — Architecture | 4 | Tag-intersection-only stated. Portfolio read-only. No external deps. LOW-L1: "appends to or merges with" wording in Architecture Constraints could mislead. |

**Outcome:** PASS — 0 HIGH, 0 MEDIUM, 1 LOW. Proceed to /test-plan with LOW noted for cosmetic constraint wording fix before commit.
