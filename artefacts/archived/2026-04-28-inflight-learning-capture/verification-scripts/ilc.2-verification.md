# AC Verification Script: Weave agent self-recording instruction into `copilot-instructions.md` and key SKILL.md files

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.2.md
**Technical test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.2-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the repository in your editor or file explorer.
2. Locate `copilot-instructions.md` in the repository root.
3. Locate `.github/skills/` — this folder contains all skill subdirectories.
4. No tools needed beyond a file viewer and text search.

**Reset between scenarios:** Each scenario reads files independently — no reset needed.

---

## Scenarios

---

### Scenario 1: `copilot-instructions.md` contains the agent self-recording rule

**Covers:** AC1

**Steps:**
1. Open `copilot-instructions.md`.
2. Search (Ctrl+F) for `workspace/capture-log.md`.
3. Find the instruction block that tells the agent to write entries automatically.

**Expected outcome:**
> You find an instruction block that directs the agent to write to `workspace/capture-log.md` without waiting for the operator to invoke `/capture`. The instruction uses direct, imperative wording — something like "Write to `workspace/capture-log.md`" or "Append an entry to `workspace/capture-log.md`". It does not say "consider writing" or "you may want to".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The self-recording rule targets non-trivial events only

**Covers:** AC4 (automated portion) + guidance on expected scope

**Steps:**
1. In the self-recording instruction block in `copilot-instructions.md`, read the full text.
2. Check whether it scopes capture to specific event types rather than every step.

**Expected outcome:**
> The instruction specifies that the agent should capture entries for significant events — such as decisions, validated or invalidated assumptions, discovered patterns, or identified gaps. It does not say "write an entry after every skill step" or "capture all activity". The implication is that a routine session with no notable events would produce zero agent-auto entries — and that is acceptable.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The self-recording rule is concise (≤60 words)

**Covers:** AC1 NFR — Instruction hygiene

**Steps:**
1. Find the self-recording instruction block in `copilot-instructions.md`.
2. Count the words in that block (approximate is fine — check it is not a lengthy paragraph).

**Expected outcome:**
> The self-recording instruction is brief — at most 60 words. It does not expand into a lengthy explanation or include inline examples. It reads like a one- or two-sentence directive.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: All 8 SKILL.md files contain a capture reminder

**Covers:** AC2, AC5

**Steps:**
1. Open each of these files in turn and search for `workspace/capture-log.md`:
   - `.github/skills/checkpoint/SKILL.md`
   - `.github/skills/definition/SKILL.md`
   - `.github/skills/review/SKILL.md`
   - `.github/skills/test-plan/SKILL.md`
   - `.github/skills/definition-of-ready/SKILL.md`
   - `.github/skills/tdd/SKILL.md`
   - `.github/skills/systematic-debugging/SKILL.md`
   - `.github/skills/implementation-review/SKILL.md`
2. For each file, confirm the reminder is visible — not buried in a comment or hidden section.

**Expected outcome:**
> All 8 files contain a visible capture reminder that references `workspace/capture-log.md`. Each reminder identifies when to write an entry — for example, "At the end of this step, if you identified a decision or pattern, write to `workspace/capture-log.md`." The reminder also mentions the 6 signal types or links to the main instruction in `copilot-instructions.md`.

**Result (check each):**
- [ ] /checkpoint  [ ] Pass  [ ] Fail
- [ ] /definition  [ ] Pass  [ ] Fail
- [ ] /review  [ ] Pass  [ ] Fail
- [ ] /test-plan  [ ] Pass  [ ] Fail
- [ ] /definition-of-ready  [ ] Pass  [ ] Fail
- [ ] /tdd  [ ] Pass  [ ] Fail
- [ ] /systematic-debugging  [ ] Pass  [ ] Fail
- [ ] /implementation-review  [ ] Pass  [ ] Fail

**Notes:**

---

### Scenario 5: Each SKILL.md reminder is concise (≤30 words)

**Covers:** AC2 NFR — Instruction hygiene

**Steps:**
1. In each of the 8 SKILL.md files, find the capture reminder section.
2. Count the words in the reminder (approximate is fine — check it is one or two sentences, not a paragraph).

**Expected outcome:**
> Each capture reminder callout is brief — at most 30 words. It does not duplicate the full schema explanation or expand beyond its purpose (reminding the agent to write at this skill's signal point).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6 (Manual gap — post-merge): Agent writes an entry during a session without prompting

**Covers:** AC1, AC4 — manual scenario (untestable by automation alone)

**Steps:**
1. Start a new pipeline session and run any of the 8 covered skills (e.g. run `/review` for a story).
2. At a point where a significant decision is made or an assumption is validated, do not invoke `/capture` manually.
3. After the skill completes, open `workspace/capture-log.md`.

**Expected outcome:**
> `workspace/capture-log.md` contains at least one entry with `source: agent-auto`. The entry has a plausible `signal-type` (e.g. `decision` or `learning`) and a readable `signal-text` that reflects something that actually happened in the session. The file was not empty at session end despite no `/capture` invocation from the operator.

> If no significant event occurred during the session (routine work only), the file may contain zero agent-auto entries — this is also a PASS. The agent should not have fabricated entries.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
