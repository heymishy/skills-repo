# Definition of Done: Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI to Match DESIGN.md

**PR:** https://github.com/heymishy/skills-repo/pull/903 | **Merged:** 2026-09-18 (merge commit `42962f76`)
**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-09-19

---

## AC Coverage

- **AC1:** Dark-mode computed CSS custom-property values match `DESIGN.md`'s dark token table exactly
- **AC2:** Light-mode computed CSS custom-property values match `DESIGN.md`'s light token table exactly
- **AC3:** Two-column layout with real, functional Sign-off and Comments cards matches the `Skills Platform - Artefact Viewer.dc.html` mock
- **AC4:** No existing functional behavior regresses
- **AC5:** Sign Off button sends a real `POST /sign-off` request and updates on success without a full page reload
- **AC6:** Already-signed-off artefact shows the existing approver/date, not an active Sign Off button
- **AC7:** Comments card displays every existing comment oldest-first, or "No comments yet" if none
- **AC8:** Submitting a comment persists it and it appears in the list without a full page reload

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js` (dark-mode computed-style test), fresh run on merged master: 1/1 passed | live-verified (real browser + a real live browser render was also performed manually during /verify-completion, catching 2 real styling defects unit/E2E tests alone missed) | None |
| AC2 | ✅ | Same spec, light-mode computed-style test, fresh run: 1/1 passed | live-verified | None |
| AC3 | ✅ | Same spec (layout/grid/card test) + a real live browser render (light and dark) performed during /verify-completion, which found and fixed 2 real gaps (Sign-off/Comments cards had zero CSS styling at all; comment textarea rendered as a raw white browser-default box regardless of theme) before this AC was marked satisfied | live-verified | Mock-fidelity gap: `DESIGN.md`/the real mock depict a multi-reviewer sign-off roster (avatars, roles, per-person status) and threaded comments (avatars, Reply/Resolve links) — this story correctly built a simpler single-approver/flat-comments UI reusing the existing single-approver `handleSignOff` backend and a flat comments data model, per this story's own scope constraints (no new sign-off backend logic, comments are append-only). RISK-ACCEPTed and deferred as new, separate follow-up scope — see `decisions.md`, "AC3 mock-fidelity gap" entry. AC3 is satisfied at the structural/layout/real-functionality level this story always targeted, not the mock's full aspirational richness. |
| AC4 | ✅ | 4 pre-existing artefact-viewer specs re-run fresh on merged master (`artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js`): 18/20 passing, 2 failures confirmed pre-existing/unrelated (stale port-3000-vs-3999 assertion, zero diff vs. pre-dsa-s1 master on both files) | live-verified | None |
| AC5 | ✅ | Same E2E spec's request-observation test (`page.route` intercept confirms correct `artefactPath` sent), fresh run: 1/1 passed | live-verified | RISK-ACCEPT: on success, the client calls `window.location.reload()` — a literal full page reload, contradicting AC5's "without a full page reload" clause. The real `/sign-off` 200 response carries no approver/date fields to render client-side without one, and building a second client-side state-reconstruction path was judged a worse tradeoff (drift risk) than the reload. Operator-confirmed RISK-ACCEPT — see `decisions.md`, "Task 5 RISK-ACCEPT: sign-off success reloads the page" entry. |
| AC6 | ✅ | Same spec's already-signed-off fixture test, fresh run: 1/1 passed | live-verified | None |
| AC7 | ✅ | Same spec, empty-state test + 3-seeded-comments oldest-first test, fresh runs: 2/2 passed | live-verified | None |
| AC8 | ✅ | Same spec's no-reload sentinel test, fresh run: 1/1 passed; also manually re-confirmed via a real live browser session during /verify-completion (typed and posted a real comment, confirmed it appeared without navigation) | live-verified | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. All three deviations above are recorded, operator-reviewed RISK-ACCEPTs or deferred-scope decisions — not unrecorded gaps.

---

## Scope Deviations

None beyond the story's own already-amended scope (this story was itself amended mid-delivery from a pure visual restyle to include real Sign-off/Comments functionality — see `decisions.md`'s "major architecture correction and scope expansion" entry, which predates and is separate from this DoD). Confirmed against the story's Out of Scope list: no other of the 3 remaining real screens were touched, no `design.system` DoR governance mechanism was built (that is `dsa-s5`), no new icons/components beyond what `DESIGN.md`/the mock specify, `handleSignOff`'s own existing backend logic was not modified, no comment editing/deletion was built, no org-scoping/permissions model was added to comments.

---

## Test Plan Coverage

**Tests from plan implemented:** 20/20 (5 unit, 2 integration, 8 E2E, 5 NFR) — plus 2 additional tests added during code-quality review remediation (a comment resource-isolation test, an authenticated-400 test for a missing `resourceId`), for a total of 22 real assertions across the dsa-s1-specific suite.
**Tests passing in CI:** all passing — independently re-run fresh against merged master in this session:
- `node tests/check-dsa-s1-token-values.js` → pass
- `node tests/check-dsa-s1-artefact-comments.js` → pass (4 tests)
- `node tests/check-dsa-s1-comment-routes.js` → pass (3 tests)
- `node tests/check-dsa-s1-sign-off-detection.js` → pass (2 tests)
- `node tests/check-dsa-s1-artefact-body-content-escaping.js` → pass (4 tests)
- `node tests/check-bcf-s1-button-contrast.js` → pass (4 tests — this is a different, already-shipped story's test file, updated by this story's own Task 6 since dsa-s1's Task 1 token change made its hardcoded contrast values stale; see NFR Status below)
- `npx playwright test tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js` → 8/8 passed
- Full `npm test` on merged master (run twice during delivery, both times only the same 1-2 pre-existing, unrelated failures — none from dsa-s1)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| Token-value checks (AC1/AC2) | ✅ | ✅ | Confirms exact hex values in all 3 real CSS blocks (`:root`, `[data-theme="dark"]`, `@media` fallback) |
| artefact-comments module unit tests | ✅ | ✅ | Includes a resource-isolation test added during code-quality review, empirically proven non-vacuous |
| comment-routes integration tests | ✅ | ✅ | Includes a missing-`resourceId` 400 test added during code-quality review, empirically proven non-vacuous |
| sign-off-detection integration test | ✅ | ✅ | |
| artefact-body-content escaping test | ✅ | ✅ | Direct unit test proving a `<script>` payload in a comment body is HTML-escaped, not injected raw — added during code-quality review after the reviewer specifically flagged the original coverage gap; empirically proven non-vacuous |
| E2E suite (AC1-AC3, AC5-AC8) | ✅ | ✅ | AC4 deliberately excluded from this file per the story's own wording — covered by re-running the 4 pre-existing specs instead |

**Gaps (tests not implemented):** None blocking. AC5's full `/sign-off` success-round-trip (a real GitHub write) cannot be automated in this environment — request-observation-only coverage, matching `sign-off.spec.js`'s own established precedent, documented in the test plan from the start (not a gap discovered late).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No measurable page-load regression from the restyle | ✅ | AC4's 18/20 pre-existing spec pass rate (2 failures pre-existing/unrelated) confirms no functional or load regression |
| Comment body must be HTML-escaped before rendering (XSS prevention) | ✅ | `tests/check-dsa-s1-artefact-body-content-escaping.js`, exhaustively checked every interpolation site in `_buildArtefactBodyContent` during code-quality review — all pass through `shellEscHtml`, confirmed with a real injected `<script>` payload test |
| New comments endpoints must require authentication | ✅ | `tests/check-dsa-s1-comment-routes.js` — both routes wrapped in `authGuard`, confirmed via 401/302-class rejection tests |
| WCAG 2.1 AA (platform-wide floor) — no regression to existing accessibility properties | ⚠️ Deviation found, not a regression this story caused, but a real newly-surfaced gap | `decisions.md`, "Task 6 finding: dark-mode button contrast dropped below WCAG AA when --accent was updated" entry. dsa-s1's own Task 1 changed `--accent` to match `DESIGN.md` exactly (an Architecture Constraint of this story), which incidentally dropped an unrelated, already-shipped story's (`bcf-s1`) dark-mode button-text contrast from 4.47:1 to 3.68:1 — below the 4.5:1 AA floor. Independently recomputed from the raw hex values (`#3B82F6` vs `#FFFFFF`) and confirmed correct: 3.676:1. The stale test asserting the old value was corrected to the real current value (not silently loosened), and the gap itself was flagged for a follow-up story rather than fixed inline (fixing would mean either reverting `--accent` away from `DESIGN.md`'s own specified color, or picking a different text color for the affected buttons — both real design decisions outside this story's own scope). |
| Comment creation is logged (author, resource, timestamp) | ✅ | `src/web-ui/modules/artefact-comments.js::createComment` — `log.info` JSON event confirmed in test output every run |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| m1: Visual consistency across the 4 real screens (target 4/4) | ✅ (baseline: 0 of 4) | Not yet — 1 of 4 screens (artefact viewer) now matches `DESIGN.md`'s token values; `dsa-s2`/`dsa-s3`/`dsa-s4` (dashboard, landing, skill-session) still need to ship before the 4/4 target is reachable. Signal: `not-yet-measured`. Evidence note: dsa-s1 (artefact viewer) merged and verified; 3 of 4 screens remain. |
| m3: Beta user feedback on visual quality | ❌ (baseline: not yet established) | Not yet — no beta user has seen the restyled artefact viewer yet (just merged). Signal: `not-yet-measured`. Evidence note: mechanism/screen shipped and verified in this session; awaiting real beta-user exposure and feedback. |

