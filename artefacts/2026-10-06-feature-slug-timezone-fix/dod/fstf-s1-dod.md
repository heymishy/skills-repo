# Definition of Done: Generate the feature-slug date prefix in the operator's own saved timezone

**PR:** https://github.com/heymishy/skills-repo/pull/946 | **Merged:** 2026-10-06
**Story:** artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md
**Test plan:** artefacts/2026-10-06-feature-slug-timezone-fix/test-plans/fstf-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-06-feature-slug-timezone-fix/dor/fstf-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — set timezone shifts the computed date across a UTC/local boundary | ✅ | Direct unit test reproduces the exact real incident timestamp (`2026-10-04T23:09:29Z` → `2026-10-05` in `Pacific/Auckland`); a separate call-site integration test confirms `handlePostJourney` wires the same real helper output into the created journey's `featureSlug` | `integration-real-code` | None |
| AC2 — unset timezone / unresolved identity / no pool → unchanged UTC behaviour | ✅ | 4 dedicated tests: unset timezone, unresolved identity, null pool, empty identityKey — all assert identical output to `new Date().toISOString().slice(0,10)`; plus 8 pre-existing tests across both call sites re-run unchanged | `integration-real-code` + regression | None |
| AC3 — DB error during lookup never blocks journey creation | ✅ | Dedicated test: pool's `query` rejects, helper still returns the UTC fallback, no throw propagates | `integration-real-code` | None |
| AC4 — pre-existing slug-generation tests pass unchanged | ✅ | `tests/check-fsdn-s1-feature-slug-display-name.js` (7/7) + 7 other test files exercising `handlePostJourney`/`handlePostProductFeature` — all pass unchanged. Full suite: 718 files, only the pre-existing unrelated `discovery_approved` failure | `integration-real-code` (regression) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Duplicate-name detection (named Out of Scope), the `/settings` UI itself (`si-s2`, untouched), and retroactive remediation of the two already-existing duplicate `customer-journey-as-first-class` records were all correctly left out, as scoped.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8
**Tests passing in CI:** 8 / 8, plus full regression (718 files, only the pre-existing unrelated failure)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Returns local date, reproduces real incident timestamp (AC1) | ✅ | ✅ | |
| Falls back to UTC: timezone unset (AC2) | ✅ | ✅ | |
| Falls back to UTC: identity unresolved (AC2) | ✅ | ✅ | |
| Falls back to UTC: pool null (AC2) | ✅ | ✅ | |
| Falls back to UTC: identityKey empty (AC2) | ✅ | ✅ | |
| Falls back to UTC: query throws (AC3) | ✅ | ✅ | |
| Defaults to real current date with no injected date | ✅ | ✅ | |
| handlePostJourney call-site integration (AC1) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (Step 4):** No AC in this story was classified `CSS-layout-dependent` — pure backend date-computation fix, no rendered UI change.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — one additional lookup on the feature-creation path only | ✅ | Negligible, not a hot/high-frequency route; confirmed no change to full-suite run time pattern |
| Security — no new input surface | ✅ | Reads only the requesting operator's own already-authenticated identity's own saved preference |
| Reliability — fail-open, never fail-closed | ✅ | AC3's dedicated test confirms directly |

---

## Metric Signal

No formal benefit-metric moved (correctness fix). Real-world validity: this closes the exact root cause of the production incident investigated this session (two disconnected feature records for "customer journey as first class"). **Honest limit, stated plainly:** the operator's own `people.timezone` was confirmed unset at the time of the incident — this fix prevents a *recurrence* for any operator who has (or later sets) a saved timezone in `/settings`; it does not retroactively undo the specific incident already investigated, and an operator who never sets a timezone remains exposed to the same UTC-boundary class of bug. This was disclosed in the story's own Architecture Constraints before implementation, not discovered after the fact.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Two standing, explicitly named `/improve` candidates from the story's own Out of Scope, not started: (1) duplicate-feature-name detection/warning at creation time — a more general safeguard against this whole class of accidental duplicate, regardless of timezone; (2) retroactive remediation of the two already-existing duplicate `customer-journey-as-first-class` records — an explicit operator decision (delete, rename, or merge), not a code change.

---

## DoD Observations

1. **This story's own root-cause investigation required reading real production data directly** (`fly ssh console` running a small, read-only Node script against the app's own already-configured `DATABASE_URL` — the credential itself was never seen or extracted), after the UI itself (both the feature-index page and the aggregate `/journeys` list) proved insufficient to confirm the real cause. The `/journeys` list was independently found to be broken (every entry renders with a blank id and blank name) — a separate, real bug, not fixed by this story, not yet filed as its own tracked item.
2. This story's own operator conversation surfaced the incident starting from a single pasted URL with a one-character date typo in it — what looked at first like a possible data-loss report turned out to be a genuine but different bug (UTC-vs-local slug generation), confirmed only by going past the UI into the real underlying data. Recorded here as a reminder that a user-reported symptom and its real root cause are not always the same thing, even when the user's own diagnosis sounds plausible.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Generate the feature-slug date prefix in the operator's own saved timezone" (fstf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
