# Decision Log: skill-categorization-reconciliation

**Feature:** Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap
**Track:** Short-track (per CLAUDE.md: `/test-plan → /definition-of-ready → coding agent`)
**Last updated:** 2026-08-07

---

## Decision categories

| Code | Meaning |
|------|---------|
| `GAP` | A structural gap in the skill/process itself, surfaced transparently rather than silently bypassed |
| `SLICE` | Decomposition and sequencing choices |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-07 | GAP | /definition-of-ready**
**Decision:** Proceed past H-GOV without a discovery artefact's `## Approved By` section, since short-track stories have no discovery artefact by design.
**Context:** Same structural gap already documented for `pcr-s1`/`stis-s1`/`tpac-s1`/`npwe-s1`/`emss-s1`.
**Rationale:** Satisfied via the operator's direct in-session instruction to scope and proceed.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** See prior entries' equivalent — same underlying process gap.
---

---
**2026-08-07 | SLICE | operator direction**
**Decision:** Combine the original "items 3" (dual skill-categorization lists) and "item 4" (NFR overhead shortfall) gaps into a single short-track story rather than two separate ones.
**Alternatives considered:** Two independent short-track stories, scoped and delivered separately.
**Rationale:** `rb-s5`'s own `decisions.md` RISK-ACCEPT explicitly named reconciling the categorization as a plausible path to also closing the NFR gap — the two problems share a root cause (the categorization duplication is part of why the assembly script's per-skill extraction logic wasn't already unified/cached), so fixing them together is more coherent than two isolated patches.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** None expected.
---

---
**2026-08-07 | RISK-ACCEPT | /definition-of-ready**
**Decision:** Proceed past DoR without the verification script being reviewed by a domain expert first (W4). Also acknowledges that AC4's timing re-measurement is environment-sensitive (Windows/Git-Bash specific) and may not generalise to other CI runner OSes without separate verification.
**Rationale:** Same rationale as every other story this session for W4; the environment-sensitivity is inherent to timing NFRs and matches `rb-s5`'s own measurement basis, not a new risk this story introduces.
**Made by:** Hamish King — Platform maintainer / Product owner
**Revisit trigger:** If the NFR passes on Windows/Git-Bash but a different CI runner OS shows a different result, treat as a pattern signal requiring cross-platform re-verification.
---
