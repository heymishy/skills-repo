## Test Plan: The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion

**Story reference:** artefacts/2026-09-11-journey-gate-live-completion-sticky-gap/stories/jgls-s1-fix-live-completion-gate-not-sticky.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `showCommitLink()`'s wrap element gets sticky positioning | 1 test | — | — | Live Chrome smoke check (staging) | CSS-layout-dependent, RISK-ACCEPT (see below) | 🟡 |
| AC2 (regression guard) | Existing content/layout properties of the wrap unaffected | 1 test | — | — | — | — | 🟢 |
| AC3 (consistency guard) | Both style strings agree on positioning-relevant properties | 1 test | — | — | — | — | 🟢 |

**CSS-layout-dependent classification (B2):** AC1 is CSS-layout-dependent (real browser sticky-scroll rendering, not reproducible by string assertion alone at the "does it visually stick" level). Classified as **RISK-ACCEPT + manual smoke test**, not an automated Playwright visual regression test — see `decisions.md`. Rationale: the actual mechanism (`position:sticky`) is identical, byte-for-byte, to the one `wnl-s2` already shipped and verified correct via its own Playwright E2E spec (`tests/e2e/wnl-s2-journey-gate-sticky.spec.js`, AC1/AC3/AC5 — sticky-scroll behaviour under the browser's real layout engine) — that spec already proves `position:sticky;bottom:0` works correctly in this exact codebase's rendering context. This story's only real risk is whether the *string* was correctly added to the *second* location, which a unit test on the raw string fully covers; a second, slow, live-turn-driven Playwright spec to re-prove the same CSS mechanism already proven elsewhere would add disproportionate test complexity (seeding a not-yet-done session and reliably waiting for a live LLM/mock-gateway turn to complete in CI) for no material verification gain over a direct string assertion plus a manual post-deploy smoke check.

---

## Coverage gaps

None beyond the RISK-ACCEPT above — AC1's actual mechanism is already proven by `wnl-s2`'s own existing E2E suite; this story adds the missing unit-level string coverage plus a manual live-smoke confirmation.

---

## Test Data Strategy

**Source:** None required — all three tests operate on the served page's raw HTML/script source (string-level assertions), not seeded application data.
**PCI/sensitivity in scope:** No.
**Availability:** N/A.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A rendered chat page HTML string for a session with `done: false` and `journeyId` set (so `showCommitLink`'s definition is embedded in the served `<script>`) | `_setHtmlSession` (existing test helper, in-process) | None | |
| AC2 | Same as AC1 | Same | None | |
| AC3 | Raw `skills.js` source file content | `fs.readFileSync` on the module file itself | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### showCommitLink-wrap-gets-sticky-positioning

- **Verifies:** AC1
- **Precondition:** A skill chat session rendered via `handleGetChatHtml` (or equivalent) with `journeyId` set.
- **Action:** Extract the `showCommitLink` function body from the rendered page's embedded `<script>` content (string search/regex on the served HTML). Locate the `wrap.style.cssText` assignment.
- **Expected result:** The `wrap.style.cssText` string contains `position:sticky`, `bottom:0`, `background:var(--bg)`, `border-top:1px solid var(--line)`, and `z-index:500`.
- **Edge case:** No — this is the primary regression case (must currently FAIL against the unmodified code).

### showCommitLink-wrap-existing-properties-unchanged

- **Verifies:** AC2
- **Precondition:** Same as above.
- **Action:** Same extraction as AC1's test.
- **Expected result:** The `wrap.style.cssText` string still contains the pre-existing `padding:10px 12px 2px`, `display:flex`, `align-items:center`, `gap:10px`, and `flex-wrap:wrap` — unchanged by this fix.
- **Edge case:** No.

### journey-gate-style-strings-agree-on-positioning

- **Verifies:** AC3
- **Precondition:** None — reads `src/web-ui/routes/skills.js` directly from disk.
- **Action:** Read the file source. Extract (a) the `.sw-journey-gate` div's inline `style` string from `journeyPanel`'s construction and (b) `showCommitLink()`'s `wrap.style.cssText` string. Compare the positioning-relevant substring (`position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500`) between both.
- **Expected result:** Both strings contain the identical positioning substring.
- **Edge case:** No — this is the consistency guard designed to catch exactly this class of bug (one path fixed, the other silently left behind) in the future.

---

## E2E Tests

None. See CSS-layout-dependent classification above — `wnl-s2`'s own existing Playwright suite already proves `position:sticky;bottom:0` renders correctly under this codebase's real browser layout in the server-rendered path; this story's fix applies the identical, already-proven CSS mechanism to a second code path, verified here at the string level plus a manual live smoke check post-deploy.

---

## NFR Tests

None — this story's NFR section states "None material" for Performance/Security/Availability; Accessibility is covered by AC2's own assertion that the existing form/button markup is unaffected.

---

## Out of Scope for This Test Plan

- A live-turn-driven Playwright spec exercising the actual `/resume` → live-completion → sticky-scroll flow end to end — covered by the RISK-ACCEPT above; the underlying CSS mechanism is already proven by `wnl-s2`'s own E2E suite.
- Any test of `wnl-s1` or `wnl-s3` — both independently confirmed correct during the same live verification pass that found this story's bug; no code in this story touches either.
- Refactoring the two gate-rendering paths into one shared function — out of scope for this story (see story's Out of Scope section).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| No automated E2E proving the live-completion path visually sticks under real browser scroll | Seeding a not-yet-done session and reliably waiting for a live LLM/mock-gateway turn to complete adds CI complexity and flake risk disproportionate to what's actually being verified — the CSS mechanism itself is already proven by `wnl-s2`'s own E2E suite | Post-deploy live Chrome smoke check on staging (same method used to originally find this bug), recorded in the DoD artefact; RISK-ACCEPT logged in `decisions.md` before implementation begins |
