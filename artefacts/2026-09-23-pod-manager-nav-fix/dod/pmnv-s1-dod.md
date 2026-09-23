# Definition of Done: Add Pod Manager to the sidebar nav (pmnv-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/919 | **Merged:** 2026-09-22 (merge commit `0b79e44e`)
**Story:** artefacts/2026-09-23-pod-manager-nav-fix/stories/pmnv-s1-pod-manager-nav-entry.md
**Test plan:** artefacts/2026-09-23-pod-manager-nav-fix/test-plans/pmnv-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-23-pod-manager-nav-fix/dor/pmnv-s1-dor.md
**Assessed by:** Claude
**Date:** 2026-09-23
**Track:** Short-track (skipped discovery→review; found live during `ep4-s1`'s Definition of Done)

---

## AC Coverage

- **AC1:** Given any authenticated, non-viewer user, When the sidebar renders, Then a "Pod Manager" nav item is present in the main (non-account) section, alongside "Org board".
- **AC2:** Given the "Pod Manager" nav item, When inspected, Then its `href` is `/admin/pods/manager` and it is not marked `adminOnly`.
- **AC3:** Given a non-admin authenticated user, When the sidebar renders, Then "Pod Manager" is still present.
- **AC4:** Given the existing `check-b2-account-nav.js` dangling-link regression suite, When re-run after this change, Then it still passes.

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-pmnv-s1-pod-manager-nav-entry.js` (3/3) — `renderShell({isAdmin:false})` output contains "Pod Manager", its href, and "Org board" | unit | None |
| AC2 | ✅ | Same test — direct `NAV_ITEMS.find(id === 'pod-manager')` assertion on `href`, `adminOnly` (falsy), and `section` (not `'account'`) | unit | None |
| AC3 | ✅ | Same test — `renderShell({isAdmin:true})` confirms identical presence for admin sessions too (regression guard distinguishing this from `admin-credits`, which IS correctly gated) | unit | None |
| AC4 | ✅ | `tests/check-b2-account-nav.js` re-run unmodified: 9/9 passing, including its own "zero dangling NAV_ITEMS entries" check, which now automatically covers the new entry | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC.** None recorded — this story's ACs were written directly against the real, already-investigated code (no fictional-architecture gap, unlike its sibling stories in `new-feature-2b74a292`), so there was nothing to correct.

---

## Scope Deviations

None. Confirmed against the story's Out of Scope list: `pod-manager.html`, `routes/pods.js`, `pod-store.js` all genuinely untouched (`git diff --stat` on the merged PR shows exactly `src/web-ui/utils/html-shell.js` + the new test file + the artefact folder — no other `src/` file touched). No `ep4-s1` file touched either.

---

## Test Plan Coverage

**Tests from plan implemented:** all 3 (2 unit + 1 integration-via-existing-suite), exactly as planned — no consolidation needed given the story's already-minimal scope.
**Tests passing:** re-run fresh against merged master in this session: `check-pmnv-s1-pod-manager-nav-entry.js` 3/3, `check-b2-account-nav.js` 9/9 (unmodified). Full `npm test` on merged master (commit `0b79e44e`): **698 files run, 1 failed** (`tests/check-p3.5-validate-trace.js` — the same pre-existing, unrelated Windows-local `python3` shim permission issue noted throughout this session).

| Test file | AC(s) covered | Passing | Notes |
|-----------|---------------|---------|-------|
| `tests/check-pmnv-s1-pod-manager-nav-entry.js` | AC1, AC2, AC3 | ✅ 3/3 | New file, follows `check-b2-account-nav.js`'s own `freshRequire`/`test()` conventions exactly |
| `tests/check-b2-account-nav.js` | AC4 | ✅ 9/9 | Pre-existing, unmodified — its own AC3 check ("zero dangling NAV_ITEMS entries") automatically covers the new entry |

**Gaps (tests not implemented):** None blocking.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Nav item renders identically regardless of `isAdmin` | ✅ | `check-pmnv-s1-pod-manager-nav-entry.js`'s two `renderShell` calls (isAdmin=false and isAdmin=true) both assert the item's presence — `unit` |
| No regression to `ep1-s1`/`b2`/`alrf-s7`'s existing nav/Pod-Manager behaviour | ✅ | `check-b2-account-nav.js` (9/9, unmodified) + full suite (see below) |

---

## Live Validation

Not required for this story — no CSS-layout-dependent AC (all assertions are server-rendered-HTML string / array-shape checks, matching the DoR's own classification). The underlying `/admin/pods/manager` page itself was already live-verified working correctly during `ep4-s1`'s own Definition of Done (real pod creation, real roster, real Save flow, zero console errors) — this story only adds a link pointing at it, which is not itself a candidate for a separate live-render check per CLAUDE.md's B2 rule (a plain nav `<a>` tag is not a CSS-layout-dependent rendering concern).

---

## Metric Signal

Short-track story — no formal benefit-metric artefact per this repo's own convention. Direct UX-defect fix: Pod Manager was reachable only by typing the URL directly since `ep1-s1` (months ago); it is now discoverable from the sidebar for every authenticated user. No dedicated metric to track — success is binary (the link exists, is correctly gated, and resolves to a real, already-working page), confirmed by AC1-AC4.

---

## Outcome

**COMPLETE**

All 4 ACs satisfied with `unit` + `integration-real-code` evidence. Zero deviations. Zero scope violations. Zero test gaps.

**Follow-up actions:**
1. None blocking.
2. Real process gap this story addresses one half of (logged in full at `workspace/capture-log.md`, 2026-09-23): the *reachability* gap is now closed. The second, larger gap from the same finding — `pod-manager.html`'s member picker (`ORG_ROSTER`) being a hardcoded fixture disconnected from real, login-capable users — is deliberately NOT addressed here; it requires its own `/discovery` pass and remains open, per the operator's own explicit choice to sequence it separately.
3. CI-process note (not a product gap): this PR's first CI run failed on `Validate traceability chain` and `Run assurance gate`, both with the same root cause — the new short-track artefact folder wasn't yet registered in `pipeline-state.json` when the PR was first opened (a step this session initially missed, having gone straight from writing the DoR to implementing the fix without the intermediate `bin/skills advance`-style registration `rapp-s2`'s own precedent required). Fixed in a follow-up commit on the same branch before merge, using `rapp-s2`'s own entry as the exact template. Worth a `/improve` candidate: short-track's own documented flow (`/test-plan → /definition-of-ready → coding agent`) doesn't explicitly call out "register the new feature/story in pipeline-state.json" as a required step the way the full outer-loop skills each do in their own "State update — mandatory final step" section — it's easy to skip for a short-track story precisely because no single skill's own instructions own that step.

---

## DoD Observations

1. **This story is itself a small, clean example of the outer-loop-gap this session flagged as a `capture-log.md` finding**: it fixes exactly one of the two structural gaps found live during `ep4-s1`'s own DoD, scoped narrowly and deliberately (the operator explicitly chose to sequence the larger people/roles-directory concern separately, into its own future `/discovery`, rather than scope-creeping this fix to cover both).
2. **The CI failure and its fix are themselves a useful, generalizable finding for this repo's own short-track process** (see Follow-up action 3 above) — worth surfacing to whoever next runs a short-track story, since the gap is structural to the short-track skill sequence's own documentation, not specific to this one story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for pmnv-s1 (Add Pod Manager to the sidebar nav).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Are any scope deviations or follow-up actions that should block release not flagged?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
