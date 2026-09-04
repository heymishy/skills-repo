# Definition of Done: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**PR:** https://github.com/heymishy/skills-repo/pull/828 | **Merged:** 2026-09-04 (commit `7b6d8d31`)
**Story:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**Test plan:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/test-plans/daga-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/dor/daga-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `.dockerignore has no bare "artefacts/" line` + `.dockerignore has no bare ".github/" line` | automated test (`tests/check-daga-s1-dockerignore-and-writer-safety.js`) | None |
| AC2 | ✅ | `.dockerignore still excludes .github/scripts/` | automated test | None |
| AC3 (regression) | ✅ | `.dockerignore still contains every other pre-existing exclusion` | automated test | None |
| AC4 | ✅ | `pipelineStateWriterFactory: throws without .git/` | automated test | None |
| AC5 (regression) | ✅ | `pipelineStateWriterFactory: succeeds with .git/ present` + `owle.6`'s own T3/T4/T5/T8 (20/20) + `check-cdg7-gate-advance.js` (40/40) | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One recorded, non-blocking item — real work discovered and resolved within this same story, not silently absorbed, and beyond what the DoR contract itself anticipated:

1. **A second existing test file found and fixed via a full-suite run, not the DoR's own "estimated touch points."** The DoR contract's own stated assumption — "`owle.6`'s own T3/T4/T5/T8 are the only tests... exercising the real factory" — was incomplete. `tests/check-cdg7-gate-advance.js` also calls `pipelineStateWriterFactory` directly, at 7 call sites, all via a shared `makeTempDir()` helper. Found only by running the full suite, not by targeted regression checks on the individually-identified related files. Fixed by adding `.git/` creation to the shared helper itself (harmless for the 5 other, unrelated tests in that file), not worked around.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6
**Tests passing in CI:** 6 / 6 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 no bare artefacts/.github exclusion | ✅ | ✅ | |
| AC2 .github/scripts/ still excluded | ✅ | ✅ | |
| AC3 other exclusions unchanged | ✅ | ✅ | |
| AC4 writer throws without .git/ | ✅ | ✅ | |
| AC5 writer succeeds with .git/ | ✅ | ✅ | Plus `owle.6` (20/20) and `cdg7` (40/40) regression suites |

**TDD verification performed (RED confirmed, not assumed):** before committing, both fixes were temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code. AC1 and AC4 failed exactly as expected — AC4's own failure is the strongest evidence in this story: pre-fix, the writer *succeeded* even with `.git/` absent (as long as `pipeline-state.json` was merely readable), empirically proving the exact silent-data-loss regression this story exists to prevent, not just a value-mismatch assertion.

