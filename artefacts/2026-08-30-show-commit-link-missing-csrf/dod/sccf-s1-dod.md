# Definition of Done: CSRF field on the live-injected gate-confirm form

**PR:** https://github.com/heymishy/skills-repo/pull/792 | **Merged:** 2026-08-30 (`21770d1ade505c5abc881818d1361bb2639d867a`)
**Story:** artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md
**Test plan:** artefacts/2026-08-30-show-commit-link-missing-csrf/test-plans/sccf-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-30-show-commit-link-missing-csrf/dor/sccf-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Rendered script declares `var CSRF_TOKEN = "<token>";` matching the session's real csrfToken | `tests/check-sccf-s1-show-commit-link-csrf-field.js` | None |
| AC2 | ✅ | `showCommitLink()`'s injected form references `CSRF_TOKEN` to build the `_csrf` field; old field-less pattern confirmed absent | Same file | None |
| AC3 | ✅ | Live-validated on `wuce-staging` post-deploy: a genuinely fresh journey (`868402d7`) whose discovery stage completed live during the initial streaming turn (confirmed via the button's distinguishing `font-size:14px` inline style, proving it was `showCommitLink()`'s injected copy, not the server-rendered one) submitted gate-confirm successfully on the first click — `POST .../gate-confirm` returned success, journey advanced to `benefit-metric` | Live browser reproduction (Chrome automation), same method that found the bug | None |
| AC4 | ✅ | `jgcc-s1`'s own test (regex-scoped fix applied), the 5 other chat-page-adjacent files, and the full suite (571/571) all pass | Full suite re-run | None |

---

## Scope Deviations

**One incidental fix included, correctly scoped:** `jgcc-s1`'s own test (`check-jgcc-s1-chat-gate-confirm-csrf-field.js`) needed a small regex-scoping correction — an unscoped match against the whole page could also match this story's new `CSRF_TOKEN`-referencing JS source text (a string literal, not real HTML) elsewhere on the same page. This is a direct, mechanical consequence of this story's own change landing on the same page as `jgcc-s1`'s test target, not scope creep — declared in the story's own PR description at implementation time.

---

## Test Plan Coverage

**Tests from plan implemented:** 4/4 ACs (AC1, AC2 unit; AC3 manual/live per the test plan's own declared coverage gap; AC4 regression).
**Tests passing in CI:** 6/6 new (`check-sccf-s1-show-commit-link-csrf-field.js`), 6/6 `jgcc-s1` (after the scoping fix), 5/5 other chat-page-adjacent files, 571/571 full suite.

**Gaps (tests not implemented):** AC3 was declared manual/live-only at test-plan time (the bug only manifests when a real browser executes the injected client-side JS against a real streaming response) — executed as planned, not deferred.

**Layout gap audit:** N/A.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| CSRF protection functions on the live-injected form | ✅ | AC2 (source) + AC3 (live behaviour) |
| No regression to the already-correct server-rendered path | ✅ | `jgcc-s1`'s own suite still passes |

---

## Metric Signal

No formal benefit-metric artefact — short-track. This is the actual resolution of the user's originally-reported production bug ("I just hit the forbidden error again, in prod... Doing a discovery, did clarify then when went to proceed threw the error"), confirmed end-to-end via live reproduction on the exact code path that was broken. Real signal: the same reproduction method that previously 403'd unconditionally now succeeds on a genuinely fresh journey with zero idle wait.

---

## Outcome

**COMPLETE**

**Follow-up actions (tracked, not deferred silently):**
1. Remove or reduce `csdl-s1`'s temporary diagnostic logging (tracked in `csdl-s1`'s own decisions.md and DoD — not yet scheduled as its own story).
2. A dedicated audit of every client-side `innerHTML`-injected form in `src/web-ui/` for the same missing-`_csrf`-field pattern — this is now the THIRD real CSRF-field gap found in one session (two separate code paths for the same button, plus `cptr-s1`'s distinct timing-race gap). Logged via `/capture` in this story's own commit; not yet scheduled as its own story.
3. Consider whether `showCommitLink()` and `_renderChatPage`'s server-rendered branch should share a single form-building helper, to prevent a fourth occurrence of "two render paths for the same element, only one gets fixed."

---

## DoD Observations

1. **This closes a real, user-reported production incident that took four short-track stories across one session to fully resolve** (`cptr-s1` real-but-unrelated hardening, `jgcc-s1` real-but-incomplete fix, `csdl-s1` diagnostic enabler, `sccf-s1` the actual remaining fix). The investigation's own pattern is itself the most valuable finding: every fix designed without first gathering direct evidence needed a follow-up correction; the one step preceded by real evidence (`csdl-s1`'s logging, then reading the real logs) identified the correct mechanism immediately.
2. **Two separate render paths existed for the same button, and a fix to one was reasonably (but incorrectly) assumed to cover both.** This is a concrete, low-cost architectural lesson: when a story fixes "the form for X," check whether X is rendered from more than one place before considering the fix complete. Follow-up #3 above proposes a structural prevention, not just a retrospective note.
3. **This is the 6th occurrence of the H-GOV short-track discovery-artefact gap** — same standing note as the two prior stories in this chain. Three consecutive stories in one session hitting the identical documented gap is a strong, repeated signal that the `/definition-of-ready` SKILL.md revision should happen before the next short-track story, not after a 7th occurrence.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for CSRF field on the live-injected gate-confirm form (sccf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is AC3's live-validation evidence specific enough to trust (does it clearly distinguish the server-rendered path from the client-injected path it's meant to test)?
3. Are all three follow-up actions (remove csdl-s1 logging, broader CSRF audit, shared form-builder consideration) tracked with enough specificity that they won't be forgotten, or has any of them since been scheduled?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
5. Given this is the 6th H-GOV gap occurrence across three consecutive stories, should the SKILL.md revision now be treated as blocking for the next short-track story rather than advisory?
Report findings as HIGH / MEDIUM / LOW.
```
