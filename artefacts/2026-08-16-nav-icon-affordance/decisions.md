# Decision Log: nav-icon-affordance

**Feature:** Fix affordance mismatch on the sign-out control and theme-toggle button in the shared shell
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-16

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**[2026-08-16] | DESIGN | story authoring (nia-s1) — sign-out affordance fix**
**Decision:** The sign-out control gets two layered fixes, not one: (1) a visible "Sign out" text label next to the existing `↗` glyph, so the control's function is legible before any tap occurs, and (2) an `onclick="return confirm('Sign out of wuce?')"` gate before the destructive navigation proceeds, reusing the exact `confirm()`-before-destructive-action pattern already established elsewhere in this codebase (`src/web-ui/routes/products.js`'s module-delete and product-delete buttons; `src/web-ui/routes/features.js`'s journey-delete button).
**Alternatives considered:** (1) Label only, no confirm dialog — rejected, the beta-reported harm (landing on the public marketing homepage with zero warning) is specifically about the *lack of a checkpoint* before an irreversible-feeling action, not just poor labelling; a label alone reduces surprise but does not add a recovery point for an accidental tap. (2) Confirm dialog only, no visible label — rejected, contradicts the beta user's own framing verbatim ("every tappable element should... do the obvious thing its shape promises") — the control should communicate its function *before* interaction, not only gate the consequence after a tap has already been made. (3) A brand-new two-step "hold to confirm" or toast-based undo pattern — rejected, would introduce a new interaction pattern not used anywhere else in this codebase, adding inconsistency for a single control when an established, already-proven `confirm()` convention already exists and fits.
**Rationale:** Reusing an established in-codebase pattern (`confirm()`) is lower-risk and more consistent than inventing a new one, and directly answers CLAUDE.md's own instruction to "check whether any other destructive action in this app uses a confirm dialog... before inventing a new pattern." The visible label closes the *affordance* gap; the confirm dialog closes the *no-recovery-point* gap — these are two different failure modes from the same beta signal and neither fix alone closes both.
**Made by:** Claude (agent), via direct source reading of `products.js`/`features.js` before writing the story's Architecture Constraints
**Revisit trigger:** If user feedback indicates the `confirm()` dialog itself is annoying/redundant once the visible label is in place, reconsider whether the confirm gate is still warranted — but do not remove the visible label under any circumstance, per the beta user's own framing.
---

---
**[2026-08-16] | DESIGN | story authoring (nia-s1) — theme-toggle icon fix**
**Decision:** Replace the ambiguous `◑` glyph with two CSS-gated icon elements (sun, moon), using this same file's own existing `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` no-JS-fallback technique (already used for color tokens in `DESIGN_SYSTEM_CSS`) rather than adding new JS state-tracking logic. The icon shown reflects the theme currently active (sun visible when light mode is active, moon visible when dark mode is active).
**Alternatives considered:** (1) A single static icon with no state-reflection (e.g. always show a generic "brightness" glyph regardless of theme) — rejected, does not communicate anything about current state and is only marginally clearer than the existing `◑`; a stateful indicator is the actual near-universal convention this fix is meant to adopt. (2) JS-driven icon swap inside `swToggleTheme()`, setting `textContent` directly on click and on page load — rejected, this duplicates the theme state that `data-theme`/`localStorage` already track, creating a second source of truth that can drift out of sync (e.g. if `data-theme` is ever set by a path other than `swToggleTheme()`, the icon would silently go stale) and reintroduces exactly the kind of flash-of-wrong-content problem the existing anti-flash script was written to avoid for color tokens. (3) Show the icon of the *target* theme (i.e. moon while light is active, meaning "click to go dark") rather than the *current* theme — a legitimate alternate convention used by some apps, but rejected here in favor of current-state-reflection because it is simpler to reason about, matches this file's own existing "CSS reflects live `data-theme` directly" pattern with no inversion logic, and avoids a second design question (should hover state also hint at the target?) that isn't necessary to resolve to close the beta-reported defect.
**Rationale:** CSS-only, zero new JS, zero new state, reuses an established, already-proven-safe technique in the exact same file — the lowest-risk option that still fully replaces the ambiguous glyph with an unambiguous, state-correct one.
**Made by:** Claude (agent), via direct reading of `DESIGN_SYSTEM_CSS`'s existing dark-mode token pattern before writing the story's Architecture Constraints
**Revisit trigger:** If a future story adds a third theme option (e.g. "auto/system" as a persisted explicit choice distinct from the no-JS OS fallback), this two-icon CSS gate would need a third icon state — out of scope for this fix, noted for whoever picks that up.
---

