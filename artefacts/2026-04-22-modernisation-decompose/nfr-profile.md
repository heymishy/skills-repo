# NFR Profile: modernisation-decompose

**Feature:** 2026-04-22-modernisation-decompose
**Slicing strategy:** Risk-first
**Produced by:** /definition — 2026-04-22

---

## NFR Assessment

### Security

| Constraint | Story | Detail |
|-----------|-------|--------|
| `corpus-state.md` must not contain raw business rules, customer data references, or regulatory clause text from the source system | md-1 | The file records metrics only: counts, ratios, timestamps. No system data. Verified by AC4 on md-1. |
| No credentials or personal data in any committed artefact | All | Enforced by repo-level mandatory constraint in architecture-guardrails.md. |

**Data classification:**
- [x] Public — no PII, no sensitive data
- [ ] Internal — non-public but low sensitivity
- [ ] Confidential — PII or commercially sensitive
- [ ] Restricted — regulated data (PCI, PHI, etc.)

**Rationale:** The feature produces only SKILL.md instruction files, ADR documentation, and governance script changes. The `corpus-state.md` file written at runtime records metrics only (counts, ratios, timestamps) — no business rules, customer data, or regulated information. Classification: Public.

**Assessment:** 2 active security constraints. Both are addressed by story-level ACs and existing repo mandatory constraints. No additional security controls required.

### Performance

**Assessment:** Not applicable — this is a Markdown-only skill file and a documentation change. No runtime performance constraints.

### Accessibility

**Assessment:** Not applicable — no UI changes in this feature. The convergence fields written to corpus-state.md are consumed by the pipeline visualiser in post-MVP work; accessibility constraints for that rendering are out of scope for this feature.

### Consistency / Determinism

| Constraint | Story | Detail |
|-----------|-------|--------|
| Decomposition heuristics must be deterministic given the same inputs (same signal priorities, same tie-breaking rules, same fallback order) | md-1 | Stated as NFR in md-1. Non-deterministic outputs break M1. |

**Assessment:** 1 consistency constraint. Addressed in md-1 NFR section.

### Audit

| Constraint | Story | Detail |
|-----------|-------|--------|
| `corpus-state.md` must record a `lastRunAt` timestamp on every write | md-1 | Specified in md-1 AC4. Enables teams to track convergence metric freshness. |
| ADR-014 write-up must include a `Decided:` date field | md-3 | Stated as NFR in md-3. |

**Assessment:** 2 audit constraints. Both addressed by story-level ACs.

### Governance / Pipeline Integration

| Constraint | Story | Detail |
|-----------|-------|--------|
| New SKILL.md must pass all structural contract checks in `check-skill-contracts.js` | md-1, md-2 | md-2 registers the contract markers; md-1 must produce a SKILL.md that satisfies them. Verified by md-2 AC1. |
| `npm test` must pass with 0 regressions after all changes | md-2, md-3 | Verified by md-2 AC3 and md-3 AC3. |
| No external npm dependencies in updated governance scripts | md-2 | md-2 NFR. Enforced by architecture-guardrails.md (pre-commit hook constraint). |

**Assessment:** 3 governance constraints. All addressed by story-level ACs.

---

## Complexity Summary

| Story | Complexity | Rationale |
|-------|-----------|-----------|
| md-1 | 3 | Novel domain — Java heuristic specification contains design decisions (signal priority, tie-breaking, escalation path) that require iteration. Scope stability: Unstable. |
| md-2 | 1 | Mechanical registry entry following an established pattern. Scope stability: Stable. |
| md-3 | 1 | Documentation append following established ADR format. Scope stability: Stable. |

**Overall feature complexity: 3/1/1** — the feature is dominated by md-1. The coding agent should treat md-1 as requiring human review at PR stage before proceeding to md-2.

---

## No NFRs Identified

N/A — NFRs are present (see above).
