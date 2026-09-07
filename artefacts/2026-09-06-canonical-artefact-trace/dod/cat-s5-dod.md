# Definition of Done: Opening any single document resolves through the canonical trace, not independent logic

**PR:** https://github.com/heymishy/skills-repo/pull/846 | **Merged:** 2026-09-07 (c274bc22)
**Story:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s5-artefact-fetch-integration.md
**Test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s5-artefact-fetch-integration-test-plan.md
**DoR artefact:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s5-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | A correctly-generated link (e.g. `dor/psh-s1-dor`) resolves identically to `adlr-s1`'s pre-existing direct-path resolution — confirmed both by automated test and by tracing the real code path (`_resolveViaTraceForBareName`'s slash-check guard makes the new logic a provable no-op for any slash-containing type, regardless of whether `repoRoot` is supplied) | Automated regression test + independent code trace during final review | None |
| AC2 | ✅ | A bare legacy link to a document only locatable via a subdirectory (`spikes/`) the old static probe explicitly excludes now resolves to the real file instead of 404ing — verified through the real, non-stubbed `fetchArtefact` → `handleArtefactRoute` chain, not just an isolated unit test | Automated real-chain integration test (added during Task 2's critical fixup) | None — see DoD Observation 1 for the pre-merge defect this exposed and fixed |
| AC3 | ✅ | A document classified `orphaned-registration` returns a distinct 404 message from a genuinely never-registered path — verified through the real, non-stubbed chain with postgres-fallback confirmed to run first | Automated real-chain integration test (added proactively during Task 3, mirroring Task 2's fixup) | None |
| AC4 | ✅ | `ArtefactNotFoundError`'s constructor signature and the existing postgres-fallback/error-page contract are byte-identical to the pre-story baseline — independently diffed against the pre-`cat-s5` commit during final review | Automated test + direct diff verification | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 6 commits on `feature/cat-s5` map to the 4 planned tasks and their review-driven fix cycles (confirmed via `git log --oneline master..feature/cat-s5` at /verify-completion). The 2 named regression surfaces (`journey.js`'s gate-confirm fetch, `export-data-source.js`'s SaaS export fetch) were confirmed completely untouched across the whole branch (`git diff --stat` empty for both files).

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 (the test plan's own Unit + Integration + NFR tables)
**Tests passing in CI:** 25 / 25 implemented (14 additional tests were added beyond the original plan during review-driven fix cycles)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — correctly-encoded link resolves identically | ✅ | ✅ | |
| AC2 — bare legacy link resolves via the trace | ✅ | ✅ | |
| AC2 — structural check (trace priority over static probe) | ✅ | ✅ | |
| AC2 — fall-through when trace has no match | ✅ | ✅ | |
| AC2 — fall-through when no repoRoot supplied (regression guard) | ✅ | ✅ | |
| **Task 2 review-fixup — real chain, not stubbed** | ✅ | ✅ | Added after code-quality review found `handleArtefactRoute` never actually wired `repoRoot` into `fetchArtefact` — the entire AC2 feature could never fire in production despite all 8 originally-passing tests. See DoD Observation 1. |
| AC3 — orphaned-registration flagged distinctly | ✅ | ✅ | |
| AC3 — non-conflation (never-registered NOT flagged) | ✅ | ✅ | |
| AC4 — constructor signature unchanged | ✅ | ✅ | |
| AC3/AC4 — route-level distinguishing message | ✅ | ✅ | |
| **AC3/AC4 — real chain, not stubbed** | ✅ | ✅ | Added proactively by the Task 3 implementer, explicitly briefed on Task 2's gap, without being separately instructed |
| NFR — performance (no regression) | ✅ | ✅ | |
| NFR — no new unvalidated input surface | ✅ | ✅ | |
| NFR — audit logging unchanged | ✅ | ✅ | |
| **adlr-s1's own 15-test pre-existing regression suite** | N/A (pre-existing) | ✅ 15/15 | Confirmed unchanged from the story's first commit through the last — this story's own core safety contract |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no regression vs. `adlr-s1`'s bounded-probe behaviour | ✅ | Common-case resolution measured at 0.1ms, well under the "same 1-2 request bound" target |
| Security — no new unvalidated input surface | ✅ | Source review confirms `artefactType`/`featureSlug` still flow only into path template strings already validated upstream; no new `eval`/`child_process` introduced |
| Accessibility — Not applicable | ✅ | Backend resolution logic, no UI surface (per story's own NFR text) |
| Audit — existing `artefact_read` logging unchanged | ✅ | Call count and argument shape confirmed identical via spy-based test |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m2 — Bugs of this class per session | ✅ (5 in one session baseline: `bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`, `phase4`) | Not yet — this metric counts FUTURE multi-file-touching bug instances across future sessions; zero time has elapsed since merge to observe any. | Signal: `not-yet-measured`. Evidence note: "cat-s5 unifies `/artefact/:slug/:type`'s resolution logic onto the same canonical trace `/features/:slug` (cat-s4) already uses — the code-level fix this metric exists to validate is now shipped (merged 2026-09-07), but the metric itself requires observing whether a future bug-fix session needs to touch more than one independent implementation, which cannot be assessed at merge time." |

This section does not claim success — it records what is now observable.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None specific to this story. (The 2 Minor findings from Task 3's own review — trace re-derived twice on the not-found path, and orphaned-story matching not replicating `artefact-trace.js`'s longest-prefix-first disambiguation — remain accepted as non-blocking; see DoD Observation 2.)

---

## DoD Observations

1. **A Critical route-wiring gap was found and fixed pre-merge, in this story's own Task 2 — the second time in this epic that a feature has shipped functionally correct in isolated unit tests while being completely unreachable in production, and the second time this exact class of gap was only caught by code-quality review, not by any passing test.** (The first instance was `cat-s4`'s manual-walkthrough-caught data-loss bug.) This story's own implementation plan correctly *identified*, in its own "Critical findings" section, that `artefact.js`'s route handler needed `getRepoRoot(req)` wiring for the new trace-based resolution to ever engage — but no task in the plan actually included that wiring step, an authoring gap in the plan itself, not an implementer error. All 8 of Task 2's originally-written tests passed because every one of them called `fetchArtefact`/`_resolveViaTraceForBareName` directly with a manually-supplied `repoRoot`, never exercising the real `handleArtefactRoute` call chain the way an actual HTTP request would. Fixed by wiring `getRepoRoot(req)` into the route handler and adding a genuine end-to-end test (real `fetchArtefact`, real `repoRoot`, real file content — only the external GitHub network call itself mocked) that was confirmed to fail before the fix and pass after. **Tagged as an `/improve` candidate**: the pattern "a plan's own Critical Findings section names a required wiring step, but no task actually implements it" is now confirmed to have happened twice in one epic (`cat-s4`'s AC1 matrix bug was a different root cause — a pre-existing latent bug newly exposed — but shares the same "isolated tests pass, production path is broken" shape as this one). Consider a `/implementation-plan` checklist item: "for every file named in a Critical Finding as needing a specific change, confirm at least one task's file map and step list actually implements that exact change" — this would have caught the gap at plan-authoring time rather than requiring a review cycle to catch it.
2. **This story's own manual browser walkthrough (called for by its own verification script) was found to be non-executable in this specific sandbox environment** — `server.js`'s `NODE_ENV=test` startup permanently substitutes an unrelated fixture fetcher for all artefact requests (serving `<type>-sample.md` content for one hardcoded test slug, regardless of the requested slug/type), completely bypassing this story's own changed code, and no real GitHub OAuth credentials are available to run the server any other way. This is a materially different situation from every other story in this epic so far, all of which operated on pure local-disk logic with no external-auth dependency. RISK-ACCEPTed in `decisions.md` (2026-09-07), with the 3 real-chain automated tests serving as the closest achievable substitute (same code path, only the unavoidable external network boundary mocked). **Tagged as an `/improve` candidate**: any future story whose changed code path requires a real external API credential to manually verify should flag this constraint explicitly at `/test-plan` or `/definition-of-ready` time, not discover it for the first time at `/verify-completion`.
3. The 2 Minor findings from Task 3's own code-quality review (trace re-derived a second time on the not-found path; orphaned-story matching doesn't replicate `artefact-trace.js`'s own longest-prefix-first disambiguation for two stories with overlapping slug prefixes) were re-examined at the mandatory final review and confirmed to remain genuinely non-blocking at the whole-branch level — neither compounds into a real problem when the two changed files are read together. No action needed.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Opening any single document resolves through the canonical trace, not independent logic" (cat-s5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
