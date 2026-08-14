# Review Report: PostHog instrumentation for both benefit metrics — Run 1

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Date:** 2026-08-15
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** D (Completeness) / A (Traceability) — The User Story's "I want" statement ("real, observable events for invite creation and acceptance") does not mention that this story also requires modifying `routes/team-management.js`/`modules/team-management.js` — an existing route from a DIFFERENT feature (`team-identity-roles`) — to add a comparison event (AC3). A reviewer or implementer reading only the User Story would not expect this story to touch a file outside this epic's own new code. The AC3 text itself is transparent about this ("real, required work in this story's own scope, touching a file outside the epic's other stories"), but the framing-level mismatch between the User Story and the actual scope is a completeness gap, not just a minor detail.
  Risk if proceeding: Low practical risk since AC3 itself is explicit and testable — but if a coding agent (or scope-guard check) triages work primarily off the User Story text rather than reading every AC in full, this cross-feature file touch could be missed or treated as out-of-scope creep rather than intended, planned work.
  To acknowledge: run /decisions, category RISK-ACCEPT — or revise the User Story's "I want" clause to mention the comparison event on the existing admin-add path.

- **[1-M2]** E (Architecture compliance) — The Architecture Constraints field lists only 2 bullets, neither of which explicitly acknowledges that this story modifies an existing file from a different, already-shipped feature (`team-identity-roles`'s `routes/team-management.js`/`modules/team-management.js`). Per ADR-011 (artefact-first), this is covered since the modification has a story artefact (this one) — but the Architecture Constraints field itself should name the cross-feature file touch explicitly, the same way `wsi-s1`'s own Architecture Constraints explicitly names every existing file/module it reuses or extends.
  Risk if proceeding: An implementer or reviewer scanning Architecture Constraints alone (without reading AC3 in full) would not know this story touches `team-identity-roles`' own code.
  To acknowledge: run /decisions, category RISK-ACCEPT — or add a bullet to Architecture Constraints naming this cross-feature touch explicitly.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Justification |
|-----------|-------|----------------|
| Traceability | 4 | Both metrics correctly cited with an honest, specific mechanism ("neither metric is measurable without this story"). Deduction for 1-M1 — the User Story text undersells the story's real, cross-feature scope. |
| Scope integrity | 5 | 2 explicit out-of-scope items, both specific; the cross-feature touch (AC3) is itself a deliberate, justified, self-flagged scope decision, not an unexplained violation — it moves this story's real necessary scope, it doesn't creep beyond it. |
| AC quality | 5 | 4 ACs, Given/When/Then, testable; AC3 in particular does real, non-trivial diligence (explicitly states it verified via direct file inspection that no such event currently exists, rather than assuming). |
| Completeness | 4 | All fields populated with real content — deduction for 1-M2, Architecture Constraints doesn't name the cross-feature file touch that AC3 requires. |

**Verdict:** PASS — all criteria scored 3 or above.

---

## Category E: Architecture compliance

- Architecture Constraints field populated: ✓ (populated, but see 1-M2 — incomplete relative to the story's actual scope)
- Implementation path doesn't violate a named approved pattern: ✓ — reuses the existing `_posthog.capture` pattern, no new analytics integration invented.
- No listed anti-pattern used: ✓
- Applicable repo-level ADRs referenced: ⚠️ ADR-011 (artefact-first) is satisfied in substance (this story artefact covers the `team-management.js` change) but is not explicitly named in Architecture Constraints — see 1-M2.
- Story NFRs align with mandatory constraints: ✓ — Security NFR correctly states no PII in event properties, matching existing PostHog event convention in this codebase.

1 Category E finding (1-M2, listed above).