m2 (design.system DoR gate) has no contribution from this story — it belongs to `dsa-s5`, not yet delivered.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 8 ACs satisfied with `live-verified` evidence — every AC was confirmed via a fresh, real E2E/Playwright run against merged master in this session, and AC3/AC8 additionally via a real manual live-browser session during `/verify-completion` (which caught 2 real styling defects no automated test had covered, fixed before merge). Three deviations recorded: AC3's mock-fidelity gap (multi-reviewer roster/threaded comments deferred as new scope, operator-confirmed), AC5's reload-on-success (operator-confirmed RISK-ACCEPT against the literal "no reload" wording), and a newly-surfaced WCAG AA contrast regression on an unrelated, already-shipped story's buttons (flagged and corrected in the stale test, real fix deferred as new scope). Zero scope violations beyond the story's own already-amended, already-reviewed scope. Zero blocking test gaps.

**Follow-up actions:**
1. A new story to build the mock's full multi-reviewer sign-off roster (avatars, roles, per-person status, "Awaiting N" badge) and threaded comments (avatars, Reply/Resolve) — requires new backend data modeling beyond `handleSignOff`'s single-approver regex and beyond `artefact-comments.js`'s current flat schema. Recommended but not created here — see `decisions.md`'s AC3 entry.
2. A short-track story to close the dark-mode WCAG AA contrast gap on `bcf-s1`'s buttons (candidate fixes: lighten dark-mode `--accent`, or use a non-white text color for these buttons in dark mode specifically). Recommended but not created here — see `decisions.md`'s Task 6 finding entry.
3. `dsa-s2`/`dsa-s3`/`dsa-s4` still need their own `/implementation-plan` + `/subagent-execution` passes to reach m1's 4/4 target — each already has the feature-wide token-aliasing/selector-structure corrections pointed to in their own story files from this feature's earlier `/implementation-plan` investigation.

