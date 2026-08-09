## Contract Proposal — Suggest rubber-duck review for eligible hero/customer-facing stories

**What will be built:**
A conditional suggestion line added to an existing skill's completion output (`/definition-of-done` or `/branch-complete` — coding agent's choice, consistent with either being a "natural checkpoint" per AC1), gated by an explicit, externally-editable eligibility rule (e.g. a documented constant or a `context.yml` entry), naming whichever rubber-duck-review mode(s) are available at the time (human-narrated only until Story 4 ships, both once it does).

**What will NOT be built:**
A mandatory gate — this is a nudge only, per discovery's explicit clarification. Tracking of the suggestion's real-world adoption effect (an ongoing measurement activity, not a build task).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on eligible-fixture completion output, including mode-naming correctness | Unit |
| AC2 | Unit test on non-eligible-fixture completion output | Unit |
| AC3 | Unit test confirming decline never blocks/degrades completion | Unit |
| AC4 | Unit test confirming the eligibility rule is externally editable | Unit |

**Assumptions:**
- Story 2 (the human-narrated tool) exists by the time this story is implemented (per the Dependencies block); Stories 3-4 may or may not exist yet — the suggestion's mode-naming logic must handle both cases correctly.

**Estimated touch points:**
Files: the chosen completion-output skill file (`skills/definition-of-done/SKILL.md` or `skills/branch-complete/SKILL.md`), a new eligibility-rule constant or `context.yml` entry, `tests/check-rdrc-s5-*.js` (new).

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. `rdrc-s5`'s own Architecture Constraints field was updated during `/review` (finding 1-M1) to explicitly note that this story modifies a governed SKILL.md file, subject to `CLAUDE.md`'s Platform change policy (PR review required) — this DoR's own artefact satisfies ADR-011's artefact-first prerequisite for that change.
