# Review: wucp.2 — Slash command router

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Story:** wucp.2
**Run:** 1
**Reviewer:** GitHub Copilot (automated review)
**Date:** 2026-05-10
**Status:** PASS — 0 HIGH, 3 MEDIUM, 1 LOW

---

## Category A — Traceability

**Score: 5 — PASS**

- Epic reference present ✓
- Discovery reference present ✓
- Benefit-metric reference present ✓
- "So that..." clause names M3 (outer loop completeness) ✓
- Benefit Linkage mechanism sentence present: slash command router closes Gap 2 by enabling on-demand skill invocation outside the journey sequence ✓
- M3 is present in the benefit-metric coverage matrix ✓

No findings.

---

## Category B — Scope Discipline

**Score: 5 — PASS**

- Story implements nothing declared out-of-scope in the epic ✓
- Story implements nothing declared out-of-scope in the discovery ✓ — discovery's MVP for Gap 2 exactly matches the story scope (dynamic SKILL.md loading via fs.readdirSync)
- Own Out of Scope section populated ✓ — capability annotation in SKILL.md files, fuzzy matching, multi-skill chaining, write operations all excluded
- No scope additions ✓

No findings.

---

## Category C — AC Quality

**Score: 3 — PASS**

AC1, AC4, AC5, AC6: Well-formed Given/When/Then, observable system behaviour, independently testable. ✓

**Finding 2-M1 (MEDIUM):** AC2 embeds a verification method inside the AC body in parentheses: `"(Verified by adding a test skill directory and confirming the router returns it in the available skills list.)"` An AC describes observable system behaviour, not how a tester verifies it. The parenthetical describes a test approach — it belongs in the test plan, not the AC.

Fix: remove the parenthetical from AC2. Carry the verification technique to the test plan as a test for dynamic skill discovery (e.g. "Given a temporary `.github/skills/test-probe/` directory exists, When the slash command router is queried for available skills, Then `test-probe` appears in the list").

**Finding 2-M2 (MEDIUM):** AC3 embeds an implementation scope count: `"The 44 skills are classified at implementation time."` The number 44 and the "at implementation time" instruction are implementation decisions, not observable outcomes. A test against AC3 as written will fail if the library grows to 45 skills — the count is an implementation snapshot, not a constraint on system behaviour.

Fix: remove `"The 44 skills are classified at implementation time."` from AC3. Move to Architecture Constraints: `"The capability map is a static constant in the router; all skills present in the library at implementation time are classified before dispatch. The count is not a system constraint — the map is updated when new skills are added."` Keep AC3's observable behaviour only: `"Given the operator invokes a skill that is surface-limited (e.g. /branch-setup, /subagent-execution), When the skill loads, Then the response includes a capability notice..."`.

---

## Category D — Completeness

**Score: 5 — PASS**

- User story in As/I want/So that ✓
- Named persona ("platform operator using the web UI") ✓
- Benefit Linkage populated with mechanism ✓
- Out of Scope populated ✓
- NFRs populated (performance: <50ms overhead; security: allowlist validation, HTTP 400) ✓
- Complexity rated (2 — some ambiguity) ✓
- Scope stability declared (Stable) ✓
- DoR Pre-check present ✓

No findings.

---

## Category E — Architecture Compliance

**Score: 3 — PASS**

- D37 (injectable adapter stub-throws): referenced for skill-loader adapter ✓
- Zero npm dependencies: constraint present ✓
- No SKILL.md modification: constraint present with justification (capability map static in router) ✓
- Journey stage coexistence: explicitly addressed — slash command turn only, resumes journey stage after ✓

**Finding 2-M3 (MEDIUM):** The path-injection guard for skill names derived from request input is specified only in the NFRs section. Security constraints that gate the story's primary operation (skill name from request → file read) are **architecture constraints**, not quality attributes. The NFR reads: `"Skill name from request input is validated against the fs.readdirSync allowlist before any file read — a skill name containing /, .., or path separators is rejected with HTTP 400."` This is a mandatory security requirement per the path traversal coding standard (`copilot-instructions.md`, sourced from ougl.5 AC11).

Fix: add to Architecture Constraints: `"Path injection guard (coding standard, copilot-instructions.md): skill name from request input is validated against the readdirSync allowlist before any file read. A skill name containing '/', '..', or path separators is rejected with HTTP 400. This guard is required — not optional — and must be present before any fs.readFileSync call. The NFR documents the response code; this constraint documents the mandatory requirement."` The NFR may remain for the performance/UX specification (HTTP 400 response).

**Finding 2-L1 (LOW):** ADR-022 (multi-skill journey orchestration is Option B — per-skill sessions with structured artefact handoff) is neither referenced nor declared N/A. The slash command router operates within an existing journey session and changes `buildSystemPrompt()` for a single turn — it does not create a new session or hand off artefacts to a new stage. ADR-022 is N/A here but should be declared to prevent a future reviewer from raising it as a gap.

Fix: add to Architecture Constraints: `"ADR-022 (multi-skill orchestration): N/A — slash command is a per-turn buildSystemPrompt() override within an existing session; no session boundary or artefact handoff is created."`

---

## Findings Summary

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| 2-M1 | MEDIUM | C | AC2 embeds verification method in the AC body — move to test plan. |
| 2-M2 | MEDIUM | C | AC3 embeds implementation count (44 skills) and timing decision — move to Architecture Constraints. |
| 2-M3 | MEDIUM | E | Path injection guard is in NFRs only; security constraints belong in Architecture Constraints. |
| 2-L1 | LOW | E | ADR-022 not referenced and not declared N/A. |

---

## Verdict

**PASS ✅**

0 HIGH findings. Story is clear to proceed to /test-plan.

Recommended fixes (should be applied before /definition-of-ready, not required before /test-plan):
- Fix 2-M1: remove verification note from AC2 — carry to test plan
- Fix 2-M2: remove implementation count from AC3 — move to Architecture Constraints
- Fix 2-M3: add path injection guard to Architecture Constraints (in addition to NFRs)
- Fix 2-L1: declare ADR-022 N/A in Architecture Constraints
