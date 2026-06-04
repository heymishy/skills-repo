# Review Report: Add ---ASSUMPTION-JSON--- marker emission instruction to ideate/SKILL.md — Run 1

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**Date:** 2026-06-04
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Traceability — Benefit linkage and "So that" clause name M1 and MM1 only, but the benefit-metric coverage matrix attributes M2 (Rework rate reduction) to this story. The M2 mechanism is real and causal: reliable marker emission from the SKILL.md means fewer assumptions are missed during the session, which reduces the invisible-assumption rework tracked by M2. Without this explanation, the traceability chain from iwu.6 to M2 is absent from the story artefact.
  Fix: Add "and M2 — Rework rate reduction" to the Metric moved line in the Benefit Linkage section, and add one mechanism sentence: reliable multi-turn marker emission means fewer assumptions are missed mid-session, reducing the invisible-assumption re-run cause that M2 measures.
  Risk if proceeding: /test-plan will not know to write M2 observability evidence for this story. If the DoD requires M2 signal from iwu.6, the evidence will be absent.
  To acknowledge: run /decisions, category RISK-ACCEPT.

---

## LOW findings — note for retrospective

None.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 1 MEDIUM, 0 LOW.

**Verdict:** PASS — all criteria scored 3 or above. The MEDIUM finding should be resolved before /test-plan so the M2 traceability chain is complete.

---

### Architecture compliance note — ADR-011 structural check

iwu.6 IS the artefact-first entry for the `.github/skills/ideate/SKILL.md` change. The story artefact satisfies the artefact-first requirement for a governed file. This is structurally correct — the review does not flag ADR-011 as a violation here; it confirms the rule is being followed.

The platform change policy constraint (PR required, no direct master commit) is stated in the Architecture Constraints field and must be enforced at DoR and in the delivery worktree. No finding — confirmation only.

---

### Category A: Traceability — notes

- Epic ref ✓ (iwu-skillmd-tuning.md — correct parent epic for governed file story)
- Discovery ref ✓
- Benefit-metric ref ✓
- "So that" names M1 and MM1 ✓
- Benefit linkage mechanism references Spike A2 evidence ✓ — this is a strong causal sentence
- Coverage matrix attributes M2 to iwu.6 — not named in story benefit linkage — MEDIUM finding 1-M1

### Category B: Scope integrity — notes

- Story modifies only `ideate/SKILL.md` and the `session.assumptionCardsEnabled` default in `src/web-ui/` ✓
- Out-of-scope section explicitly excludes other SKILL.md files, Cluster 3/5/6 tuning, and multi-session comparison ✓
- "Changes to `src/web-ui` server code — all server-side and browser-side changes are in iwu.2–iwu.5" — this exclusion is for the server/browser code changes that were already delivered; the feature flag default flip is a `src/web-ui` change but is scoped specifically by AC4 ✓ (no inconsistency — the out-of-scope row excludes new src/web-ui changes, the feature flag default is a single field change already specified by AC4)

### Category C: AC quality — notes

- 4 ACs, all in Given/When/Then format ✓
- AC1 specifies the exact marker format string — independently testable ✓
- AC2 specifies the emission rate threshold (≥70%) and the exact replication conditions (Spike A2, 12 assumptions in scope) — independently testable ✓
- AC3 is correctly labelled as a human-in-the-loop DoD entry condition; evidence path is specified; "if emission rate <70%, revise instruction and repeat" is an explicit retry condition ✓
- AC4 specifies the feature flag default state post-merge ✓

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona "platform operator (primary)" ✓
- Benefit linkage populated with Spike A2 evidence reference ✓
- Out of scope populated ✓
- NFRs: "None identified beyond DoD entry condition" — explicitly stated ✓ (SKILL.md is plain text, no runtime security surface)
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- ADR-011 (artefact-first rule) stated as Architecture Constraint and satisfied ✓
- Platform change policy (PR required) explicitly stated ✓
- ADR-018 marker protocol: exact format specified in AC1 ✓
- Feature flag semantics: `session.assumptionCardsEnabled` defaults false until this story merges (stated in Architecture Constraints) ✓
- Human-in-the-loop DoD gate is an approved delivery pattern for governed files — no guardrail violation ✓
- No anti-patterns ✓