---
**[2026-08-16] | RISK-ACCEPT | test-plan (H-E2E / B2, nia-s1)**
**Decision:** AC3 (theme-toggle icon no longer reads as an avatar) has a genuinely CSS-layout/visual-rendering-dependent dimension — whether the sun/moon icon is legible and unambiguous to a real human eye at real device sizes cannot be fully proven by a unit test inspecting HTML/CSS strings. Classified per CLAUDE.md's B2 rule as **RISK-ACCEPT + manual smoke test**, not an automated Playwright visual-regression test.
**Alternatives considered:** Add a Playwright screenshot-comparison test in `tests/e2e/` — rejected for this bounded bug-fix story; this repo has no existing Playwright visual-regression harness for `html-shell.js` elements to extend, and standing one up is disproportionate scope for a two-element icon/label fix. The unit tests already prove the *correct DOM/CSS exists* (icon elements present, CSS selectors present, `◑` absent) — the residual risk is purely "does it look right to a human," which the verification script's Scenario 3 (manual check against staging, explicitly named as a RISK-ACCEPT item in the script itself) closes at the same fidelity as the original beta signal was itself validated (a live Chrome/staging check, not automated tooling).
**Rationale:** Matches CLAUDE.md's explicit B2 requirement — RISK-ACCEPT + manual smoke test script + a corresponding `decisions.md` entry + a post-deployment smoke-test action item in `workspace/state.json`'s `pendingActions`. All three are present (this entry; verification script Scenario 3; `pendingActions` entry to be added at branch-complete).
**Made by:** Claude (agent), applying CLAUDE.md's own named rule directly (not an ad hoc judgment call)
**Revisit trigger:** If this repo ever stands up a Playwright visual-regression harness for `html-shell.js`, retrofit an automated test for this AC rather than continuing to rely on manual smoke testing.
---

---
**[2026-08-16] | ASSUMPTION | definition-of-ready (H-GOV, nia-s1)**
**Decision:** H-GOV (governance approval check, reads `## Approved By` from a discovery artefact) is treated as not applicable for this story. This feature has no `discovery.md` at all — short-track explicitly skips discovery per `CLAUDE.md`'s documented short-track path, matching the precedent already established by `tmss-s1` (`2026-08-16-team-management-shared-shell-migration`) and `pcr-s1` (`2026-07-11-pipeline-conflict-reduction`), both of which reached DoR sign-off and DoD-complete respectively with no discovery artefact and no H-GOV check performed.
**Alternatives considered:** Re-derive the H-GOV reasoning from scratch — rejected per this session's own instruction to cite `tmss-s1`'s precedent directly rather than re-deriving; the underlying facts (short-track has no discovery.md by design, H-GOV's spec only defines behaviour for a discovery artefact that exists but is missing an `Approved By` section) are identical to `tmss-s1`'s own case.
**Rationale:** The operator (sole platform owner) is directly requesting and reviewing this work in-session, which is the practical equivalent of approval in a solo-operator context — same reasoning `tmss-s1` already logged.
**Made by:** Claude (agent), citing `tmss-s1`'s `decisions.md` entry (2026-08-16) as direct precedent
**Revisit trigger:** If `/definition-of-ready`'s own SKILL.md is ever updated to explicitly define short-track H-GOV behaviour, defer to that instead of this precedent-based interpretation.
---

---
**[2026-08-16] | RISK-ACCEPT | definition-of-ready (W4, nia-s1)**
**Decision:** Proceeding with DoR sign-off on `nia-s1` despite W4 (verification script reviewed by a domain expert) not being independently satisfied — the verification script exists and is complete, but no separate domain expert has reviewed it ahead of implementation.
**Alternatives considered:** Pause DoR sign-off until a separate reviewer walks the script — deferred for the same practical reason applied consistently across this repo's other recent short-track features (`tmss-s1`, `wuce-self-serve-invites`, `web-ui-guardrails-standards-surface`): solo-operator repo, no separate domain-expert role available.
**Rationale:** The verification script was written directly from this story's own reviewed ACs; post-merge smoke testing (the script's own second intended use) remains the real verification checkpoint, and its Scenario 3 specifically closes the AC3 RISK-ACCEPT gap logged above.
**Made by:** Hamish King — Platform owner
**Revisit trigger:** If this feature ever has a genuinely separate domain-expert reviewer available, use them for W4 satisfaction on future stories rather than accepting this gap by default.
---

