# Decision Log: 2026-07-18-gate-advance-validation

**Feature:** Extend gate-advance structural validation to all 7 canonical gate names
**Story reference:** artefacts/2026-07-18-gate-advance-validation/stories/gav-s1.md
**Last updated:** 2026-07-18

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |
| `SCOPE` | MVP scope added, removed, or deferred |

---

## Log entries

---
**2026-07-18 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct request (through `/improve`), following the same precedent established for `pcr-s1` and `stis-s1`.
**Alternatives considered:** Same two rejected alternatives as prior precedent (fabricating a discovery artefact; silently skipping without comment).
**Rationale:** Identical structural gap as `pcr-s1`/`stis-s1` — `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact always exists, false for short-track by design. This is now the third occurrence, further strengthening the case for the SKILL.md revision already recommended in `pcr-s1`'s decisions.md.
**Made by:** Claude (agent), via `/definition-of-ready`, 2026-07-18
**Revisit trigger:** Same as prior precedent — when `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV.
---
**2026-07-18 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the AC verification/test-plan criteria before implementation begins.
**Alternatives considered:** Block on a formal review pass before assigning to the coding agent (rejected — same rationale as prior short-track precedent).
**Rationale:** Bounded platform-infra fix with a fully-confirmed root cause (found during this session's own `/definition-of-done` and `/improve` runs). The operator directly requested this follow-up story, already briefed on the gap.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-18
**Revisit trigger:** If implementation deviates meaningfully from the DoR contract's estimated touch points, or if a real artefact fixture doesn't fit a proposed AC2-AC6 criterion, run a formal review before merging.
---
**2026-07-18 | SCOPE | discovery (informal, via /improve)**
**Decision:** This story's scope is all 6 missing gate names (discovery-approved, benefit-metric-active, definition-complete, test-plan-complete, branch-complete, definition-of-done) plus the definition-of-ready/dor-signed-off naming alias fix — not scoped down to just definition-of-done (the one gate that actually blocked this session's DoD run).
**Alternatives considered:** Scope to definition-of-done only, deferring the other 5 as separate follow-up stories (this was the initially recommended option).
**Rationale:** Operator's explicit choice, made when asked directly: cover all 6 at once rather than piecemeal, accepting the resulting Complexity Rating 3 / Scope-stability Unstable and the real design ambiguity that comes with it.
**Made by:** Hamish King (Founder/Operator), 2026-07-18
**Revisit trigger:** If implementation reveals the 6-gate scope is meaningfully larger or more ambiguous than estimated, split the remaining unimplemented gates into a separate follow-up story rather than let this one run indefinitely.
---

## Architecture Decision Records

None promoted to repo-level ADR status. If a future feature needs to extend `validate()` again for a new gate type beyond the current 7, consider whether the gate-check pattern established here (typed exit codes, artefact-read-then-structural-check) is worth promoting to `.github/architecture-guardrails.md` as a formal ADR.
