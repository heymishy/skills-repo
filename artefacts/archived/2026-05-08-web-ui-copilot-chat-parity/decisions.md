# Decisions — Web UI Copilot Chat Parity

**Feature:** 2026-05-08-web-ui-copilot-chat-parity
**Created:** 2026-05-09

---

## Running Decision Log

### Decision 1 — Slash command capability map: static object in router, not SKILL.md annotations
**Date:** 2026-05-09
**Context:** Discovery constraint prohibits modifying `.github/skills/` files. Skill capability classification (which skills require surface capabilities not available in the web UI, e.g. `git worktree`, `bash scripts/`) is needed for AC3 of wucp.2.
**Decision:** Maintain the capability map as a static configuration constant (`SLASH_CAPABILITY_MAP`) in the router implementation. The map is updated when new skills are added — standard maintenance task, not a schema change.
**Rationale:** The only alternative (SKILL.md annotations) is out of scope per discovery constraints. A static map is testable, auditable, and requires no skill file changes.

### Decision 2 — STAGE_INDEX: hardcoded lookup table, not dynamic derivation
**Date:** 2026-05-09
**Context:** AC4 of wucp.4 requires mapping stage names to numeric journey positions. Two options: derive from the journey sequence array at runtime, or hardcode a lookup table.
**Decision:** Hardcoded lookup table: `STAGE_INDEX = { discovery: 0, 'benefit-metric': 1, definition: 2, review: 3, 'test-plan': 4, 'definition-of-ready': 5, 'branch-setup': 6, 'implementation-plan': 7, 'subagent-execution': 8, 'verify-completion': 9, 'branch-complete': 10, 'definition-of-done': 11 }`. Must be exported for unit testing. Stage name not in map → fallback to stageIndex 0.
**Rationale:** Dynamic derivation introduces runtime ambiguity (what if the array is empty? what if a stage is temporarily removed?). The hardcoded map is easier to test, statically verifiable, and explicitly called out in AC4 as the required approach.

### Decision 3 — buildSystemPrompt() extended with sessionContext param (not an injectable adapter)
**Date:** 2026-05-09
**Context:** wucp.1 extends `buildSystemPrompt()` to accept `sessionContext = { activeFeatureSlug }`. No external I/O adapters are needed — all reads are `fs.readFileSync` on static known paths.
**Decision:** 5th parameter, optional object. Direct `fs.readFileSync` calls inside `buildSystemPrompt()`. D37 injectable adapter rule does not apply — no model call or external I/O adapter is introduced.
**Rationale:** The function reads fixed, static file paths known at design time. No injection point is needed. An adapter would add indirection with no testability benefit since the paths are not configurable.

---

## RISK-ACCEPTs

### RISK-ACCEPT wucp.1-W3-1-M2: AC5 phrasing is process-oriented
**Date:** 2026-05-09
**Finding:** Review finding 1-M2 — AC5 uses `"When this story is implemented"` as the trigger clause, which is process-oriented rather than a system-state condition.
**Risk:** Process-oriented ACs cannot be directly tested — a test cannot observe "the story is implemented". Risk of gap in automated coverage.
**Mitigation:** Test plan T1.16 operationally resolves this: asserts that `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` exists. This is a merge-blocking test that enforces the AC5 intent as an artefact-existence check. The process-orientation of the AC wording is a documentation quality issue, not a coverage gap.
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.2-W3-2-M1: AC2 embeds verification method
**Date:** 2026-05-09
**Finding:** Review finding 2-M1 — AC2 contains a parenthetical describing how to verify the dynamic skill discovery (adding a test directory and confirming the router returns it). Verification methods belong in the test plan.
**Risk:** Minor — AC is still testable; the parenthetical describes the correct test approach. Risk is cosmetic (AC purity), not functional.
**Mitigation:** Test plan T2.6 captures the dynamic discovery test correctly without the parenthetical. The parenthetical in AC2 is redundant and harmless.
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.2-W3-2-M2: AC3 embeds implementation count "44 skills"
**Date:** 2026-05-09
**Finding:** Review finding 2-M2 — AC3 includes "The 44 skills are classified at implementation time." This count is an implementation snapshot, not a system constraint. If the library grows, the count becomes stale.
**Risk:** Low — tests assert on capability notice behaviour (correct skill in map → capability notice included), not skill count. The SLASH_CAPABILITY_MAP classifies all skills at implementation time regardless of count.
**Mitigation:** Coding agent instructions note: the "44 skills" count in AC3 is informational only — implement SLASH_CAPABILITY_MAP for all skills present at implementation time; do not hard-code a count check.
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.2-W3-2-M3: Path injection guard in NFRs only (not Architecture Constraints)
**Date:** 2026-05-09
**Finding:** Review finding 2-M3 — the path injection guard for skill names is specified in NFRs but not Architecture Constraints. Security constraints that gate the primary operation should be in Architecture Constraints.
**Risk:** Low for implementation — guard is explicitly called out in NFRs and the test plan (T2.10/T2.11 assert HTTP 400). The DoR contract lists it as a required constraint.
**Mitigation:** DoR contract section "Required security constraints" explicitly lists the guard as mandatory. Coding agent instructions state: "MANDATORY security — implement before any other code."
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.4-W3-4-M1: benefit-metric.md coverage matrix missing wucp.4
**Date:** 2026-05-09
**Finding:** Review finding 4-M1 — benefit-metric.md Metric Coverage Matrix lists M3 and MM2 rows without wucp.4. wucp.4's Benefit Linkage claims to move both metrics.
**Risk:** Trace gap — `/trace` will flag wucp.4 as not contributing to M3/MM2 until the matrix is updated. Does not affect implementation correctness.
**Mitigation:** Update benefit-metric.md M3 and MM2 rows as a /definition-of-done action after the PR merges. The benefit-metric.md living document exception (pipeline instructions) covers this update.
**Action:** At /definition-of-done — add to M3 row: "wucp.4 (session start wizard — correct feature context selection, required for M3 dogfood cycle validity)". Add to MM2 row: "wucp.4 (session start wizard — eliminates manual slug entry, reducing friction in unassisted cycle)".
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.4-W3-4-M2: ADR-023 wrong reference in Architecture Constraints
**Date:** 2026-05-09
**Finding:** Review finding 4-M2 — Architecture Constraints references "ADR-023 path guard: Not applicable" but ADR-023 is the handoff schema ADR, not the path traversal guard.
**Risk:** Cosmetic — the intent (path traversal not applicable because slug comes from allowlist) is correct. The wrong ADR label could confuse a future reviewer.
**Mitigation:** DoR contract corrects the reference: "Path traversal guard (coding standard, copilot-instructions.md): Not applicable — slug is selected from allowlist, not from free-form input." Artefact fix deferred (cannot modify read-only artefacts).
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.

### RISK-ACCEPT wucp.4-W3-4-L1: AC4 embeds STAGE_INDEX implementation values
**Date:** 2026-05-09
**Finding:** Review finding 4-L1 — AC4 embeds the full STAGE_INDEX constant (12 entries with exact numeric values) inside the AC body.
**Risk:** If the journey sequence changes, the index numbers in AC4 become wrong and the AC fails even if the observable behaviour is correct. Low near-term risk — the journey sequence is stable and the hardcoded map is intentional.
**Mitigation:** The embedded values are intentional per the Complexity Rating ("the stage-name → stageIndex mapping is resolved by a hardcoded lookup table — see AC4"). Tests assert them directly. The values are the spec.
**Accepted by:** GitHub Copilot (automated DoR) — 2026-05-09. Operator acknowledged via "ok go" directive.
