# Definition of Done: Skill launcher redesign — show 5 primary CTAs, hide chained skills

**PR:** https://github.com/heymishy/skills-repo/pull/934 | **Merged:** 2026-09-30
**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep1-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-10-01

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Primary CTAs are rendered and prominently displayed | ✅ | Confirmed on master post-merge: real Playwright E2E `tests/e2e/ep1-s3-launcher-layout.spec.js` — exactly 5 primary buttons present, keyboard-navigable, rendered above the advanced section (bounding-box Y comparison), with genuinely larger sizing (15px vs 13px advanced text). This E2E run itself found and fixed a real defect: primary buttons initially rendered smaller than the advanced summary — fixed pre-merge | `live-verified` (real Chromium browser, real webServer, real listSkills adapter) | None |
| AC2 — Chained skills are hidden by default | ✅ | `tests/check-ep1-s3-skill-launcher.js` — primary section contains exactly the 5 primary names; explicitly does not contain representative chained skills (`test-plan`, `clarify`) | `integration-real-code` | None |
| AC3 — Advanced affordance provides access to all skills | ✅ | `tests/check-ep1-s3-skill-launcher.js` — the complete, unfiltered skill list (7-skill fixture incl. all 5 primaries + 2 chained) renders inside the collapsible advanced section | `integration-real-code` | None |
| AC4 — Advanced affordance is visually de-emphasized | ✅ | Real Playwright E2E — `<details>` has no `open` attribute on load, `.el-advanced-body` not visible until the summary is clicked, expands without a page reload (native zero-JS behaviour) | `live-verified` | None |
| AC5 — Backward compatibility is preserved | ✅ | `tests/check-ep1-s3-skill-launcher.js` — an advanced-section chained skill (`test-plan`) has a real `<form method="POST" action="/api/skills/test-plan/sessions">`, identical launch mechanism to primary CTAs | `integration-real-code` | None |
| AC6 — Entry-point skill list is stable | ✅ | `tests/check-ep1-s3-skill-launcher.js` — `PRIMARY_SKILLS` is a hardcoded constant; two renders with different CSRF tokens (simulating different session state) produce byte-identical primary/advanced structure | `unit` + `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all 6 ACs are satisfied exactly as scoped.

---

## Scope Deviations

None. The merged PR is exactly what the DoR contract described: `src/web-ui/skill-launcher.js` (new), `src/web-ui/routes/skills.js` (render call changed, `_renderSkillsList` left in place unused per no-unrequested-cleanup convention), `tests/check-ep1-s3-skill-launcher.js` (new), `tests/e2e/ep1-s3-launcher-layout.spec.js` (new). All 5 commits map 1:1 to the implementation plan's 6 tasks — confirmed via `git log --oneline master..HEAD` at `/verify-completion` time. No epic-level or story-level out-of-scope item was touched (config.yml parameterization, skill search/filtering, grouping, CTA re-ordering, advanced-state persistence — all untouched, exactly as scoped as future work).

Two genuine defects were found and fixed as part of this story's own Task 6 (the mandatory real-E2E verification task), not scope creep: (1) `playwright.config.js`'s shared `webServer.env` never wired the real `listSkills` adapter under `NODE_ENV=test`, so no E2E spec in this repo's history had ever exercised `/skills` against real skill data — fixed with a one-line, additive, opt-in flag already coded in `server.js`; (2) the AC1 CSS sizing defect described above. Both documented in `decisions.md`.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 / 9 (3 unit, 2 integration, 2 E2E, 2 NFR — the full test plan). Two NFR tests (performance, accessibility) were initially missed and caught during `/verify-completion` before the completeness claim was made; both were then implemented and confirmed passing before merge.
**Tests passing in CI:** 7/7 unit+integration (`tests/check-ep1-s3-skill-launcher.js`), 3/3 real Playwright E2E (`tests/e2e/ep1-s3-launcher-layout.spec.js`, run locally — Playwright specs are not part of the `npm test` CI chain per ADR-018).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC2 unit (primary = exactly 5, no chained) | ✅ | ✅ | |
| AC3 unit (advanced = complete unfiltered list) | ✅ | ✅ | |
| AC6 unit x2 (PRIMARY_SKILLS constant + render stability) | ✅ | ✅ | |
| AC5 unit (advanced skill has real launch form) | ✅ | ✅ | |
| Integration (handleGetSkillsHtml renders new launcher) | ✅ | ✅ | |
| NFR-Performance unit (render <100ms) | ✅ | ✅ | Measures `renderSkillLauncher()`'s own execution time, not full browser navigation — see NFR Status below |
| AC1 E2E (prominent, larger, above advanced) | ✅ | ✅ | Found + fixed real CSS sizing defect |
| AC4 E2E (collapsed by default, expands without reload) | ✅ | ✅ | |
| NFR-Accessibility E2E (accessible names, Tab order) | ✅ | ✅ | |

**Gaps (tests not implemented):** None against the test plan's final scope.

**Coverage gap audit (CSS-layout-dependent ACs — AC1, AC4):** Classified at DoR time as requiring real Playwright E2E tests (not RISK-ACCEPT) — `hasLayoutDependentGaps: true`, `e2eToolingRequired: true` in the DoR contract. Both were implemented with real, unstubbed Playwright E2E specs and pass on master. No RISK-ACCEPT was needed or recorded; the H-E2E gate was satisfied via the "automated E2E test" path, not the deferred-manual path.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill launcher render time (<100ms) | ✅ | Measured `renderSkillLauncher()`'s own server-side execution time (sub-millisecond) rather than full-browser navigation timing at a 100ms threshold, to avoid flakiness from unrelated network/browser overhead. **Verification-method deviation from `nfr-profile.md`**, which specifies "Playwright navigation timing" — a full-navigation E2E timing assertion was judged likely to be environment-flaky at this tight threshold; the render function itself (the thing the NFR text actually describes) is what was measured instead. Not a gap in the underlying requirement, which the app comfortably meets either way for a pure string-concatenation render. |
| Keyboard navigation (all CTA buttons Tab-reachable, Enter/Space activates) | ✅ | Real Playwright E2E confirms Tab order reaches all 5 primary CTAs before the advanced section's `<summary>` disclosure control; native `<button type="submit">`/`<details>` elements are inherently Enter/Space-activatable (no custom JS interaction to verify) |
| Screen reader support (labels + primary/advanced distinction announced; colour not the sole indicator) | ⚠️ | Button labels are non-empty text (tested). The primary/advanced distinction itself relies on this codebase's established semantic-HTML convention — a `<p class="sw-section-title">Get started</p>` label plus a native `<details>/<summary>` disclosure (already used elsewhere in this app for the canvas-diagram and context-manifest panels) — which is inherently non-colour-dependent and screen-reader-navigable by construction, but this was not independently verified with an accessibility-tree/screen-reader-specific test this story. Not blocking (no regression from prior state; this codebase's own existing convention was reused as-is), but recorded as a verification-strength gap rather than silently marked ✅ |
| No new attack surface (no new npm dependency; read-only rendering) | ✅ | Confirmed — `package.json` untouched by this story's entire commit history on `feature/ep1-s3-wuli` |

---

## Metric Signal

**Measurement-ready gate:** Yes — Metric 1's target is directly about this story's own launcher redesign, which is now merged and live on master.

> **Metric 1 — Skill launcher clarity**
> Signal: on-track
> Evidence: `benefit-metric.md`'s own measurement method is "E2E spec assertion (entry-point skills present as primary CTAs; a representative chained skill is NOT shown as a primary CTA) + direct operator visual inspection in a real browser session." The E2E-assertion half is fully satisfied — real Playwright E2E on master confirms exactly 5 primary CTAs (discovery, ideate, reverse-engineer, spike, improve), with `/test-plan`/`/clarify` and all other chained skills confirmed absent from the primary section and present only in the collapsed advanced section. The target itself ("only the 5 confirmed entry-point skills shown as primary CTAs; all other skills hidden, reachable via a clearly-labelled advanced affordance") is met. The "direct operator visual inspection in a real browser session" half of the measurement method is not yet performed — Claude-in-Chrome was unavailable throughout this session (extension not connected, confirmed on repeated attempts); this is a genuine, outstanding action for the operator, not a gap in the delivered feature itself, since the minimum validation signal ("entry-point skills are visually and structurally distinguished from chained skills") is already clearly met by the E2E evidence.
> Date measured: 2026-10-01

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 6 ACs are satisfied exactly as scoped, with real E2E evidence for both CSS-layout-dependent ACs. Marked "with deviations" rather than a clean COMPLETE for two reasons, neither of which reflects a defect in the shipped feature: (1) the performance NFR was verified by a different (arguably more precise and less flaky) method than `nfr-profile.md` specifies; (2) the screen-reader-distinction NFR relies on a reused, established codebase convention rather than an independently-run accessibility-tree test this story. Both are recorded rather than silently smoothed over.

**Follow-up actions:**
1. Operator: perform the "direct operator visual inspection in a real browser session" half of Metric 1's own measurement method once convenient (or via Claude-in-Chrome once its connectivity issue in this environment is resolved) — not blocking, since the minimum validation signal is already met by E2E evidence.
2. Consider a dedicated accessibility-tree/screen-reader test (e.g. via `page.accessibility.snapshot()`) for the primary/advanced visual-hierarchy distinction specifically, the one NFR row not independently tested this story — low priority, since the underlying HTML pattern is a pre-existing, already-relied-upon convention in this codebase, not new risk introduced here.
3. `ep1-s3`'s own known pre-existing dependency: `ep1-s2`'s non-deterministic signal `id` gap (documented in that story's own DoD) still applies to any future client-side code that assumes stable signal `id`s — not relevant to this story's own scope (pure skill-launcher UI), noted only for continuity.
4. **A real, higher-priority gap found during this DoD's own Metric 6 check (not a defect in this story, but a planning-assumption mismatch worth surfacing now):** `ep1-s2`'s own DoD (written 2026-09-30) stated Metric 2's full target ("all 12 sources... displayed per active feature") "depends on `ep1-s3`'s dashboard rendering, not yet built" — i.e. at that point, `ep1-s3` was expected to deliver a web UI page that displays real signals. The `ep1-s3` story that was actually defined and built (this one) is the **skill launcher** redesign — an unrelated feature; it renders no signal data anywhere. Confirmed via direct grep: no route or view under `src/web-ui/routes/` or `src/web-ui/views/` renders anything signal-related. This means **Metric 3's own minimum validation signal ("the visibility half of the loop works end-to-end — signal appears, is legible, and is traceable to its source") is still entirely unmet** — there is no web-UI surface where an operator can see a signal at all, despite all 3 Epic 1 stories now being merged. This is not a scope failure of any individual Epic 1 story (each delivered exactly what its own story/DoR described); it is a gap between `benefit-metric.md`'s original coverage-table assumption (written before `ep1-s3`'s actual story content was defined) and what Epic 1 actually shipped. Recommend: do not mark Metric 3 `on-track` yet; a signals-display dashboard page is still needed before Metric 2's full target or Metric 3's minimum validation signal can be genuinely measured — likely a new story, either as an Epic 1 addendum or folded into Epic 2's own definition.

---

## DoD Observations

1. **Claude-in-Chrome was requested by the operator but unavailable throughout this story's entire session** ("Browser extension is not connected," confirmed on repeated attempts including after explicit operator confirmation of an active, logged-in Chrome session). Real Playwright E2E tests were substituted as the mandatory real-browser check for both CSS-layout-dependent ACs (AC1, AC4) and both NFRs (performance, accessibility) — a genuine, unstubbed real-browser mechanism (this repo's own ADR-018 E2E infrastructure), not a DOM-presence proxy. This substitution itself surfaced and led to fixing two real defects pre-merge (a shared E2E-harness config gap affecting every spec touching `/skills`, and a real CSS sizing bug) that a manual click-through might not necessarily have caught either. **/improve candidate:** none specific to this repo's own pipeline — this is a recurring environment/tooling availability constraint across all 3 Epic 1 stories this session, not a gap in any individual story or its verification approach; worth flagging as a standing session-environment issue if it persists into future sessions.
2. **A test-plan completeness gap was caught and closed before the completeness claim was made, not after.** The test plan enumerated 9 tests; only 7 had actually been implemented when `/verify-completion` began walking the AC verification script. Rather than silently claim "test plan satisfied" against the lower, already-passing count, both missing NFR tests were identified, implemented, and confirmed passing before the PR was opened — a real example of the Iron Law ("no completion claims without fresh verification evidence") catching a real, self-introduced gap in this exact session, not just a hypothetical one.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s3 (Skill launcher
redesign: 5 primary CTAs, collapsible advanced section).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
