# Spike Outcome: parallelization git-commit-collision risk

**Opened:** 2026-10-30 | **Scope:** Narrow | **Steps taken:** 3
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-30-test-fixture-hardening-continuation/spikes/tfhc-s6-outcome.md`

---

## Outcome: PROCEED (conditional)

### What was found

**Step 1 — found the real risk mechanism directly in source, rather than chasing the unenumerated "64 files" estimate.** `src/web-ui/routes/skills.js:1508` defines `_skillTurnGitCommit`, a D37 injectable adapter (`stis-s1`) whose *default* implementation (`src/web-ui/routes/skills.js:1508-1512`) runs a real `child_process.execSync('git add ...')` + `execSync('git commit ...')`. It is called from exactly one site, `src/web-ui/routes/skills.js:5590`, inside `handlePostTurnStreamHtml` (line 4963), gated by `if (done && _artefactText)` (line 5523) — i.e., it fires only when a skill-turn completes with real artefact content (an `---ARTEFACT-END---` marker was found in that turn's streamed response). Tests inject a stub via `setSkillTurnGitCommitAdapter()` so no test run spawns a real git process — this is the actual, documented risk boundary, not generic "subprocess spawning."

**Step 2 — swept every `tests/*.js` file calling `handlePostTurnStreamHtml`.** 41 unit/integration test files call this handler (plus 3 Playwright E2E specs, correctly out of scope — E2E specs run under a separate test runner, not `scripts/run-all-tests.js`'s own subprocess-per-unit-file mechanism, so they carry no parallelization-collision risk for this specific concern). Of the 41:
- **12 files** call `setSkillTurnGitCommitAdapter` to stub it — safe, matching the "stubbed by exactly 12 known test files today" figure already recorded in the original `/clarify` note (`test-suite-infra-refactor/discovery.md:45`). This independent re-derivation exactly reproduces that number, confirming the investigation method is sound.
- **29 files** do not stub it at all.

**Step 3 — of those 29, checked which actually drive a turn that reaches the gated `done && _artefactText` branch** (searched each for an `---ARTEFACT-END---`-bearing fixture response, the literal marker the handler's own regex looks for):
- **14 files genuinely drive at least one artefact-completing turn** without stubbing the adapter — these are the real, precise remaining-risk list (named below). Spot-checked one directly (`check-dcuf-s1-github-commit-real-completion-point.js`) by reading its full source: confirmed it calls `handlePostTurnStreamHtml` 4 times with a fixture response containing `---ARTEFACT-END---`, has no `setSkillTurnGitCommitAdapter` call anywhere, and has no alternative mocking of `child_process`/`execSync` either — this file genuinely fires a real `git add`/`git commit` on every run today.
- **15 files** call the handler but never drive a turn reaching that branch (0 `ARTEFACT-END` occurrences in their own fixtures) — they exercise other parts of the same handler (SSE rate-limiting, disconnect logging, canvas rendering, etc.) and carry no real risk despite appearing in the raw call-site sweep.

**Precise remaining-risk list (14 files):**
1. `tests/check-alrf-s8-journey-slug-priority.js`
2. `tests/check-mfc1-model-first-chat-session.js`
3. `tests/check-res-s3-suggest-revision-materiality.js`
4. `tests/check-defs-revs-s1-wiring-into-turn-completion.js`
5. `tests/check-wsd-s4-pipeline-state-owner-repo-resolution.js`
6. `tests/check-wsap-s3-multi-story-commit-and-no-review-rerun.js`
7. `tests/check-wsap-s1-story-scoped-artefact-paths.js`
8. `tests/check-rsc-s1-review-split-coverage.js`
9. `tests/check-res-s2-overwrite-artefact-in-place-on-revision.js`
10. `tests/check-ral-s1-audit-log-journey-id-and-timestamp.js`
11. `tests/check-isc-s1-ideate-success-lens-cycling.js`
12. `tests/check-dsh-s1-persist-session-turns.js`
13. `tests/check-dcuf-s1-github-commit-real-completion-point.js`
14. `tests/check-csgc-s1-story-extraction-and-gate-confirm.js`

### Reasoning

The done condition ("a precise list of remaining at-risk files, plus a verdict") is fully met: the list above is grounded directly in the real adapter's own call site and gating condition, not a static or inherited estimate, and the method independently reproduced the one previously-known number (12 stubbed files) exactly — a strong internal-consistency check that the investigation is sound. 14 files is a genuinely small, closeable list (discovery.md's own PROCEED condition: "risk fully contained or a small closeable list"), so the verdict is PROCEED — but conditionally: this is a real, currently-active risk (not a historical one), and it is also the precise root cause of a separately-known, already-logged bug (`workspace/learnings.md`'s "skills.js fires a real git commit during tests" junk-commit-contamination finding) — these 14 files are very likely the exact source of that recurring contamination, not merely a theoretical future parallelization risk.

---

## If PROCEED

**Unblocked stage:** `scripts/run-all-tests.js` parallelization implementation — but only after the condition below is met, not immediately.

**Conditions:**
1. **Must-fix before enabling true concurrent subprocess execution:** stub `setSkillTurnGitCommitAdapter` in all 14 remaining-risk files, mirroring the existing 12 files' own established pattern. This is a small, bounded, mechanical fix (the stub pattern is already proven and repeated 12 times in this same suite) — not a design question.
2. This also closes the standing "skills.js fires a real git commit during tests" junk-commit-contamination bug already logged in `workspace/learnings.md` — fixing this is valuable independent of whether parallelization itself is implemented in this MVP's own cycle.

---

## What remains unknown

Nothing material to this spike's own question. One scope note, not an unknown: whether the 14-file stubbing fix and the parallelization implementation itself land in the same follow-on story or two separate ones is an operator scheduling decision — `discovery.md` Out of Scope item 3 ("Runner parallelization implementation... Gated, not fast-follow, unless the spike's verdict is PROCEED") already anticipates PROCEED unlocking in-MVP work; the 14-file fix is the natural first half of that unlocked work.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Confirms the stated risk, now with a precise mechanism and list instead of a vague "64 files" estimate |
| MVP scope | Yes | `scripts/run-all-tests.js` parallelization now explicitly conditionally in-scope for this MVP (per item 6's own PROCEED clause), conditional on first closing the 14-file adapter gap |
| Assumptions | Yes | The original "64 subprocess-spawning files" framing is superseded — the real risk surface is 14 files, grounded in the actual adapter mechanism, not a broader subprocess-spawning estimate that was never itself enumerated |
| Known risks | Yes | Narrowed from a vague, unenumerated risk to a precise, named, small list — and connected to an already-logged, separately-known bug (junk commit contamination), strengthening the case to fix it regardless of parallelization's own scheduling |
| Technical constraints | No | No new technical constraint found beyond the adapter mechanism itself, which was already documented at `stis-s1` |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing; the "whichever is confirmed, small closeable list" PROCEED condition was already anticipated

---

## Decision log reference

Logged in `artefacts/2026-10-30-test-fixture-hardening-continuation/decisions.md` as a SCOPE entry (see below).
