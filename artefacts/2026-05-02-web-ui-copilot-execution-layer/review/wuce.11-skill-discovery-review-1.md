# Review Report: SKILL.md discovery and skill routing — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.11-skill-discovery.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[11-M1]** [C — AC quality] — AC5 describes behaviour that belongs to the subprocess executor (wuce.9), not to the skill discovery module (wuce.11). The AC reads: "Given a skill name is passed to the subprocess executor (wuce.9) that does not appear in the list returned by `listAvailableSkills`, When the executor validates the name, Then it rejects the request before spawning any subprocess." The subject of the When/Then clause is the wuce.9 executor, not the wuce.11 discovery module. wuce.9 already owns this enforcement boundary in its AC5. A coding agent implementing wuce.11 may write tests that verify wuce.9's internal allowlist check, rather than testing wuce.11's own outputs — producing misplaced test coverage.
  Fix: Rewrite AC5 to test wuce.11's responsibility — the list it produces. For example: "Given a skill name is queried against the list returned by `listAvailableSkills`, When that name is not in the returned array, Then no entry matching that name exists in the list — confirming the discovery result is the sole allowlist source for the executor." The enforcement AC (executor rejects unknown names) belongs in wuce.9 and is already there.

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 4 | PASS | All references present. Benefit linkage explains both why the spike confirmed this pattern and why it is a necessary pre-condition for the guided UI in Epic 4. Score reflects M1 as internal feasibility metric. |
| B — Scope integrity | 5 | PASS | Out of scope precisely bounded: content parsing (presence-only check), hot-reload (restart acceptable), and skill metadata display (post-MVP). No discovery violations. |
| C — AC quality | 3 | PASS | AC1–AC4 test wuce.11's own behaviour well: directory scan, custom path env var override, draft-folder exclusion, empty-directory graceful handling. MEDIUM on AC5 — the When/Then clause describes wuce.9 executor behaviour rather than wuce.11 discovery output (11-M1). |
| D — Completeness | 5 | PASS | All template fields populated. Named persona (platform operator configuring the execution engine). NFRs cover security (allowlist enforcement, path traversal) and performance (200ms for 50 skills). Audit NFR at startup and session creation. Complexity 1 is appropriate — this is filesystem scanning with minimal branching. |
| E — Architecture | 5 | PASS | ADR-004 (configurable skills path via env var) and ADR-012 (adapter pattern for `listAvailableSkills`) both cited. Security constraint explicitly names the allowlist as the source of truth for wuce.9 subprocess invocation — correct architecture boundary. Path traversal mitigation via `[a-z0-9-]` allowlist on skill names is appropriate. |

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome: PASS** — Resolve 11-M1 before /test-plan: AC5 tests the wrong module. The fix is a rewrite of AC5 to test what wuce.11 produces (the list itself) rather than what wuce.9 does with it (enforcement). The enforcement behaviour is already covered in wuce.9 AC5.
