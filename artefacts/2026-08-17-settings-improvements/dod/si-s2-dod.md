# Definition of Done: Add a timezone and date-format preference to Settings

**PR:** https://github.com/heymishy/skills-repo/pull/748 | **Merged:** 2026-08-17
**Story:** artefacts/2026-08-17-settings-improvements/stories/si-s2-locale-preference.md
**Test plan:** artefacts/2026-08-17-settings-improvements/test-plans/si-s2-test-plan.md
**DoR artefact:** artefacts/2026-08-17-settings-improvements/dor/si-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: form renders sensible non-blank defaults when unset | ✅ | `AC1` in `check-si-s2-locale-preference.js` | Automated test, re-run fresh on current master 2026-08-17 | None |
| AC2: valid submit persists to `people` table via `resolvePersonForIdentity` | ✅ | `AC2` | Automated test, re-run fresh 2026-08-17 | None |
| AC3: reload pre-populates saved values, not defaults | ✅ | `AC3` | Automated test, re-run fresh 2026-08-17 | None |
| AC4: invalid/empty timezone rejected with 400, no partial write | ✅ | `AC4` (2 cases: invalid, empty) | Automated test, re-run fresh 2026-08-17 | None |
| AC5: null person resolution rejected cleanly, not a crash | ✅ | `AC5` | Automated test, re-run fresh 2026-08-17 | None |
| AC6: successful save fires a new PostHog event | ✅ | `AC6` | Automated test, re-run fresh 2026-08-17 | None |

10/10 tests re-run fresh on current master (post-merge, post-si-s1-merge). The sibling regression fix (`check-c2-billing-tab.js`, narrowed to Billing-panel scope) re-run clean: 11/11.

Live-verified on `wuce-staging.fly.dev` 2026-08-17 (Chrome, signed in via GitHub OAuth): the locale preference form ("Locale preferences" section, Timezone dropdown) is visibly present on the Profile tab.

---

## Scope Deviations

**One documented, necessary fix outside the original DoR contract's file list:** `tests/check-c2-billing-tab.js` had a pre-existing assertion that was accidentally page-wide instead of Billing-panel-scoped. si-s2's new locale form (always-present CSRF field, per its own architecture) broke that over-broad assertion. Narrowed the assertion to match its own stated intent (protecting against unnecessary CSRF surface on the Billing tab specifically) rather than working around it — logged in `decisions.md` (2026-08-17).

**Concurrent-delivery merge conflict (see si-s1's DoD for full detail):** si-s1's branch, created before si-s2 merged, had genuine code conflicts with si-s2's changes to the same functions (`renderProfileTab`, `handleGetSettings`, `server.js`'s route table). Resolved on si-s1's side by merging master and combining both features' additions — si-s2's own merge was unaffected (si-s2 merged first, cleanly, with no conflicts of its own).

---

## Test Plan Coverage

**Tests from plan implemented:** 9/9 (plus 1 extra AC4 edge-case test — empty-string timezone, beyond the plan's single invalid-timezone case)
**Tests passing in CI:** 10/10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (defaults when unset) | ✅ | ✅ | |
| AC2 (valid submit persists) | ✅ | ✅ | |
| AC3 (reload pre-populates) | ✅ | ✅ | |
| AC4 (invalid timezone rejected) | ✅ | ✅ | |
| AC4 (empty timezone rejected) | ✅ (extra, not in plan) | ✅ | |
| AC5 (null person resolution) | ✅ | ✅ | |
| AC6 (PostHog event) | ✅ | ✅ | |
| NFR: server-side timezone allowlist | ✅ | ✅ | |
| NFR: no unescaped value in rendered form | ✅ | ✅ | |
| NFR: save completes under 1 second | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: save < 1 second | ✅ | NFR test, re-run fresh, passing |
| Security: server-side IANA timezone allowlist validation | ✅ | NFR test against a range of invalid inputs, re-run fresh, passing |
| Security: `escHtml()` applied to any re-displayed saved value | ✅ | NFR test confirms no unescaped value in rendered form output |
| Accessibility: keyboard-navigable, labelled form selectors | ✅ | Confirmed via code review of `renderLocaleForm` markup structure |
| Audit: none identified | ✅ | Low-sensitivity personal preference, not security/compliance-relevant |

---

## Metric Signal

**Locale preference adoption (m1)**
Signal: not-yet-measured
Evidence note: The feature (and its PostHog event) is now live on staging as of 2026-08-17, but no real usage window has elapsed yet. Adoption cannot be measured until real signed-in users interact with the feature in production.
Date measured: null

**Original beta-reported friction resolved (m3)**
Signal: not-yet-measured
Evidence note: Same as recorded in si-s1's DoD — this metric requires all 3 stories plus a beta-user follow-up confirmation. si-s2 is merged; si-s1 is merged; si-s3 is still open.
Date measured: null

`contributingStories` for m1 and m3 updated to include `si-s2` (see State update below).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None beyond the shared si-s1 follow-ups already recorded on that story's own DoD (m2 baseline-target gap, AC4-pattern review) — not applicable to si-s2 directly.

---

## DoD Observations

1. **ADR-026 reuse-check correction caught and fixed before merge, not after**: the original `/definition` draft targeted the wrong table (`users` instead of `people`); `/review` run 1 caught it (finding 1-H1), the story was corrected, run 2 passed clean. This is exactly the review discipline this repo's own ADR-026 exists to enforce, working as designed.
2. **Fake-pool test data strategy (per `test-plan.md`'s Seeded database / fake pool choice) held up well**: all 6 ACs, including the two edge cases (invalid timezone, null person resolution), were fully testable pre-implementation without needing real Postgres — no test-data gaps surfaced during implementation.
3. Same cross-story concurrent-conflict pattern noted on si-s1's DoD — recorded there in full detail to avoid duplication.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for si-s2 (locale preference).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
