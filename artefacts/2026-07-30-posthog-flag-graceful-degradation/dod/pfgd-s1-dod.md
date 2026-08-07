# Definition of Done: Degrade gracefully when the PostHog flags adapter is unwired, instead of 500ing every gated page

**PR:** https://github.com/heymishy/skills-repo/pull/650 | **Merged:** 2026-07-30
**Story:** artefacts/2026-07-30-posthog-flag-graceful-degradation/stories/pfgd-s1-posthog-flag-graceful-degradation.md
**Test plan:** artefacts/2026-07-30-posthog-flag-graceful-degradation/test-plans/pfgd-s1-test-plan.md
**DoR artefact:** artefacts/2026-07-30-posthog-flag-graceful-degradation/dor/pfgd-s1-dor.md
**Assessed by:** Claude (agent-authored)
**Date:** 2026-08-04

**Note:** Short-track story (bug fix). Per CLAUDE.md, short-track skips discovery through review but DoD still applies — this artefact closes a gap where no short-track story in this repo's history had previously reached DoD before merging.

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: unwired adapter -> isEnabledOrDefault resolves false` | automated test | None |
| AC2 | ✅ | `AC2: isEnabled() (not the wrapper) still rejects when unwired` | automated test | None |
| AC3 | ✅ | `AC3/AC4: wired adapter resolving true/false -> isEnabledOrDefault resolves the real result` | automated test | None |
| AC4 | ✅ | `AC5: wired adapter throwing -> isEnabledOrDefault resolves false, does not reject` (test file's own AC5 label maps to the story's AC4 — a numbering offset in the test file, not a coverage gap; the story's AC4 "adapter's own call throws" case is the one covered) | automated test | Test-file AC numbering is offset by one from the story's own AC numbering starting here — cosmetic only, confirmed by reading both directly, not a coverage gap |
| AC5 | ✅ | Direct source-grep confirms all 5 named call sites (`products.js` ×2, `impersonation.js` ×2, `settings.js` ×1) call `isEnabledOrDefault`, not `isEnabled` | code review (grep) | None |
| AC6 (regression guard) | ✅ | All 5 named existing test files independently re-run: `check-psh-s6-product-kanban.js` (7/7), `check-psh-s7-org-kanban.js` (7/7), `check-d1-start-impersonation-session.js` (23/23), `check-d2-banner-exit-permission-visibility.js` (24/24), `check-d4-nfr-security-review-and-hardening.js` (23/23) | automated test, independently re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 4 items in the story's Out of Scope section (setting the actual Fly secret, the sidebar observation ruled out as intentional design, `posthog-config.js` changes, auditing other D37 adapters for the same gap) were correctly left untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: unwired adapter -> isEnabledOrDefault resolves false | ✅ | ✅ | |
| AC2: isEnabled() still rejects when unwired | ✅ | ✅ | |
| AC3: wired adapter resolving true -> real result | ✅ | ✅ | |
| AC4: wired adapter resolving false -> real result | ✅ | ✅ | |
| AC5 (test label): wired adapter throwing -> resolves false | ✅ | ✅ | |

Independently re-confirmed on master (2026-08-04): 5/5 passing.

**Gaps (tests not implemented):**
None automated for AC5 (call-site audit) — verified by direct source review instead, which is an appropriate verification method for "was every call site switched," not a gap.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible added cost | ✅ | One additional try/catch, only on the already-rare unwired/failing path |
| Security — no new data exposed | ✅ | Safe-default `false` matches the existing "flag disabled" treatment |
| Accessibility — not applicable | ✅ | Confirmed no UI change |
| Audit — misconfiguration remains visible via console.error | ✅ | Confirmed in `isEnabledOrDefault`'s implementation |

---

## Metric Signal

No feature-level metrics defined for this story (short-track bug fix, no `benefit-metric.md`). Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None blocking. The story's own Out of Scope section names one legitimate `/improve` candidate: auditing every other D37-injectable adapter in this codebase for the same "stub throws, but no caller-level resilience" gap this story fixed for `posthog-flags.js` specifically.

---

## DoD Observations

1. **This was a real production incident fix-forward, not a hypothetical hardening pass** — the story's own Background section documents that `promote-to-prod` had just run successfully when `/settings` and `/org/kanban` started 500ing in production, traced to `POSTHOG_KEY_PROD` never being set as a Fly secret. Both underlying pieces (`initPostHogFlagsClient`'s refusal to wire without the key, and `isEnabled()`'s D37 throw-when-unwired contract) were each working exactly as designed individually — the gap was that no caller was resilient to their combination. This is a good, concrete example of two independently-correct D37 contracts composing into an unintended failure mode; worth keeping as a reference case if this pattern is discussed again.
2. This story sat at `prStatus: merged` with no `dodStatus` at all for several days before this DoD pass — confirming the exact gap CLAUDE.md's own short-track section describes ("no short-track story in this repo's history had ever reached DoD"). Found only because the operator explicitly asked for a review of everything in flight, not because any pipeline gate caught it. Candidate `/improve` signal: consider whether `/workflow`'s reconciliation pass should specifically surface merged-but-DoD-incomplete short-track stories, since they don't show up in the epic-nested story sweep the way standard-track stories do.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Degrade gracefully when the PostHog flags adapter is unwired".
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Are any scope deviations or follow-up actions that should block release not flagged?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
