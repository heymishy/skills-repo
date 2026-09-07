# Definition of Done: The feature artefact-index page renders every document's real status, using the canonical trace

**PR:** https://github.com/heymishy/skills-repo/pull/845 | **Merged:** 2026-09-07 (c634d1a4)
**Story:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
**Test plan:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s4-features-page-integration-test-plan.md
**DoR artefact:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s4-dor.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-07

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | 205/205 real `phase4` documents render — confirmed by an automated test that counts distinct rendered links against a real filesystem walk (not a synthetic fixture), and independently re-confirmed by manually starting the merged server and counting distinct `/artefact/` hrefs in the live HTTP response (`grep -oE 'href="/artefact/[^"]+"' \| sort -u \| wc -l` → 205) | Automated test (`tests/check-cat-s4-features-page-integration.js`, real-data regression test) + manual browser/curl walkthrough | None — see DoD Observation 1 for the pre-merge defect this walkthrough caught and the fix that landed before merge |
| AC2 | ✅ | "Unregistered" `.sw-pill` text-labeled indicator renders for every `unregistered`-classified document, with and without a successful inferred grouping; independently confirmed on the real live page (all 205 `phase4` documents, all unregistered, all carry the pill) | Automated unit tests + manual walkthrough | None |
| AC3 | ✅ | `orphaned-registration` stories render a distinct "Registered, but no files found" gap state; a combined fixture (both markers rendered together) asserts the two are textually non-overlapping, not just "some gap text present" | Automated unit + combined-fixture regression test | None |
| AC4 | ✅ | Golden-fixture byte-identical comparison against the real `2026-09-06-feature-artefact-document-matrix` feature's pre-change output passed on the first implementation attempt, no adapter fixes needed, and remained passing through every subsequent fix cycle in this story | Automated integration test (golden HTML fixture diff) | None |
| AC5 | ✅ | A `not-yet-synced` feature renders the literal user-facing message via the real `handleGetFeatureArtefacts` route branch — the original test only exercised `buildArtefactTrace` directly (a duplicate of cat-s1/cat-s3's own coverage); the mandatory final review caught this gap and a genuine route-level test was added before merge | Automated route-level integration test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 10 commits on `feature/cat-s4` map to the 5 planned tasks and their review-driven fix cycles (confirmed via `git log --oneline master..feature/cat-s4` at /verify-completion). Two pre-existing test files (`check-fapg-s1-group-artefacts-by-story.js`, `check-dsh-s4-fix-resume-conversation-link.js`) needed fixture updates — both are direct, necessary consequences of this story's own intentional routing-gate change (AC1's "always use the grouped renderer" requirement), not unrelated scope creep, and both are documented inline in the commit that touches them.

---

## Test Plan Coverage

**Tests from plan implemented:** 11 / 11 (the test plan's own Unit + Integration tables)
**Tests passing in CI:** 24 / 24 implemented (13 additional tests were added beyond the original plan during review cycles — see below)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 — phase4's 205 documents all appear | ✅ | ✅ | Upgraded during the /verify-completion fix cycle from a bucket-membership-only assertion to a real rendered-link-count assertion against a real filesystem walk — the weaker version would not have caught the Critical AC1 bug (see DoD Observation 1) |
| AC1 — inferred-group documents render in a labeled section, not the old 73-card dump | ✅ | ✅ | |
| AC2 — unregistered document renders a visible `.sw-pill` text indicator | ✅ | ✅ | |
| AC2 — indicator renders even when inference failed to group | ✅ | ✅ | |
| AC3 — orphaned-registration story shows a distinct gap state | ✅ | ✅ | |
| AC3 — gap marker is distinguishable from the Unregistered pill (non-conflation) | ✅ | ✅ | First version of this test didn't render both markers together and used a loose `\|\|` assertion — code-quality review caught this and a genuine combined-fixture test was added |
| AC4 — byte-identical to fadm-s1's current output | ✅ | ✅ | |
| AC4 (integration) — golden-output baseline reproducible after the data-source swap | ✅ | ✅ | |
| AC5 — not-yet-synced shows a clear message | ✅ | ✅ | |
| AC5 — message distinct from the Unregistered pill / no 500 page | ✅ | ✅ | Original test called `buildArtefactTrace` directly; mandatory final review required a genuine route-level test exercising the real branch — added before merge |
| Integration — full pipeline seam (route handler → trace → classify → render) | ✅ | ✅ | |
| **13 additional tests beyond the plan** (feature-level mislabeling regression, registered-pill-absence regression, unregisteredCatchAll routing-branch coverage, colspan-guard regression, AC1 real-data link-count regression) | ✅ | ✅ | All added in response to two-stage review, mandatory final review, or /verify-completion findings — see DoD Observation 1 for the most significant one |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — page render for phase4's 205-file case, no regression beyond directory-walk cost | ✅ | Measured 17–30ms across multiple independent runs (walk + classify + adapt + render), well within the 50–100ms budgets established by `cat-s1`'s own empirical baseline |
| Accessibility (MC-A11Y-02) — Unregistered indicator never relies on color alone | ✅ | Automated test asserts visible text inside the pill markup (`/sw-pill[^>]*>[^<]*Unregistered/`); independently re-confirmed on the real live page |
| Security — no new input surface | ✅ | Unchanged from `cat-s1`; `featureSlug` validation is pre-existing route-handler behaviour, not modified by this story |
| Availability — graceful degradation for not-yet-synced | ✅ | Now verified at the actual route level (previously only verified at `cat-s1`'s classification level) — see AC5 |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1 — Registered-vs-disk divergence rate | ✅ (~35% baseline) | Not yet — requires running the canonical builder across the full feature set and comparing before/after divergence rates, which has not been executed as a measurement exercise. `cat-s5`/`cat-s6` (both still `contributingStories` for the sibling `m2` metric) are not yet merged. | Signal: `not-yet-measured`. Evidence note: "cat-s4 is the first real rendering consumer of the canonical trace/label/divergence pipeline (merged 2026-09-07), but no divergence-rate comparison has been run across the ~260-feature corpus yet — that is a separate measurement exercise, not blocked on any further code change." |
| m3 — Unregistered documents visible without a bug report | ✅ (0% baseline) | Not yet — this is an absence-of-bug-report metric requiring a real observation window post-merge; zero time has elapsed since merge. | Signal: `not-yet-measured`. Evidence note: "The code-level precondition is now demonstrably met — 205/205 real unregistered documents on the phase4 feature are visually flagged, confirmed by both automated test and a manual live-page check — but the metric itself measures real-world bug-report absence over time, which cannot be assessed at merge time." |

This section does not claim success — it records what is now observable.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. File a follow-up story against `src/web-ui/adapters/artefact-trace.js` (`cat-s1`, already merged/DoD'd) to fix `buildArtefactTrace`'s bare-string `epic.stories[]` handling — see DoD Observation 2. Owner: next backlog grooming for this epic or a successor.
2. Consider adding "at least one real-data (not synthetic-fixture) regression test for any story that modifies shared multi-row/multi-column rendering logic" to `.github/standards/web-ui/web-ui-patterns.md`'s testing guidance — see DoD Observation 1. Tagged as an `/improve` candidate.

---

## DoD Observations

1. **The mandatory manual /verify-completion walkthrough against real, production-scale data caught a Critical bug that 24 passing automated tests (all built from small synthetic fixtures) completely missed.** `renderArtefactMatrix`'s cell-building logic (`byColumn[key] = a`, pre-existing code not introduced by this story) silently overwrote rather than accumulated when multiple artefacts shared a matrix column key — a case this story's own intentional routing-gate change newly made possible at scale. On the real 205-file `phase4` feature — this story's own named AC1 acceptance scenario — this dropped 176 of 205 real documents (86%) from the rendered page with no error, no test failure, and no visible symptom short of manually counting real files against what rendered. The bug was found, fixed (`byColumn` changed to accumulate an array per column key), and re-verified (both automated, via a new real-data regression test, and manually, via a live server re-check) before the PR was merged — so the merged code has no residual AC1 gap. This is recorded here as a process signal, not a deviation: it is strong evidence that the plan's own "manual walkthrough required" instruction for this story was exactly the right call, and that any future story touching shared, multi-consumer rendering logic (a matrix, a table, an aggregation) should not treat passing fixture-based tests alone as sufficient completion evidence. **Tagged as an `/improve` candidate.**
2. **A real, out-of-scope bug was found in already-merged `cat-s1` code** (`src/web-ui/adapters/artefact-trace.js:136`) during this story's Task 4: `buildArtefactTrace` reads `story.slug` directly for nested-shape stories, so a bare-string `epic.stories[]` entry (a shape `feature-story-structure.js`'s own `_storySlug` helper documents as valid) yields `slug: undefined`, silently misclassifying every artefact for that story as unregistered/orphaned-registration instead of registered. This was correctly *not* fixed within this story (out of its own file scope — `features.js`, not `artefact-trace.js`) and was instead logged to `workspace/capture-log.md` (2026-09-07, signal-type: gap) and sidestepped in the one pre-existing test fixture it affected. Traced through this story's own code by the mandatory final review and confirmed to degrade gracefully (renders the literal text "undefined", no crash) rather than compounding into a second defect. **Follow-up story needed against `cat-s1`'s own file** — this is separate from and does not block this story's own completion.
3. The recurring "vacuous `doesNotThrow`" test-quality pattern found independently in both `cat-s1` Task 5 and `cat-s3` Task 2 earlier in this epic did not recur in any of `cat-s4`'s 5 tasks — no new instance found during either two-stage per-task review or the mandatory final review. Noted for pattern-tracking only; not proof the underlying awareness gap is closed, since this story's tests are a different shape (server-rendered HTML string assertions, not exception-guarding).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "The feature artefact-index page renders every document's real status, using the canonical trace" (cat-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
