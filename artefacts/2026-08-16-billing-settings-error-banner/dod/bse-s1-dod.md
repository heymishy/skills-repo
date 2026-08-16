# Definition of Done: Show a visible error banner on Settings when a billing-portal redirect carries an error

**PR:** https://github.com/heymishy/skills-repo/pull/747 | **Merged:** 2026-08-16
**Story:** artefacts/2026-08-16-billing-settings-error-banner/stories/bse-s1-billing-settings-error-banner.md
**Test plan:** artefacts/2026-08-16-billing-settings-error-banner/test-plans/bse-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-16-billing-settings-error-banner/dor/bse-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: `no_billing_account` error shows a banner with specific, honest text | ✅ | `AC1` in `check-bse-s1-billing-settings-error-banner.js` | Automated test, re-run fresh 2026-08-16 | None |
| AC2: `billing_unavailable` error shows a banner with specific, honest text | ✅ | `AC2` | Automated test, re-run fresh 2026-08-16 | None |
| AC3: no error param → no banner; unrecognized/adversarial param → no banner, no raw-value reflection | ✅ | Two `AC3` cases | Automated test, re-run fresh 2026-08-16 | None |
| AC4: Billing and Credits tab error banners are structurally isolated | ✅ | `AC4` + `renderBillingTab` markup-shape test | Automated test, re-run fresh 2026-08-16 | None |

7/7 tests re-run fresh on current master, plus the existing `check-npwe-s1-skills-nav-wiring.js` suite (21/21) re-verified — including its own IT2.2/IT2.3 checks, which still pass even though the byte-freeze diff on `settings.js` was correctly removed (see Scope Deviations).

---

## Scope Deviations

**One documented, necessary touch outside the original DoR contract's file list:** `tests/check-npwe-s1-skills-nav-wiring.js` (an unrelated sibling story's own test) asserted `settings.js` stayed byte-identical to `origin/master` as a scope-freeze guard. This story's own legitimate change to `settings.js` broke that assertion. Fixed forward by removing `settings.js` from that test's `EXCLUDED_FILES` freeze list — verified against a real, already-established precedent in the same file for `routes/artefact.js` (`avpf-s1`, confirmed via `git log`), not invented fresh. The test's actually-meaningful checks (determinism, no-Products-section) were left unmodified and still pass. Logged as a CORRECTION in `decisions.md` at implementation time.

`git show --stat` on the merge commit confirms exactly `settings.js`, the new test file, and the one sibling test correction were touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 7/7
**Tests passing in CI:** 7/7 (plus 21/21 on the corrected sibling suite)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `renderBillingTab` embeds error banner when `opts.errorMessage` set | ✅ | ✅ | Markup-shape precondition test |
| AC1 (`no_billing_account`) | ✅ | ✅ | |
| AC2 (`billing_unavailable`) | ✅ | ✅ | |
| AC3 (no param → no banner) | ✅ | ✅ | |
| AC3 (adversarial param → no reflection) | ✅ | ✅ | Explicit XSS-style payload tested, confirmed not reflected raw |
| AC4 (banner isolation, admin user) | ✅ | ✅ | |
| Existing 2-arg `renderBillingTab` call sites unaffected | ✅ | ✅ | Regression guard for the function signature change |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: user-controlled `?error=` query parameter must never be reflected raw into page HTML | ✅ | AC3 adversarial-payload test; guardrail `billing-settings-error-banner-security` (`category: "nfr"`) recorded `status: "met"` |

---

## Metric Signal

This closes the gap identified in `artefacts/feedback/beta-006.md` — a real, operator-validated finding from a live staging check that `bpe-s1`'s own fix redirected silently with no visible feedback. No formal benefit-metric artefact for this short-track story. Recommend a follow-up live check (same pattern as `beta-006`'s own validation) to confirm the banner now actually renders on staging as expected.

---

## Outcome

**COMPLETE**

**Follow-up actions:** [Owner: Hamish King] Live-check "Manage billing" on staging again (same steps as `beta-006`'s original validation) to confirm the new banner actually renders with the expected message, closing the loop on the original operator-reported finding.

---

## DoD Observations

1. Direct, traceable closure of an operator-reported gap: live Chrome check on `bpe-s1`'s own merged fix → root-caused to a missing query-string parse → reused an existing in-file banner pattern rather than inventing a new one → `beta-006.md` triage → dispatched short-track story → merged fix, all within the same session.
2. **Notable, correctly-handled edge case:** this dispatch modified an *existing* test file's own scope-freeze assertion, a higher-risk class of change than adding a new test. The operator independently verified this before trusting it — confirmed the cited precedent (`avpf-s1`/`routes/artefact.js`) was real via `git log`, and confirmed the actually-meaningful assertions (determinism, no-Products-section) were left untouched. This is exactly the level of scrutiny CLAUDE.md's "verify coding-agent dispatch completion independently" guidance calls for, applied correctly here with a clean result (no issue found, just verified).
3. This dispatch also hit the same `skills.js` git-auto-commit side effect already documented in personal session memory (a full-suite `npm test` run triggering real, bogus commits mid-run) — handled per the already-known pattern (`git reset --soft`, re-commit with a correct message, verify content integrity first).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for bse-s1 (billing settings error banner).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
