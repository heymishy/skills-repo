## Contract Proposal — Wire the human-narrated mode as an on-demand operator tool

**What will be built:**
A real, invokable tool (`skills/rubber-duck-review/SKILL.md`-style invocation, or an equivalent script under `scripts/` — coding agent's choice per the story's own Architecture Constraints, corrected 2026-08-09 to the real `skills/` path convention) that wraps Story 1's validated transcription+extraction pipeline as a repeatable capability: accepts a recording, runs the pipeline, presents findings with enough context to judge actionable/noise, and on explicit operator confirmation appends the chosen finding(s) to `workspace/capture-log.md` with a distinct `source` tag (e.g. `rubber-duck-review`).

**What will NOT be built:**
The agent-driven mode (Stories 3-4). Automatic logging without operator confirmation. The proactive suggestion nudge for eligible stories (Story 5).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test invoking the tool against a mocked Story 1 pipeline | Integration |
| AC2 | Unit test on finding-context sufficiency | Unit |
| AC3 | Unit test confirming no persistent write of raw recording/transcript | Unit |
| AC4 | Integration test confirming correct capture-log.md append + distinct source tag | Integration |

**Assumptions:**
- Story 1's extraction pipeline is available as an importable function/module by the time this story is implemented (per the Dependencies block: this story does not proceed until Story 1's AC3 signal is confirmed met).
- The "on-demand" invocation surface is a skill/script the operator runs directly, not a web-UI feature — consistent with this being an internal delivery-quality tool, not a customer-facing capability.

**Estimated touch points:**
Files: `skills/rubber-duck-review/SKILL.md` or an equivalent script (new), `tests/check-rdrc-s2-*.js` (new). Services: Story 1's extraction pipeline (internal import, not a new external call).

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. `rdrc-s2`'s own Architecture Constraints field was corrected during `/review` (finding 1-M1) to reference the real `skills/` path convention rather than `.github/skills/` — this contract uses the corrected path.
