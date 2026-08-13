# Definition of Done: Remove smug-s1's promote/opt-out routes and old Standards tab rendering

**PR:** https://github.com/heymishy/skills-repo/pull/733 | **Merged:** 2026-08-13
**Merge commit:** 7122c385
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s11-remove-smug-s1-routes-and-tab.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s11-remove-smug-s1-routes-and-tab-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s11-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | All 7 real old routes removed from `server.js` (not just the 3 the story's own text names — see Scope Deviations) — confirmed via source-content assertions plus a real E2E run through the live server | automated test (`tests/check-wugs-s11-remove-smug-s1-routes-and-tab.js`) + `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js` (post-fix) | Story's own AC1 text named only 3 of the 7 real routes |
| AC2 | ✅ | `AC2: standardsNavLink_repointedToGuardrailsView_exactlyOnce` asserts exactly one "Standards"-labelled nav link, with its href ending precisely at `/guardrails` (not a loose substring match) | automated test | None |
| AC3 | ✅ | Both story-named test files deleted (`check-smug-s1-standards-tab-and-query-fix.js`, `check-rapp-s2-standards-tab-nav-and-breadcrumb.js`), plus 2 more not named in the story but wholly dedicated to the same removed code (`check-psh-s8-standards-management.js`, `check-psh-s9-standard-promotion.js`) | file deletion, confirmed via `git show --stat` on each task commit | Story's own AC3 text named only 2 of the 4 test files that needed deletion |
| AC4 | ✅ | Repo-wide grep lock-in test using the real, complete removal list (not the story's own AC4 wording, which used incorrect function names for the promote/optout handlers) — zero live references in `src/`/`tests/`, with 3 documented, narrowly-filtered exceptions | automated test, hardened during review to fail loudly (not silently pass) on a real grep/tooling error | Story's own AC4 text named incorrect function names (`handlePutStandardPromote`/`handlePostStandardOptout`, which never existed under those names) |

All 6 unit tests plus the `bri-s3.4` unit and E2E specs re-run fresh against merged `master` on 2026-08-13: `6 passed, 0 failed` and `10 passed, 0 failed` respectively. Sibling stories `check-wugs-s2-product-level-guardrails-view.js` (11/11), `check-wugs-s3-org-level-guardrails-view.js` (12/12) re-confirmed unaffected.

**No deviations on the 4 ACs' actual intent** — every deviation recorded above is between the story's own literal AC text and the real code's actual shape, not between the implementation and what the ACs actually required. The real, complete removal scope (established via direct code investigation before implementation) is what the ACs' own intent — "remove the old routes," "delete the dedicated test files," "confirm zero dangling references" — demanded once the real code was read.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

**The story's own AC text materially undercounted the real removal scope — corrected before implementation, not discovered mid-flight.** Direct investigation of the merged codebase (before writing the implementation plan) established:
- **7 real routes** reference the removed code, not 3: `GET /products/:id/standards-tab` (smug-s1), `POST /products/:id/standards`, `GET /products/:id/standards`, `PUT /standards/:id` (all psh-s8), `PUT /standards/:id/promote`, `POST /standards/:id/optout`, `DELETE /standards/:id/optout` (all psh-s9).
- **`standardsPromote`/`optoutPost`/`optoutDelete`** are the real function names — the story's Architecture Constraints and AC4 text used incorrect names (`handlePutStandardPromote`/`handlePostStandardOptout`) that never existed in the real code.
- **The entire `standards.js` file** was deleted, not just some of its exports, since `fetchStandardsForProduct` (its remaining export) had exactly one consumer — `handleGetProductStandardsTab`, itself being removed — confirmed via grep before deletion, matching the story's own Out of Scope note ("if the file becomes fully empty after removal, delete the file").
- **5 test files** reference the removed code, not the 2 named in AC3: `check-psh-s8-standards-management.js` and `check-psh-s9-standard-promotion.js` were wholly dedicated to now-removed exports and had to be deleted too, or AC4's "zero dangling references" requirement would have been unsatisfiable.
- **`check-bri-s3.4-cross-tenant-isolation.js` was correctly identified and preserved as a mixed file** — it tests unrelated code (`handleGetProductView`, `handleGetProductKanban`, credits, user-roles) alongside 4 standards-specific test blocks. Only those 4 blocks were removed; the file itself was not deleted, avoiding an accidental loss of real, unrelated cross-tenant-isolation coverage.

**A real regression was found and fixed via CI, after two full review rounds missed it.** `tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js` — a Playwright E2E spec, distinct from the unit test file of a similar name above — still created a standard via the now-deleted `POST /products/:id/standards` route and asserted a 201. This spec was not caught by the pre-merge grep investigation because it references the removed route by raw HTTP path string (`ctx.post('/products/' + productId + '/standards', ...)`), not by JS function/export name — the exact category of dangling reference the AC4 grep (by design, scanning for function names) structurally cannot catch. PR #733's "Cross-tenant isolation spec — 20x repeat, zero-tolerance" CI check failed 20/20 repeats deterministically (`standard creation: Expected 201, Received 200`) — confirmed as a genuine regression, not the session's known deploy-group concurrency flake, before investigating. Root cause: this app's manual router has no true 404 fallback for unmatched authenticated routes — its final `else` branch unconditionally renders a 200 login page — a pre-existing app-wide behaviour this story's own implementation plan incorrectly assumed away ("the router returns 404 for any unmatched pathname by design," stated in the plan's Design note without independently verifying against the router's actual final-else behaviour). Fixed by surgically removing the same three standards-specific steps from the E2E spec (mirroring the exact pattern already applied to the parallel unit test file), verified locally, re-pushed, and confirmed the CI check now passes. A broader post-fix search confirmed no other E2E spec in `tests/e2e/` references any of the removed routes.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plan baseline, restructured across the real removal scope established before implementation), plus 2 additional review-driven hardenings
**Tests passing in CI:** 6 / 6 (unit) + 10 / 10 (`bri-s3.4` unit, post-surgical-edit) + the `bri-s3.4` E2E spec (post-fix, confirmed green in CI)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: old routes removed from `server.js` (3 checks covering all 7 real routes) | ✅ | ✅ | 3 tests |
| AC2: nav link repointed, exactly once | ✅ | ✅ | 1 test, hardened during review (precise href anchor, not a loose substring match) |
| AC1/AC4: old handlers removed from `products.js` | ✅ | ✅ | 1 test |
| AC4: repo-wide grep, real complete removal list | ✅ | ✅ | 1 test, hardened during review (fails loudly on a real grep/tooling error, not silently) |
| `bri-s3.4` unit test file, surgically edited (standards blocks removed, rest preserved) | ✅ | ✅ | 10 tests remaining (4 removed) |
| `bri-s3.4` E2E spec, surgically edited (post-CI-caught regression) | ✅ | ✅ | Fixed after a real CI failure, not part of the original plan |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none specific (removal-only story) | ✅ (N/A) | Confirmed via story's own NFR section |
| Security — none new (removal-only story) | ✅ (N/A) | Confirmed no new security surface introduced; existing cross-tenant isolation coverage for products/journeys/credits/user-roles preserved intact in the surgically-edited `bri-s3.4` files |
| Accessibility — none new | ✅ (N/A) | No UI added; existing nav link's structure/styling preserved, only its href changed |
| Audit — none new | ✅ (N/A) | Confirmed no audit-logging code touched |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Yes — this story removes a competing view, sharpening M1's real-world signal.**

`m1` ("Guardrail/standard visibility in the web UI") lists `wugs-s11` as an indirect contributor — "removes the competing old view." With the old DB-backed Standards tab and its nav link fully removed, 100% of product visits to "Standards" now land on the real, repo-backed view Epics 1-3 built, rather than some fraction still reaching the old, disconnected, non-governed DB data. This directly closes the gap the story's own Benefit Linkage names: "leaving the old page live would mean some fraction of visits still see the disconnected DB data."

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-independently-measured (m1's own measurement method is a metric-owner weekly spot-check, not a per-story automated signal)
> Evidence note: the competing old view is fully removed and the nav link repointed — every real product visit now reaches the correct, repo-backed view, matching m1's stated Target ("100% of active products... render a populated, correctly-delineated org/product guardrails-and-standards view").
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%, per m1's own baseline) | Already measurable since `wugs-s2`/`wugs-s3` shipped; this story removes the last competing path that could have diluted the signal | No new measurement instrumentation needed from this story |

---

## Outcome

**COMPLETE**

No deviations on the 4 ACs' actual intent — every recorded deviation is between the story's own literal (incomplete/incorrect) AC text and the real, complete removal scope, corrected via direct code investigation before implementation began. One real regression was found via CI (not by either review round) and fixed transparently before merge: a dangling E2E reference to a removed route, in a spec this story's own grep-based AC4 lock-in test was structurally unable to catch (URL-path reference, not a function-name reference). All 6 unit tests, the surgically-preserved `bri-s3.4` unit test, and the fixed `bri-s3.4` E2E spec are confirmed passing on merged master.

---

## DoD Observations

1. **A story's own AC text can be wrong in two different ways, and this story hit both.** `wugs-s9`'s DoD (Observation #2) already documented AC text using incorrect function names. This story found the same pattern (incorrect names for `standardsPromote`/`optoutPost`/`optoutDelete`) AND a second, distinct failure mode: AC text that *undercounts scope* (3 routes named vs. 7 real ones; 2 test files named vs. 5 real ones). Both were caught before implementation by reading the real, merged code directly rather than trusting the story text — but the undercounting pattern is harder to catch than wrong names, since there's no obvious signal (like a `grep` returning zero hits for a named function) to prompt a second look. Tag as a `/improve` candidate: for removal/deletion stories specifically, the DoR or implementation-plan skill's own instructions could explicitly require an exhaustive `grep -rln <feature-slug-or-route-prefix>` sweep across the *whole* repo (not just the exports the story names) before finalizing the removal scope, precisely because removal stories have no positive test to "catch" an undercounted deletion list the way a new-feature story's own tests would.
2. **The AC4 grep lock-in test has a structural blind spot this story's own regression exposed: it can only catch dangling references by JS identifier name, never by raw HTTP path string.** This is not a implementation bug — extending the grep to match arbitrary `/standards`-like substrings was tested and confirmed far too noisy (it matches dozens of unrelated files using `standards/` as a real repo-relative folder path, or `/products/...` route prefixes shared by every E2E spec in the suite). The real fix that caught this story's regression was CI itself — the `bri-s3.4` cross-tenant-isolation E2E spec's own `--repeat-each=20, zero-tolerance` gate. Tag as a `/improve` candidate: removal/deletion stories' own implementation-plan and verify-completion instructions could explicitly recommend a **manual, human/agent-read scan of `tests/e2e/*.spec.js` for the literal old route path strings** (not just a grep pattern match) as a mandatory pre-PR step, precisely because this class of dangling reference is invisible to identifier-based tooling and only surfaces at real-server-integration-test time — which, per this story's own experience, can mean discovering it in CI rather than locally, which is a slower, more expensive place to catch it.
3. **Both spec-compliance and code-quality review rounds, across all 3 tasks, missed the E2E regression** — neither reviewer was instructed to check `tests/e2e/` for dangling route-path references, since the review prompts (written by me) focused on the AC4 grep's own already-established scope (`src/`, `tests/`, function names). This is consistent with Observation #2 above: the review process itself inherited the same blind spot as the automated lock-in test. Worth explicitly naming in a future removal story's review-dispatch instructions: "check `tests/e2e/` for any spec hitting the removed route(s) by literal path string, not just `src/`/`tests/*.js` for function-name references."

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Remove smug-s1's promote/opt-out routes and old Standards tab rendering.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the Scope Deviations section's account of the story-text-vs-real-code gap accurate and complete (7 routes not 3, 5 test files not 2, incorrect function names)?
3. Is the E2E regression (bri-s3.4 spec creating a standard via a removed route) correctly attributed as a real, CI-caught defect fixed before merge, not silently omitted or downplayed?
4. Are both /improve candidates (DoD Observations #1 and #2) worth carrying into wugs-s12's own implementation-plan/review-dispatch instructions, given wugs-s12 is another removal story (DB table drop) in the same epic?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