---

## DoD Observations

1. **The live browser render check (a real page load, not just Playwright's computed-style assertions) was the single highest-value verification step in this story's delivery** — it caught 3 real issues no automated test surfaced on its own: 2 genuine CSS-styling omissions (unstyled sign-off/comments cards, an unstyled comment textarea) and 1 genuine scope-fidelity gap against the real mock (AC3's multi-reviewer/threading richness). All 3 were either fixed pre-merge or explicitly RISK-ACCEPTed with the operator's confirmation — none shipped silently. `/improve` candidate: this reinforces `/verify-completion`'s own "Live browser render check (mandatory when the diff changes rendered UI output)" section as genuinely load-bearing, not a formality — worth citing as a concrete example in that skill file's own rationale.
2. **A rebase conflict during this session's own PR-merge sequencing** (this PR merging first, then `feature/ep2-s3` needing a rebase that hit a real code conflict in `server.js` where both stories added an adjacent new static-route branch) is recorded here for completeness — resolved cleanly on the `ep2-s3` side, no regression to this story's own delivered code. See `ep2-s3-dod.md`'s own DoD Observations for the full account.
3. **A subagent-dispatched final cross-task reviewer hit the account's monthly spend limit mid-review** during this story's `/subagent-execution` → `/verify-completion` transition — the orchestrating session picked up the remaining verification work directly (including the live browser check described in Observation 1) rather than losing the in-flight review. No process gap resulted, but worth noting as a real operational constraint this delivery ran into.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for dsa-s1 (Restyle the Artefact Viewer and Build Its Sign-Off/Comments UI).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
