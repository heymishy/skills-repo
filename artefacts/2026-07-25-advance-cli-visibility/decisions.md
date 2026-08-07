## Decisions: `skills advance` loud story-creation warning (acv-s1)

### Decision: creation stays permitted; only observability changes

**Date:** 2026-07-25
**Context:** `cli-advance.js`'s story-lookup silently creates a new flat story record when no existing story matches the given `storyId`, printing a success message indistinguishable from a genuine update. This masked a real typo (`s2.1` vs the real slug `s2.1-shared-token-redesign`) across multiple kanban story branches in the same session, each of which silently wrote to a stray disconnected record instead of the intended one.
**Decision:** Do not block or gate creation behind a new flag. CLAUDE.md's own `cdg.6` rule already sanctions `advance` as the tool for "initial story creation," so a hard block would break a documented, legitimate workflow. Instead, track whether the resolved story was found vs newly created, and make the two outcomes visibly different: the found-case stdout/stderr shape is untouched (`Advanced: ...`, empty stderr); the created-case gets a distinct stdout prefix (`Created NEW story record: ...`) and a stderr warning naming the feature slug and the unmatched story id. `exitCode` stays `0` in both cases, since creation remains a valid, successful outcome.
**Rationale:** The actual gap was observability, not permission — the CLI gave zero signal about which of two very different things had just happened. Adding a required flag or blocking creation outright would have been a bigger, riskier change that contradicts an existing documented exception; a messaging-only fix closes the real gap with the smallest possible blast radius (verified via AC1's non-regression tests — the existing-story path is byte-identical to before).

### Decision: `cli-gate-advance.js` is out of scope

**Date:** 2026-07-25
**Context:** The story's Out of Scope section flagged checking whether `gate-advance` shares this exact silent-creation code path, in which case the same fix should extend there too.
**Decision:** Confirmed via grep that `cli-gate-advance.js` contains none of the silent-creation markers (`"Still not found"`, `feature.stories.push`, `story = { id: ...}`) — it does not share this code path. No changes made to `cli-gate-advance.js`.
**Rationale:** Avoids scope creep into a module with different validation semantics (gate-artefact checks) that wasn't implicated by the actual incident this story fixes.
