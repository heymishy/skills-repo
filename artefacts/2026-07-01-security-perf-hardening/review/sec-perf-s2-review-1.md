# Review Report: Re-validate admin role on every gated request so a mid-session demotion takes effect immediately — Run 1

**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Date:** 2026-07-14
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS (1 MEDIUM, resolved below)

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — the story's Architecture Constraints section documents a deliberate deviation from CLAUDE.md's D37 rule ("Stub defaults MUST throw"): `setGetCurrentRole`'s default, when unwired, falls back to trusting the cached `req.session.role` rather than throwing. This is well-precedented in this codebase (`user-roles.js`'s `getRoleForTenant`, `tir-s9`'s optional-parameter default) and is necessary to avoid modifying three unrelated stories' existing test suites. Per CLAUDE.md, "any feature that makes an architectural decision... must have a `decisions.md` artefact... Create the file at discovery approval time; append entries as decisions are made during delivery" — this feature (short-track, no discovery) has no `decisions.md` yet. **Resolution:** `decisions.md` created at `artefacts/2026-07-01-security-perf-hardening/decisions.md` with this decision logged (title, date, context, decision, rationale) before DoR sign-off. See that file for the entry.

---

## LOW findings — note for retrospective

- **[1-L1]** Category B (Scope) — this story is a fix-forward for a real gap found by direct code reading, not by user report, mirroring the `team-identity-roles` epic's `tir-s7`/`tir-s8`/`tir-s9` pattern of filing found-not-reported security gaps as their own bounded stories rather than folding them into unrelated work. Worth a retrospective note: this is now a recurring, healthy pattern across two different features (`team-identity-roles`, `security-perf-hardening`) and may be worth naming explicitly as a house style in a future `/improve` pass.

---

## Summary

0 HIGH, 1 MEDIUM (resolved via decisions.md), 1 LOW.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 4 | PASS |

**Traceability (4):** No named benefit-metric exists (short-track feature, discovery/benefit-metric skipped by design per CLAUDE.md); the story instead links to the sibling `sec-perf` story's stated security-hardening goal, which is honest but one step more indirect than a named Metric 1/2 reference — hence 4 not 5. This is a structural property of the short-track pipeline, not a defect in this story.
**Scope integrity (5):** Explicitly excludes `credits-guard.js`'s structurally identical stale-role bypass (flagged as a follow-up, not silently expanded into), session-invalidation as an alternative approach (explicitly named and explained why not chosen), and any change to the `team_memberships` write path. Boundaries are precise and each exclusion is justified, not just listed.
**AC quality (5):** 6 ACs, all Given/When/Then, independently testable. AC3/AC4 explicitly test both directions of the live check (promotion as well as demotion) and both wired/unwired adapter states — a materially stronger bar than "demotion is denied" alone, closing the same kind of one-directional-test gap CLAUDE.md's D37 rule was written to prevent.
**Completeness (5):** All template fields populated; NFR section names the specific added DB query and its trade-off rather than a generic "may be slower" statement.
**Architecture compliance (4):** Correctly reuses the existing `getRoleForTenant` adapter as the single source of truth for role resolution, avoiding a second parallel code path. Scored 4 rather than 5 solely because of the D37 default-fallback deviation (1-M1) — a defensible, precedented choice, but still a deviation from the letter of the written rule, and is logged as a decision rather than silently justified in prose alone.

**Verdict:** PASS — no HIGH findings; 1 MEDIUM resolved via `decisions.md`; ready for `/definition-of-ready`.
