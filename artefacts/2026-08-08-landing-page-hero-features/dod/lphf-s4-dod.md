# Definition of Done: Self-improving harness hero card

**PR:** https://github.com/heymishy/skills-repo/pull/686 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s4-self-improving-harness-hero-card.md
**Test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s4-test-plan.md
**DoR artefact:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s4-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (real, non-invented count of `workspace/learnings.md` entries) | ❌ | Live check of https://wuce-staging.fly.dev/ on 2026-08-09: the hero card renders **"0 and counting"**. `learnings-count.js`'s `fs.readFileSync` on `workspace/learnings.md` never succeeds in the deployed environment (`workspace/` is not part of the Docker image — confirmed by direct Dockerfile inspection during the `lccf-s1` incident), so the fail-open fallback value (`0`, added by `lccf-s1` on 2026-08-08 to stop a server crash) is what's actually displayed | live production check | **Real, confirmed gap.** `0` is exactly the kind of "invented/fallback figure" AC1 explicitly prohibits — the crash is fixed, but the AC's real intent (a real, non-invented number) is not met. |
| AC2 (copy doesn't imply live-updating) | ✅ | Copy states the count "and counting," consistent with the story's static-snapshot framing | code review | None |
| AC3 (names the human-review gate explicitly) | ✅ | Copy states "Every proposed improvement is gated by human review before it ships" | automated test + code review | None |
| AC4 (readable at 320px/1280px) | ✅ | `tests/e2e/lphf-s4-*.spec.js` — real Playwright E2E, passing on PR #686 before merge | E2E test (DoR: "covered by real E2E test") | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. AC1 is a genuine failure, discovered live during this DoD assessment — not previously known at merge time, since `lccf-s1`'s crash-fix (which is what actually causes the `0` value) shipped 8 days after this story merged.

---

## Scope Deviations

None. Live-updating the count and improvement-agent-specific metrics were both correctly excluded per Out of Scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 (all still pass — the test suite exercises `getLearningsCount()` against a real, present `workspace/learnings.md` file in the test/CI environment, which is why this gap was never caught by automated tests: the deployed *production* environment's file-absence is the actual trigger, and no test in this story's own plan or `lccf-s1`'s exercises that exact combination against a live deploy)

**Gaps (tests not implemented):** None missing from the plan as written — but the plan (reasonably, at the time) had no way to catch a deploy-environment-specific gap like this, since `workspace/` not shipping to the Docker image wasn't known until the `lccf-s1` incident 8 days later.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Static content at request time (though the underlying count computation depends on a file read that fails in production, per AC1 above) |
| Security | ✅ | No credentials/PII |
| Accessibility | ✅ | AC4 closed via real E2E automation |

---

## Metric Signal

**Metric 1 — Signup conversion rate**
Signal: not-yet-measured
Evidence note: No real-visitor traffic data reviewed yet since launch (2026-08-08); baseline pull and 4-week review not yet due.
Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Owner: next session.** Create a short-track story to fix the real root cause behind AC1's current failure — e.g. bundle `workspace/learnings.md` into the deploy image (if appropriate), or compute the count at build/deploy time and bake it into the served HTML rather than relying on a runtime file read that structurally cannot succeed in the deployed environment. Operator confirmed this resolution path (create a follow-up story) on 2026-08-09. This is a different, more durable fix than `lccf-s1`'s fail-open safety net, which correctly prioritized stopping the crash but was never intended as the permanent answer to "what number does this card show."

---

## DoD Observations

1. **A cross-story regression, only visible by checking production directly — a strong argument for DoD's "verify against the merged/deployed state" discipline, not just re-reading test output.** This story's own test suite still passes 4/4 today; the gap only exists in the gap between "what the tests exercise" (a present file) and "what production actually has" (an absent file, permanently, by deploy-image design). No test failure would ever have surfaced this — only a live check against the real deployed environment did.
2. **This is a direct, foreseeable consequence of `lccf-s1`'s own fail-open fix**, built earlier in this same session. `lccf-s1`'s own DoD (assessed separately) correctly scoped itself to the availability fix and didn't claim to fix this display-correctness question — but the connection between the two is worth stating plainly here: fixing the crash necessarily meant *some* value had to be shown when the file is absent, and `0` was the pragmatic emergency choice, not a considered answer to "what should this card show when the real count can't be read." That's exactly what the new follow-up story needs to resolve properly.
