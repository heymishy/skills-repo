# Decision Log: 2026-04-30-reverse-engineer-reference-corpus

**Feature:** Reverse-engineer reference corpus outputs and companion skill
**Discovery reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/discovery.md`
**Last updated:** 2026-04-30

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

### DEC-001 — Canonical rule-id format for `constraint-index.md` and `corpus-state.md`

| Field | Value |
|-------|-------|
| **Date** | 2026-04-30 |
| **Category** | DESIGN |
| **Decided by** | Hamish (platform maintainer) — review finding 2-M1 resolution |
| **Decision** | The `rule-id` field in `constraint-index.md` (Output 10) and `corpus-state.md` (Output 8) must use the same identifier format: `<layer>-<sequence>` (e.g. `L1-001`, `L3-012`), where `<layer>` is the `/reverse-engineer` reading layer number (1–6) and `<sequence>` is a zero-padded 3-digit integer assigned in rule discovery order within that layer. |
| **Context** | Review finding 2-M1 raised that `constraint-index.md`'s `rule-id` column format was unspecified. rrc.4's AC3 depends on `corpus-state.md` rule IDs matching `constraint-index.md` entries — without a shared format, the two outputs can use inconsistent identifiers and `/reference-corpus-update` cannot reliably match changed files to known rules. |
| **Alternatives considered** | (1) Free-form descriptive IDs (e.g. `validateOrderTotal`) — rejected; not stable across passes, not machine-matchable. (2) UUID-based IDs — rejected; not human-readable, makes manual DoR authoring harder. (3) File-derived prefix (e.g. `OrderService-001`) — deferred; introduces coupling to source file names which change in refactors. |
| **Consequences** | rrc.1 (Output 9) `discovery-seed.md` references PARITY REQUIRED rules — those references must also use the `<layer>-<sequence>` format so a tech lead can cross-reference the constraint index from the discovery seed without ambiguity. The rrc.2, rrc.4 test plans must assert that the rule-id format matches this pattern. |
| **Revisit trigger** | If a real extraction cycle produces rule IDs that are hard to assign layer numbers to (e.g. cross-layer rules), revisit the format. |

---

### DEC-002 — rrc.3 dispatched only after rrc.1 + rrc.2 are merged

| Field | Value |
|-------|-------|
| **Date** | 2026-04-30 |
| **Category** | SLICE |
| **Decided by** | Copilot — review finding 3-H1 resolution |
| **Decision** | rrc.3 (`/discovery` integration) must not be dispatched to the coding agent until rrc.1 (Output 9 format) and rrc.2 (Output 10 format) have both been implemented and their PRs merged. A DoR hard block (H-DEP) has been added to the rrc.3 story artefact to enforce this sequencing gate. |
| **Context** | Review finding 3-H1 identified that the dependency was documented in prose but not enforced by any AC or DoR gate. A coding agent dispatched to implement rrc.3 without the upstream formats defined would produce an integration step with assumed or incorrect format references. |
| **Alternatives considered** | (1) Add an enforcing AC instead of a DoR block — rejected; an AC inside the story doesn't prevent premature dispatch, it only fails after the agent has already started. A DoR hard block prevents dispatch. (2) Bundle rrc.1 + rrc.2 + rrc.3 into one story — rejected; the stories have different SKILL.md targets (/reverse-engineer vs /discovery), different test assertions, and independent DoD evidence. |
| **Consequences** | rrc.1 and rrc.2 must be fully merged before rrc.3 enters /test-plan. The DoR for rrc.3 will fail H-DEP until both upstream PRs are merged. This is an intentional sequencing constraint, not a defect. |
| **Revisit trigger** | N/A — this is a one-time sequencing decision. Once rrc.1 and rrc.2 are merged, the gate is cleared. |
