# DoR Contract — Wire the real CLI into skills/feature-playback/SKILL.md's own documented steps

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
**Date:** 2026-10-19

---

**What will be built:**
- **A real finding, surfaced before writing the fix:** `skills/feature-playback/SKILL.md`'s own current Step 2 ("Run `scripts/playback-capture.js [feature-slug]`") describes `generateWalkthroughMarkdown` + `captureAcScreenshots`. The literal CLI entrypoint (`node scripts/playback-capture.js [feature-slug]`, i.e. `runCli`→`runCaptureForFeature`) calls NEITHER of those — it only runs `rpca-s1`'s own hardcoded single-AC proof path. `captureAcScreenshots` itself remains completely unchanged by `rpca-s1`-`rpca-s3` — it still takes `page`/`acList` as plain injected arguments (confirmed: not a D37 adapter, ordinary dependency injection per its own code comment), and nobody has ever supplied it a *real* page before. So the two mechanisms — the new real CLI, and `/feature-playback`'s own existing walkthrough/screenshot functions — are currently disconnected. Simply rewriting Step 2-3's own prose to *sound* consistent with `rpca-s1`-`rpca-s3` without connecting them would make the SKILL.md **factually wrong**, not accurate — the exact failure mode this whole epic exists to fix, just relocated to a different file.
- **The actual fix:** since every SKILL.md in this repo is natural-language orchestration instructions followed by whichever agent executes it (CLAUDE.md's own "How skills are invoked" section — none of this is registered/auto-executed code), Step 2-3 is rewritten to describe a new, real, step-by-step orchestration recipe for the agent to follow: (1) authenticate via `rpca-s1`'s own `authenticateStagingSession`; (2) launch a real Playwright browser/context/page with the session cookie; (3) derive each story's own real AC list via `rpca-s2`'s own `buildCaptureList`; (4) call the existing, unchanged `captureAcScreenshots` with that *real* page and *real* derived `acList` (previously only ever called with a mock); (5) optionally call `rpca-s3`'s own `captureVideoForClip` for video; (6) embed screenshots via the existing `embedScreenshotPaths`. This is the orchestration that actually closes the gap the 5 `fpd-*` RISK-ACCEPT entries describe — not prose alone.
- **A named, honest gap, not silently glossed over:** no `embedVideoPaths`-equivalent function exists — video files land at the existing `video/` path convention but are not yet automatically embedded into `walkthrough.md`. Step 3's own rewritten text states this as a known, explicit follow-up gap (not claimed as done), consistent with this epic's own discipline about not overclaiming.
- The same file's own "What this skill does NOT do" section updated to state that production capture and bulk retrofitting against existing features remain manual/out of scope, and that automatic video-embedding into the walkthrough document is a known gap — without implying the whole mechanism is still unautomated.
- A new entry appended to `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md` explicitly naming `fpd-s1`, `fpd-s2`, `fpd-s3`, `fpd-s4`, and `fpd-s5`'s own RISK-ACCEPT entries as superseded — accurately scoped to "the underlying mechanism (auth, selector derivation, video capture) is now real and `captureAcScreenshots`/`captureVideoForClip` can now be called with a real page," not an overclaim that the orchestration has been run end-to-end against a real feature yet.

**What will NOT be built:**
- Any rewrite or deletion of the original 5 RISK-ACCEPT entries in `feature-playback-demo`'s own `decisions.md` — they stay as the accurate historical record; only a new superseding entry is added (CLAUDE.md's own audit-trail-preservation principle).
- Any change to another SKILL.md file beyond `skills/feature-playback/SKILL.md` — scoped to the one file this epic's own problem statement names.
- A retroactive capture pass against any existing feature — epic-level Out of Scope.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test reads the real `skills/feature-playback/SKILL.md` file content and asserts it contains the real invocation syntax (`node scripts/playback-capture.js`), not aspirational language | unit (real-file content assertion) |
| AC2 | Unit test reads the same file's own "What this skill does NOT do" section, asserts it names production capture and bulk retrofitting specifically, not the whole mechanism | unit (real-file content assertion) |
| AC3 | Unit test reads the real `feature-playback-demo`'s own `decisions.md`, asserts a new entry names all 5 story slugs (`fpd-s1`-`fpd-s5`) as superseded, and asserts the 5 original entries are still present unedited | unit (real-file content assertion) |

**Assumptions:**
- This is a documentation-only change — no application code, no new NFR surface, consistent with the story's own NFR section.
- Both touched files (`skills/feature-playback/SKILL.md`, `feature-playback-demo`'s own `decisions.md`) are governed per CLAUDE.md's Platform change policy / `decisions.md`'s own audit-trail principle — this story merges via PR, same as every other `rpca-*` story, not a direct push.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `skills/feature-playback/SKILL.md` (modify — Step 2, Step 3, "What this skill does NOT do" only)
- `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/decisions.md` (modify — append one new entry only, no edits to the 5 original entries)
- `tests/check-rpca-s4-wire-cli-into-feature-playback-skill.js` (new)

Services: None | APIs: None
