## Contract Proposal — Stub the real git-commit adapter in the 13 remaining skill-turn test files

**What will be built:**
- 13 test files modified (`check-alrf-s8-journey-slug-priority.js`, `check-mfc1-model-first-chat-session.js`, `check-res-s3-suggest-revision-materiality.js`, `check-defs-revs-s1-wiring-into-turn-completion.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `check-wsap-s3-multi-story-commit-and-no-review-rerun.js`, `check-wsap-s1-story-scoped-artefact-paths.js`, `check-rsc-s1-review-split-coverage.js`, `check-res-s2-overwrite-artefact-in-place-on-revision.js`, `check-ral-s1-audit-log-journey-id-and-timestamp.js`, `check-dsh-s1-persist-session-turns.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`) — each gets a `setSkillTurnGitCommitAdapter(...)` stub call added before its first artefact-completing test, mirroring the existing 12-file pattern exactly (e.g. `tests/check-dic1-story-cards.js`).
- `scripts/check-skill-turn-git-commit-stubbing.js` (new) — structural check scanning every `tests/*.js` file that calls `handlePostTurnStreamHtml` with an `---ARTEFACT-END---`-bearing fixture response, flagging any missing a `setSkillTurnGitCommitAdapter` stub.
- `workspace/learnings.md` (modified) — existing junk-commit-contamination entry updated to record closure, cross-referencing this story.

**What will NOT be built:**
- `scripts/run-all-tests.js` parallelization implementation itself — a separate, later story, explicitly gated on this one.
- Any change to the 12 already-stubbed files, or the 15 non-risk files that call the handler but never reach the gated branch.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration test grepping each of the 13 files for a correctly-positioned stub call | integration |
| AC2 | Unit tests running the new structural check against synthetic unstubbed/stubbed fixtures | unit |
| AC3 | Integration test: full suite before/after diff + per-file pass-count diff for the 13 files | integration |
| AC4 | Unit test reading the updated `workspace/learnings.md` entry | unit |

**Assumptions:**
- The 13-file count (corrected from `tfhc-s6`'s originally-named 14 at this story's own `/review`, finding 1-M1) is the final, accurate list — independently verified file-by-file during review, not solely inherited from the spike.
- The existing 12-file stubbing pattern (`setSkillTurnGitCommitAdapter` call before any artefact-completing test) is itself correct and does not need modification — this story only extends its application, per the D37 rule's own framing that no new adapter is introduced here.

**Estimated touch points:**
Files: the 13 named test files, `scripts/check-skill-turn-git-commit-stubbing.js`, `workspace/learnings.md`
Services: None
APIs: None
