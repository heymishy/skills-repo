# Review Report: Wire pod-manager.html's member picker to the real roster — Run 1

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Date:** 2026-09-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** E — Architecture compliance. No AC or NFR requires the real identity string (from `rtri-s1`'s roster) to be rendered safely when displayed in the "Available"/"Your team" roster lists. This is not a hypothetical risk: this exact codebase shipped and had to fix a real, Critical stored-XSS vulnerability days ago (`ep4-s1`, commit `6adfb5b2`) from precisely this pattern — a DB-sourced identity string rendered via unescaped client-side string concatenation. `person_identities.identity_key` (GitHub login, Google email, or email/password email) is externally-influenced data, not a fixed literal — the same risk class applies here, and MC-SEC-01 ("No user-supplied content in innerHTML without sanitisation") is a mandatory constraint in `.github/architecture-guardrails.md`.
  Fix: add an explicit AC (or NFR) requiring the real identity string to be rendered via safe DOM construction (`createElement`/`textContent`, matching `ep4-s1`'s own now-fixed pattern) or equivalent server-side escaping — not raw string concatenation into HTML/innerHTML. This must be verified by a real test asserting on a payload identity string (e.g. containing `<`, `>`, `'`), not just a normal-looking one.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome:** FAIL

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 2 | FAIL |

**Traceability (5):** Clean — epic/discovery/benefit-metric referenced, benefit linkage names the real metric with a genuine mechanism.
**Scope integrity (5):** Nothing touches epic/discovery out-of-scope; 3 real exclusions named, including a well-reasoned deferral of the AC4 cross-story-verification risk to a scope-note escalation rather than silent expansion.
**AC quality (5):** All 5 ACs are Given/When/Then, independently testable, no vague language, edge cases (AC3 empty roster, AC4 cross-story verification, AC5 regression guard) each have their own AC.
**Completeness (5):** Every field populated; persona matches benefit-metric exactly; NFRs correctly reference `ep4-s1`'s own established comparable patterns rather than inventing new ones.
**Architecture compliance (2):** MC-SEC-01 (mandatory constraint) is not addressed by any AC or NFR, despite this exact codebase having shipped a real fix for exactly this vulnerability class in `ep4-s1` days before this story was written. Automatic FAIL per the scoring rule (any criterion below 3 fails the story) — see 1-H1.
