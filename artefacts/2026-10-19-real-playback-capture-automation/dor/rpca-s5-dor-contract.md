# DoR Contract — Playback capture triggers automatically when a feature reaches Definition of Done

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
**Date:** 2026-10-19

---

**What will be built:**
- `checkDodGate(state, featureSlug)` in `scripts/playback-capture.js` corrected to evaluate "every story across every epic in this feature has `dodStatus: 'complete'`" directly, instead of checking the unwritten top-level `feature.dodStatus` field. On failure, the thrown error names the specific incomplete story, not a generic message.
- `skills/definition-of-done/SKILL.md`'s own "Feature-completion trace check" section (the block that already checks "does every story across every epic in this story's own feature now show `dodStatus: 'complete'`?") extended: when that check passes, automatically run `/feature-playback`'s own Steps 1-3 (generate walkthrough, capture screenshots) for that feature — Step 4's own mandatory editorial-review gate is explicitly preserved, unchanged, still a human action.
- The same section extended with an explicit non-blocking failure path: if the automatic capture run fails for any reason, the story's own DoD verdict is computed and reported exactly as if the capture step didn't exist, and a named follow-up action (identifying the feature and the failure reason) is added to `pendingActions` in `workspace/state.json`.

**What will NOT be built:**
- Any change to `/feature-playback`'s own Step 4 (editorial review) — stays a mandatory human gate, unchanged.
- Any automation of staging wake-up or secret provisioning — if the secret isn't configured in the session running `/definition-of-done`, the non-blocking failure path above is what happens.
- Any change to `skills/feature-playback/SKILL.md` itself — AC5 is a regression check against what `rpca-s4` already shipped there, not a new modification.
- Retroactively running this for any already-DoD-complete feature.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test — fixture state with every story `dodStatus: "complete"`, no `feature.dodStatus` field set (and a second case: a stale/wrong `feature.dodStatus` field present) — asserts `checkDodGate` still returns `{ ok: true }` | unit (real function, fixture state) |
| AC2 | Unit test — fixture state with one story not `dodStatus: "complete"` — asserts the thrown error names that specific story | unit (real function, fixture state) |
| AC3 | Unit test reads the real `skills/definition-of-done/SKILL.md` content, asserts the Feature-completion trace check section now describes automatically invoking `/feature-playback`'s own Steps 1-3 | unit (real-file content assertion) |
| AC4 | Unit test reads the same real file, asserts the non-blocking-failure language (DoD verdict unaffected, named follow-up action recorded) | unit (real-file content assertion) |
| AC5 | Unit test reads the real `skills/feature-playback/SKILL.md` content, asserts its own `triggers` list and manual-invocation description are unchanged from what `rpca-s4` shipped | unit (real-file content assertion) |

**Assumptions:**
- All 5 ACs are fully automatable — no manual scenario, no real secret or network dependency, consistent with the review's own AC-quality scoring.
- `checkDodGate`'s own fix is a pure function-logic change; the SKILL.md changes are natural-language orchestration instructions, not executable code (CLAUDE.md's own "How skills are invoked" section) — this story remains documentation + one small code fix, not a new application feature.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — `checkDodGate` only)
- `skills/definition-of-done/SKILL.md` (modify — "Feature-completion trace check" section only)
- `tests/check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js` (new)

Services: None | APIs: None