**Gaps (tests not implemented):**
None. (The one structural gap — no `docker build` available in this test environment — is explicitly named in the test plan's own gap table, with the manual verification script as its stated mitigation.)

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible image size increase | ✅ | ~38MB combined, measured via `du -sh` before writing the story; two orders of magnitude smaller than the `.claude/` exclusion this file was built to solve |
| Security — no secrets baked into the image | ✅ | Spot-checked before writing the story; all matches confirmed false positives |
| Security — no silent data-loss regression | ✅ | AC4/AC5's own tests directly assert the before/after safety property |
| Availability — no new failure mode | ✅ | AC4's own test confirms the writer's exact pre-existing safe-failure behaviour is preserved |

`nfr-profile.md` status: `Active` — no NFR gaps identified at DoR, none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `daga-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric this entire investigation thread has targeted — this story is what makes two of that thread's own already-shipped stories (`aada-s1`, `fapg-s1`) actually work in production for the first time.

---

## CORRECTION (2026-09-05)

**Follow-up action #2, below, was finally carried out for real on 2026-09-05 — and it failed.** A live, authenticated production check found this story's own central claim was false: the feature artefact page still showed "No artefacts found for this feature" after `promote-to-prod` was approved and confirmed deployed via git-ancestor check. Root cause: this story's own `.dockerignore` fix was necessary but not sufficient -- the Dockerfile's `production` stage uses an explicit `COPY` allowlist that never had a line for `artefacts/` or `.github/` at all, a fact this story's own DoR investigation never checked (it focused entirely on `.dockerignore`, which does not by itself put anything into a Docker image). The real fix is tracked separately as `dcfx-s1` (PR #833), not as an amendment to this story's own implementation, since this story's own two changes (`.dockerignore`, `pipeline-state-writer.js`) are both still correct and still needed -- they were just not the whole fix. This DoD's own **Outcome** verdict below is left as originally written, for an honest record of what was believed true at the time; this correction section is the authoritative account of what was actually true. See DoD Observation #5 below.

---

## Outcome

**COMPLETE** *(see CORRECTION above -- this verdict's own central claim was later found false; left unedited for the historical record)*

The critical, unplanned fourth story in this session's own feature-artefact-page investigation — found only because the operator checked the live production result of `fapg-s1` rather than trusting the merged/DoD-complete status alone. Zero regressions in the story's own primary scope; one real, expected gap in the DoR's own "estimated touch points" found via full-suite run and fixed transparently, not worked around. Genuine RED-state TDD verification, including an AC (AC4) whose own pre-fix failure directly demonstrates the exact vulnerability this story prevents, not just an assertion mismatch.

**Follow-up actions:**
1. **Approve `promote-to-prod`** in GitHub Actions for this merge commit (`7b6d8d31`) whenever convenient — verify via git-ancestor check against whatever commit is actually deployed, not by run ID alone, per the established lesson from `fal-s1`'s own DoD. ✅ Done 2026-09-04.
2. **Live confirmation, once promoted**: navigate to `2026-04-14-skills-platform-phase3`'s artefact page and confirm both `aada-s1`'s real content and `fapg-s1`'s accordion now actually render — the exact "looks the same on prod" gap this story closes. This is the one follow-up in this whole session's thread that most warrants an explicit visual check, since two prior stories' own promotion was already (incorrectly) treated as sufficient confirmation. ⚠️ Done 2026-09-05 -- **failed**. See CORRECTION above and `dcfx-s1`.
3. **Watch server logs after the next real gate-confirm action** in the web UI to confirm `pipeline_state_write_failed` still logs correctly (naming the missing `.git/` directory) rather than silently appearing to succeed — the verification script's own Scenario 3. Not yet done.

---

## DoD Observations

1. **Same recurring deploy-topology gap, tenth occurrence this session.**
2. **This story is direct proof that "merged and DoD-complete" is not the same as "confirmed working," and that the gap between them can persist through multiple stories before being caught.** `aada-s1` and `fapg-s1` were both DoD-marked-COMPLETE, both had passing tests, both had approved production promotions — and neither actually functioned in production, for the same root cause, undetected until the operator manually checked the live page. Every prior DoD's own "Follow-up actions" item 2 ("optional live confirmation... not blocking") was — in hindsight — exactly where this gap would have surfaced sooner if treated as load-bearing rather than optional. Worth escalating from a per-story footnote to a standing process question: should a story that changes a page's own rendering require an actual live-page check before DoD, not just automated test coverage, specifically for changes whose correctness depends on the deployed environment's own topology (which unit tests using `fs.mkdtempSync` cannot observe)?
3. **The regression this story fixes was found by investigating *why* a fix didn't work, not by a dedicated audit.** Consistent with `aada-s1`'s own DoD observation #2 from earlier this session ("mockups built with real data surface real defects as a side effect") — this is the second time in the same session that genuinely looking at real, live behaviour (not trusting a green pipeline) surfaced a defect no amount of DoR scoping or unit testing would have caught, because the defect was specifically about the gap between the test environment and the deployed environment.
4. **The second-regression-found-via-full-suite pattern (now five occurrences this session: `ppg-s1`, `fal-s1`, `prlf-s1`, and now two in this single story) is no longer a coincidence worth individually re-noting — it's a structural signal.** DoR-time "estimated touch points" scoping has a consistent, repeated blind spot for shared, widely-reused low-level functions (`_renderPvcItemRow`, `pipelineStateWriterFactory`) whose own callers span more files than a story's own immediate feature area suggests. This is the strongest evidence yet in this session for treating a full-suite run as a mandatory gate before every commit in this repo, not an optional nice-to-have — which every story this session already did in practice, but which this repeated pattern now argues should be a named, standing rule rather than inherited convention alone.
5. **(Added 2026-09-05) This DoD's own question in Observation #2 -- "should a story that changes a page's own rendering require an actual live-page check before DoD, not just automated test coverage" -- was answered by direct experience the very next day: yes, unambiguously.** This story's own follow-up action #2 sat as an unexecuted "recommended confirmation" for a full session-day before the operator actually asked for it. When finally performed, it failed, revealing a real production defect (`dcfx-s1`) that had been live and undetected the entire time this DoD said COMPLETE. The deeper lesson is not "always do the live check" (this DoD already recommended that and it still took a day to happen) -- it's that a DoD's own **Outcome: COMPLETE** verdict should not be treated as settled fact by any later story or by the operator's own mental model until its own named follow-up actions are actually closed out, not just recommended. A COMPLETE verdict with an open, unconfirmed follow-up action is provisional, not final -- this repo's own artefact trail already has the right structure to express that (the follow-up actions list itself), it just was not being read that way in practice until this correction made it explicit.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work" (daga-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for this specific merge commit (7b6d8d31) -- verified via git-ancestor check, not run ID alone -- and that a REAL live-page check (not just automated tests) is the recommended way to confirm this one, given the whole point of this story is a gap those same automated tests could not detect?
Report findings as HIGH / MEDIUM / LOW.
```
