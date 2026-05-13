# DoR Contract: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Approved at:** 2026-04-28

---

## What will be built

A self-recording instruction block added to `copilot-instructions.md` (≤60 words, imperative wording) directing the agent to write to `workspace/capture-log.md` automatically when a non-trivial event occurs — without operator prompting. The instruction specifies that entries use `source: agent-auto`, follow the 5-field schema from ilc.1, and are scoped to signal-worthy events only (decisions, validated/invalidated assumptions, patterns, gaps). Routine work with no notable events produces zero agent-auto entries — this is acceptable.

A capture-reminder callout (≤30 words each) added to 8 SKILL.md files — one to each of: `/checkpoint`, `/definition`, `/review`, `/test-plan`, `/definition-of-ready`, `/tdd`, `/systematic-debugging`, `/implementation-review`. Each callout references `workspace/capture-log.md` and identifies the skill's signal point.

## What will NOT be built

- The `/capture` operator command — that is ilc.1, which must be merged first.
- Promotion of entries to `workspace/learnings.md` — that is ilc.3.
- Capture reminders in any SKILL.md not in the named 8.
- Any script, parser, or npm package — instruction text only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1: self-recording instruction present | Unit test reads `copilot-instructions.md`, asserts block with `workspace/capture-log.md` and `agent-auto` present | Unit |
| AC2: SKILL.md reminders present | 8 unit tests — one per SKILL.md — assert `workspace/capture-log.md` present in each | Unit |
| AC3: agent-auto entries use 5-field schema | Unit test reads instruction text, asserts all 5 field names + `source: agent-auto` specified | Unit |
| AC4: agent doesn't fabricate in routine sessions | Manual-only (Untestable-by-nature) — post-merge live session check with no signal-worthy events | Manual |
| AC5: all 8 named SKILLs contain reminder | 8 unit tests (same as AC2) confirm each skill file has the callout | Unit |

## Assumptions

- The target section in `copilot-instructions.md` for the self-recording rule is the "During a session" conventions block. Exact insertion point resolved at implementation.
- All 8 SKILL.md files exist at `.github/skills/[name]/SKILL.md`.
- ilc.1 has been merged and `workspace/capture-log.md` schema is defined.

## Estimated touch points

**Files:** `copilot-instructions.md`, `.github/skills/checkpoint/SKILL.md`, `.github/skills/definition/SKILL.md`, `.github/skills/review/SKILL.md`, `.github/skills/test-plan/SKILL.md`, `.github/skills/definition-of-ready/SKILL.md`, `.github/skills/tdd/SKILL.md`, `.github/skills/systematic-debugging/SKILL.md`, `.github/skills/implementation-review/SKILL.md`
**Services:** None
**APIs:** None
