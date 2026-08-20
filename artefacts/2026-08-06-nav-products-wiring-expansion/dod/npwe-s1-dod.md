# Definition of Done: Show the Products sidebar during skill chat sessions

**PR:** #673 (commit `394b455e`) — note: the task brief supplied for this backlog pass cited PR #747, but PR #747 is `bse-s1`'s billing-settings error banner fix, an unrelated story. Git history confirms npwe-s1 merged as PR #673 ("npwe-s1: Wire Products nav into skill-chat sessions (13 skills.js call sites) (#673)").
**Merged:** 2026-08-06 (confirmed via `git show 394b455e`; post-merge bookkeeping commit `7d809c8c` same date)
**Story:** artefacts/2026-08-06-nav-products-wiring-expansion/stories/npwe-s1-wire-products-nav-into-skill-chat-sessions.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — Products sidebar visible + active product highlighted on all 6 in-scope page types | Yes | `tests/check-npwe-s1-skills-nav-wiring.js`: U1.1/U1.2 (Run a Skill list), U2.1/U2.2 (question page), U3.1/U3.2 (chat page), U4.1/U4.2 (commit preview), U5.1/U5.2 (commit complete, via `handleGetResultHtml`), U6.1/U6.2 (draft complete) — all pass | Automated unit tests (string/DOM-class assertions on rendered HTML) | Test plan named "commit complete" as `handlePostCommitHtml`'s response; implementation tested the real render path (`handleGetResultHtml`, GET `/result`) instead, since the POST handler's success path is a redirect with no body. Documented inline in the test file (lines 188–192) — a correction of the test plan's wording, not a coverage gap. |
| AC2 — Product continuity across wired → newly-wired page transition | Yes | `IT1.1`/`IT1.2` — asserts `skills.js`'s resolved `activeProductId` equals the exact `productId` string the already-wired pages (`products.js`, `journey.js`) use for the same product, per the shared `html-shell.js` contract | Automated integration test | Test plan named `journey.js`'s `handleGetJourney` as the literal comparison handler, but that handler's `activeProductId` is definitionally always null (the "no product" bucket page) and can't demonstrate continuity for a product-bearing journey. The test instead proves the contract match directly against the wired pages' known convention — documented inline (lines 242–255). Same category of deviation as AC1: a corrected test target, not a missing test. |
| AC3 — "No product" bucket shown as active | Yes | `U7.1`/`U7.2`/`U7.3` — "No product" row active, both fixture product rows correctly inactive | Automated unit test | None |
| AC4 — ~50 out-of-scope call sites remain byte-for-byte unchanged | Yes (with documented, story-external scope narrowing) | `IT2.1` — `git diff origin/master` against the excluded route files is empty; `IT2.2`/`IT2.3` — `settings.js`'s render is deterministic and still emits no Products section | Automated diff + render-determinism test | The excluded-files list in the live test (`journey.js`, `features.js`, `dashboard.js`, `admin-credits.js`, `admin-mock-gateway.js`) no longer includes `routes/artefact.js` or `routes/settings.js`, both removed per later, unrelated stories (`avpf-s1`, `bse-s1`) that legitimately touched those files for unconnected fixes. This is a post-merge test-file maintenance change, documented in the test file itself (lines 278–292), not a defect in npwe-s1's own delivery. |

---

## Scope Deviations

None beyond the story's own explicitly-declared "Out of Scope" list (journey sub-pages, artefact viewer, legacy artefact index, admin pages, settings — all deferred by design, not defects). The two AC1/AC2 test-target corrections above are documented, honest adjustments to match the real code shape, not scope creep or gaps. The AC4 excluded-files-list maintenance (removing `artefact.js`/`settings.js` from the freeze list) reflects later, unrelated stories touching those files — not a regression in this story's own scope boundary.

---

## Test Plan Coverage

`tests/check-npwe-s1-skills-nav-wiring.js` — **21 passed, 0 failed** (re-run this session, 2026-08-20, against current master). This supersedes the "null passed, null failed" figure supplied in the task brief for this backlog pass, which reflects a broken result-capture step rather than an actual test failure — the script runs cleanly and exits 0. Covers all 4 ACs (U1–U7 for AC1/AC3, IT1 for AC2, IT2 for AC4) plus the Performance NFR (NFR1). The test plan's separately-described manual verification script (`npwe-s1-verification.md`) remains an unchecked template (all scenario checkboxes blank) — its domain-expert review was explicitly RISK-ACCEPTed at DoR (decisions.md, 2026-08-06, W4) rather than completed, which is an accepted deviation, not a gap discovered now.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (no new N+1 query pattern) | Met | `NFR1.1` asserts `getProductsNavSummary`'s products query runs exactly once per render |
| Security (no new data exposure) | Met — unchanged | Reuses existing tenant-scoped lookup; no new test needed per story text |
| Accessibility (reuses existing `aria-label="Products"` markup) | Met — unchanged | Verbatim reuse, no new markup introduced |
| Audit | N/A | Story states not applicable — read-only sidebar addition |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — it is short-track (`/test-plan → /definition-of-ready → coding agent`), which skips `/benefit-metric` by design. The story's stated benefit ("navigation continuity during active skill sessions") is an operational UX improvement tied directly to an operator-reported pattern (2026-08-06) and the revisit trigger explicitly named in `2026-07-30-product-aware-navigation/decisions.md`. No quantitative metric was defined or is being tracked for this change.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None required for this story's own scope. The story's own text names a natural follow-on (the remaining ~50 unwired call sites: journey sub-pages, artefact viewer, admin, settings) as a candidate future story, not a defect of this one.

---

## DoD Observations

Shipped 2026-08-06 and stable in master for two weeks with no reported regression; two later, unrelated stories (`avpf-s1`, `bse-s1`) touched files this story's own regression test originally froze, and the test file was correctly updated in place rather than left to falsely fail. The task brief's PR number (#747) was incorrect for this story — verified and corrected above against git history (actual: #673).
