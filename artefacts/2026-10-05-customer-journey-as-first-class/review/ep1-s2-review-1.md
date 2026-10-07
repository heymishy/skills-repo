# Review Report: ep1-s2 — Run 1

**Story reference:** artefacts/[feature]/stories/ep1-s2.md
**Date:** 2026-10-07
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

**2-M1:** User story format: "I want to add stages via an '+ Add stage' control that inserts a new stage card at the end of the linear sequence with an inline name field" — the "I want" clause describes the mechanism (a specific control) rather than the capability. Per AC quality standards, the user story should express the desired outcome ("I want to add stages to a journey in sequence") and leave mechanism to ACs.

**2-M2:** AC3 (blank name → 400) does not specify what the inline field shows — "the inline field shows an error state" is vague. The test plan will need to infer what "error state" means. Medium: addressable without story rework.

---

## LOW findings — note for retrospective

**2-L1:** Out-of-scope section omits delete (ep1-s2 defines add/edit; delete is introduced later). Delete is defined in the discovery/definition artefact as part of this epic's ep1-s2 story, but the story artefact's out-of-scope section doesn't name it explicitly. The definition doc says ep1-s2 includes "edit name, and delete stages" in its title but the story artefact ACs only cover add and edit-name. Either add delete ACs or explicitly call it out of scope.

---

## Summary

**Outcome:** PASS
