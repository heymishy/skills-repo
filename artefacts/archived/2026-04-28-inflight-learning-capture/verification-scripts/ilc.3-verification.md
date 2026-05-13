# AC Verification Script: Update `/checkpoint` to bridge `capture-log.md` entries to `workspace/learnings.md`

**Story reference:** artefacts/2026-04-28-inflight-learning-capture/stories/ilc.3.md
**Technical test plan:** artefacts/2026-04-28-inflight-learning-capture/test-plans/ilc.3-test-plan.md
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the repository in your editor or file explorer.
2. Locate `copilot-instructions.md` in the repository root.
3. For post-merge scenarios (Scenarios 4–7): have a chat session open and a test `workspace/capture-log.md` prepared with 2–3 sample entries.

**Reset between scenarios:** For Scenarios 4–7, delete any test promotions from `workspace/learnings.md` after each scenario so the next scenario starts clean. The capture-log itself can remain.

**Sample capture-log entry for testing:**
```
## Capture entry

- date: 2026-04-28T10:00:00Z
- session-phase: test-plan
- signal-type: learning
- signal-text: The session boundary detection uses lastUpdated from state.json
- source: operator-manual
```

---

## Scenarios

---

### Scenario 1: `/checkpoint` section in `copilot-instructions.md` includes capture bridge steps

**Covers:** AC1 (instruction presence)

**Steps:**
1. Open `copilot-instructions.md`.
2. Find the `/checkpoint` convention block (search for "checkpoint").
3. Look for a section about reading `workspace/capture-log.md`.

**Expected outcome:**
> The checkpoint instruction block contains steps for the capture bridge. It tells the agent to check `workspace/capture-log.md` for new entries and report how many it found — for example: "3 new captures found in capture-log.md since last checkpoint." This step appears before (or alongside) the state-write step, not after it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The "no new captures" case is handled explicitly

**Covers:** AC4

**Steps:**
1. In the checkpoint bridge section of `copilot-instructions.md`, look for what the agent says when there are no new entries.

**Expected outcome:**
> The instruction specifies that the agent must report "No new captures to promote" (or equivalent) when no new entries exist. It does not say "skip silently" — the check always runs and always reports a result, even if that result is zero.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Missing `workspace/capture-log.md` is handled gracefully

**Covers:** AC4, AC5 — NFR Non-blocking

**Steps:**
1. In the checkpoint bridge section, look for what happens when `workspace/capture-log.md` does not exist.

**Expected outcome:**
> The instruction states that if `workspace/capture-log.md` is not found, the bridge step is skipped with a note — something like "capture-log.md not found — skipping capture review." The checkpoint then continues to its normal state-write. The agent does not error or stop.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4 (post-merge): `/checkpoint` finds and presents new captures

**Covers:** AC1, AC2

**Steps:**
1. Prepare `workspace/capture-log.md` with 2 sample entries (use the template above, varying the signal-type and signal-text).
2. In a chat session, run `/checkpoint`.
3. Observe the checkpoint output before the state-write step.

**Expected outcome:**
> The checkpoint reports the number of new entries found — e.g. "2 new captures found in capture-log.md since last checkpoint." It then presents each entry showing the `signal-type` and `signal-text` — for example:
>
> > Entry 1: [learning] "The session boundary detection uses lastUpdated from state.json"
> > Entry 2: [decision] "Chose append-only file over JSON for portability"
>
> It then asks which entries to promote — something like "Which entries do you want to promote to workspace/learnings.md? (all / 1,2 / skip)".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5 (post-merge): Promoting entries appends them to `workspace/learnings.md` with traceability fields

**Covers:** AC3

**Steps:**
1. Continuing from Scenario 4 — when `/checkpoint` asks which entries to promote, reply "all".
2. After checkpoint completes, open `workspace/learnings.md`.

**Expected outcome:**
> The promoted entries appear at the end of `workspace/learnings.md`. Each promoted entry includes:
> - The original `signal-text`
> - The original `date` (ISO 8601 timestamp)
> - The original `session-phase`
>
> The entries are appended — the rest of `workspace/learnings.md` is unchanged. The new entries appear under a heading that reflects the `signal-type` (e.g. under a "Learnings" or "Decisions" section).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6 (post-merge): Skipping promotion is non-blocking

**Covers:** AC5

**Steps:**
1. Prepare `workspace/capture-log.md` with 1 sample entry.
2. Start `/checkpoint`. When it asks which entries to promote, reply "skip" or "none".
3. Observe the checkpoint completion.

**Expected outcome:**
> The checkpoint continues to its normal state-write and closing message after the skip. It does not abort or warn. `workspace/learnings.md` is unchanged — no entries were added. `workspace/capture-log.md` is also unchanged — the entry was not deleted or marked as processed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7 (post-merge): Running `/checkpoint` twice without new captures produces no duplicates

**Covers:** AC5 — NFR Idempotent

**Steps:**
1. Run `/checkpoint` with 1 new capture entry and promote it (Scenario 5).
2. Without adding new entries to `workspace/capture-log.md`, run `/checkpoint` again.

**Expected outcome:**
> The second checkpoint run reports "No new captures to promote" or similar. It does not re-present the already-promoted entry. `workspace/learnings.md` is not modified — no duplicate entries are added. The second checkpoint completes normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**
