# Definition of Done: Connect a repo by picking from your own accessible repos

**PR:** https://github.com/heymishy/skills-repo/pull/671 | **Merged:** 2026-08-06
**Story:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Test plan:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s2-test-plan.md
**Verification script:** artefacts/2026-08-06-multi-tenant-repo-resolution/verification-scripts/mtrr-s2-verification.md
**Review:** artefacts/2026-08-06-multi-tenant-repo-resolution/review/mtrr-s2-review-1.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — operator sees a list of their own accessible repos as the primary path, not a bare URL field | ✅ | `check-mtrr-s2-repo-connection-picker.js`, "AC1+AC2 (integration): load -> select -> persist..." | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — selecting a repo populates the same `prc-s1.1` columns the URL-entry flow would have written | ✅ | Same test | Automated test, re-run fresh | None |
| AC3 — rate-limiting/OAuth-scope failure falls back to URL-entry with a clear message, operator never stuck | ✅ | Same file, "AC3: rate-limit/scope/network failure falls back to the URL-entry field with a message" | Automated test, re-run fresh | None |
| AC4 — a large repo list supports search/filter | ✅ | Same file, "AC4: search/filter narrows a large repo list correctly and case-insensitively" | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. Story's own Out of Scope items (new repo-creation flow, export-endpoint resolution logic) remain correctly excluded — the latter is `mtrr-s1`, its own sibling story in this same 2-story cluster, both DoDs written together in this session pass.

---

## Test Plan Coverage

**Tests passing:** 6/6 (`check-mtrr-s2-repo-connection-picker.js`), re-run fresh 2026-08-17 — matches the test-plan's originally-recorded 6/6 exactly, no drift.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: repo list loads within 2s, cached within a session (no repeat GitHub API call per render) | ✅ | "NFR (Performance): repo list is cached within a session -- a second render does not re-call the GitHub API, both complete under 2 seconds", re-run fresh, passing |
| Accessibility: WCAG 2.1 AA hard floor | ✅ | **Verified live (2026-09-12).** Source review: `repo-picker.js`/`products.js` use native `<input>`/`<button>` elements throughout, proper `aria-label`s, `role="listbox"`/`role="status"`, no custom ARIA widget that could trap focus. Live-Chrome confirmation on `wuce-staging.fly.dev`: the picker rendered with the operator's real accessible GitHub repos (AC1), typing "skills-repo" into the real search box live-filtered the list to the correct 2 matches via a real `oninput` handler (AC4), and "Enter a repo URL instead" toggled the manual fallback panel open live (`rpcShowConnectForm()`, AC3-adjacent). |
| Security: no change to credential handling beyond existing GitHub OAuth login | ✅ | Story's own framing — additive UI path only, no new credential surface |

---

## Metric Signal

**Metric:** Repo-connection setup experience — baseline "bare URL-entry form, no guidance," target "pick from accessible repos."
**Status:** Directly achieved by construction (AC1) — no fresh production-usage measurement taken in this pass.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required.

---

## DoD Observations

1. ~11 days live in production, no incidents reported.
2. Closes the 2-story `2026-08-06-multi-tenant-repo-resolution` cluster (`mtrr-s1`/`mtrr-s2`, both DoDs written in this same session pass) — this was the last remaining multi-story cluster in the current backlog scan; all subsequent stories are single-story features.
3. **Re-verified live (2026-09-12), prompted by a broader session-wide DoD-triage sweep flagging the "not independently re-verified visually" accessibility caveat.** Real live-Chrome verification against `wuce-staging.fly.dev`, using a real throwaway product created to reach the repo-connect step (no existing product had zero repo connected) — see the Accessibility NFR row above for the full evidence. **Incident:** cleaning up the throwaway probe product ("mtrr-s2 live-verify probe") triggered a native browser `confirm()` dialog on "Delete product", which froze the tab per this tooling's known limitation (JS dialogs block all further browser automation). Recovered by closing the tab rather than forcing the dialog through. The probe product was **not deleted** and remains in the org — flagged for the operator to remove manually if wanted.