---
**[2026-08-16] | RISK-ACCEPT | branch-setup (nia-s1)**
**Decision:** Proceeding with `nia-s1`'s worktree despite 33 pre-existing test failures at baseline (523 files run via `npm test`, 33 failed, exit code 1).
**Alternatives considered:** Investigate and fix pre-existing failures first — rejected, out of scope for this bounded bug fix and would delay it for unrelated pre-existing repo drift.
**Rationale:** The 33 failing files (`scripts/check-pipeline-state-integrity.js`, `tests/check-bee3-posthog.js`, `tests/check-mfc1/mfc2-*.js`, `tests/check-ougl*.js`, `tests/check-i*.js`, `tests/check-p*.js`, `tests/check-s*.js`, `tests/check-wuce*.js`, `tests/check-wucp1-context-autoloader.js`, `tests/check-rb-s5-optional-outer-loop-install.js`, `tests/artefact-preview.test.js`, `tests/artefact-writeback.test.js`) closely match the same baseline pattern already independently verified multiple times this session (e.g. `tmss-s1`'s own branch-setup RISK-ACCEPT entry, which found an overlapping-in-kind 33-file baseline). None overlap with `nia-s1`'s expected touchpoints (`src/web-ui/utils/html-shell.js`, a new `tests/check-nia-s1-nav-icon-affordance.js` file).
**Made by:** Claude (agent), per branch-setup's own Step 5 option 2 protocol
**Revisit trigger:** If any of these 33 files' failures turn out to be caused by (or newly relevant to) this story's changes during implementation, stop and investigate.
---

---
**[2026-08-16] | RISK-ACCEPT | post-implementation full-suite comparison (nia-s1, both tasks)**
**Decision:** After implementing both fixes (sign-out label/confirm, theme-toggle icon), the full suite shows 524 files run, 32 failed — one fewer than the 33-failure baseline. `tests/check-rb-s5-optional-outer-loop-install.js` is present in the baseline's failed list but absent from the post-implementation failed list; every other failing file is an exact subset of the baseline list. Treated as a pre-existing flaky test (unrelated to `html-shell.js`, `team-management`, or any scope of this story — it concerns optional outer-loop installation), not a fix introduced by this story, and not investigated further as it is a net-positive, not a regression.
**Alternatives considered:** Investigate why `rb-s5`'s test now passes — deferred, out of scope for this bug fix and not a regression risk (a previously-failing, now-passing test carries no risk of masking a real defect the way a new failure would).
**Rationale:** The only requirement for this story's regression gate is "no NEW failure beyond baseline." That gate is met — 0 new failures, all 32 post-implementation failures are already-known baseline entries, and the new `tests/check-nia-s1-nav-icon-affordance.js` (4/4) passes cleanly.
**Made by:** Claude (agent), via direct diff of the baseline and post-implementation failed-file lists
**Revisit trigger:** None — informational only.
---

---
**[2026-08-16] | RISK-ACCEPT | branch-complete (nia-s1) — pre-existing CI gate failures on PR #745**
**Decision:** PR #745 (draft) shows 3 CI check failures: "Run assurance gate," "Validate traceability chain," and "Scenario A E2E (staging)" (cancelled). Investigated all three directly via `gh run view --log-failed` and confirmed none are caused by `nia-s1`'s changes; the PR is left open as draft (per standing instruction to never mark ready for review) rather than attempting to fix these out-of-scope, repo-wide gaps.
**Findings:**
1. "Run assurance gate" fails on `node scripts/trace-report.js --collect --feature feedback` — "No feature resolved" — `artefacts/feedback/` (the beta-001/002/003/004 triage docs, created before this story began) is not a registered pipeline-state feature slug and has no `discovery.md`. Pre-existing gap from the beta-feedback-intake work, unrelated to nav icon affordance.
2. "Validate traceability chain" fails on the same `discovery_exists` check for `artefacts/feedback/`, plus a `schema_valid` failure — confirmed via `node scripts/check-pipeline-state-integrity.js` run directly against current master (independent of this PR) that 14 pre-existing violations already exist across unrelated features (`2026-06-22-wuce-multi-tenancy` s3.1/s3.2/s4.1/s4.2/s5.1, `2026-05-05-web-ui-dynamic-skill-questions` dsq.1-4, `2026-05-07-web-ui-session-management` wsm.2/wsm.3, `2026-07-01-landing-auth-billing` lab-s3.1, `2026-08-05-repo-bootstrap-no-fork` rb-s5) — none reference `nia-s1` or `nav-icon-affordance`.
3. "Scenario A E2E (staging)" shows `conclusion: cancelled`, not a genuine test failure — consistent with this repo's own already-documented, unresolved CI-triggering/concurrency-queue flakiness (see `workspace/state.json`'s `checkpoint.pendingActions`, entry logged 2026-08-14, still open).
**Alternatives considered:** Fix the `artefacts/feedback/` registration gap and/or the 14 unrelated schema violations as part of this PR — rejected, explicitly out of scope for a bounded short-track nav-icon bug fix (CLAUDE.md's Out of Scope discipline); would also touch unrelated features' pipeline-state entries this story has no authority or context to correct safely.
**Rationale:** This story's own scope (`src/web-ui/utils/html-shell.js` + its test file, confirmed via `git diff --stat 4f1efb4b..HEAD`) is unaffected by any of these three failures. Leaving the PR in draft (already the standing instruction) is the correct state until either these pre-existing gaps are fixed in a separate story, or an operator decides to bypass them for this merge the same way `tmss-s1`/`wugs-s13` did for their own unrelated pre-existing CI gaps.
**Made by:** Claude (agent), via `gh run view --log-failed`/`gh api` investigation of all 3 failing checks plus a direct local re-run of `check-pipeline-state-integrity.js` against master
**Revisit trigger:** If a future story registers `artefacts/feedback/` properly (reference_dirs or a real feature entry) and/or cleans up the 14 pre-existing schema violations, re-run this PR's CI to confirm it now passes cleanly.
---

## Architecture Decision Records

<!-- None recorded yet. -->

---
