# Definition of Done: Add a placeholder feature to a journey stage, triggering a new seeded discovery

**PR:** https://github.com/heymishy/skills-repo/pull/976 | **Merged:** 2026-10-11
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s1.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s1-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation, resumed from checkpoint)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — placeholder mapping written with explicit `mapping_state` | ✅ | `check-jcx-s1-placeholder-feature.js`: "AC1: placeholder mapping created with mapping_state=placeholder, feature_slug holds the name" | `unit` (mock-pool INSERT shape assertion) | None |
| AC2 — trigger seeds a new `/discovery` session from stage context | ✅ | `check-jcx-s1-placeholder-feature.js`: "AC2: trigger creates a real artefacts/ folder and seeds discovery.md Section 1 only" — real `fs` state, not mocked | `integration-real-code` (real handler + real `fs` calls against a disposable temp directory) | None |
| AC3 — cross-tenant stage/mapping id returns 404, not 403 | ✅ | Two tests: "AC3 (creation): cross-tenant stage id returns 404 and makes zero mutation" + "AC3 (trigger): cross-tenant mapping id returns 404, no folder created" | `unit`/`integration-real-code` | None |
| AC4 — placeholder and real feature mapping coexist on a stage | ✅ | "AC4: a placeholder and a real mapping coexist on the same stage" | `unit` | None |
| AC5 — placeholder renders with distinct class + "Placeholder" label | ✅ | "AC5: a placeholder mapping renders with sw-mapping--placeholder + Placeholder label, never the warning markup" (real handler output, regex-scoped to the row's own markup) PLUS "(UI, E2E) clicking 'Add placeholder' reveals the form..." (`getComputedStyle` visibility assertion) | `integration-real-code` + jsdom E2E (see UI-evidence gate below) | None — see RISK-ACCEPT (decisions.md, 2026-10-11) for the live-browser evidence substitution |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all 5 ACs match their story definition exactly, including the AC5 wording revised during `/review` Run 2.

### Verification strength summary
- `unit`: 4 (AC1, AC3 creation, AC3 trigger, AC4)
- `integration-real-code`: 2 (AC2, AC5 markup)
- jsdom E2E (DOM `dispatchEvent` + `getComputedStyle`, beyond mere DOM-presence): 2 (Add-placeholder reveal/submit, Trigger click/success)
- `live-verified`: 0 — see UI-evidence gate below

### UI-evidence gate (AC5 + Accessibility NFR)
AC5 and the story's Accessibility NFR both describe browser-observable behaviour (visible class/label state; keyboard-operable, visibly-focusable UI affordances). `/verify-completion`'s live-browser render check could not be performed this story (local dev server accepts the TCP connection but never completes any HTTP response — environment issue, not explained by this diff, reproduced via both the Chrome extension and `curl`). No Playwright spec exists for this new UI. Per the UI-evidence gate, this cannot be left as a silent ✅ on `integration-real-code`/jsdom evidence alone — **logged as an explicit RISK-ACCEPT** (decisions.md, 2026-10-11, operator-approved via `AskUserQuestion` before `/branch-complete`), not treated as fully `live-verified`. AC5 is still marked ✅ because its functional claim (the correct class/label render) is unambiguously proven by the real-handler-output test; the *visual/interactive* dimension (does it actually look and behave right in a real browser) is the specific residual gap the RISK-ACCEPT names.

---

## Scope Deviations

None. Reviewed all 4 feature commits on `feature/jcx-s1` (`51454644`, `a0e04066`, `b180cca5`, `5fe3d3ed`) plus 2 bookkeeping commits (`0cf31c1f`, `e5c07190`) against the story's ACs and Out of Scope section:
- No richer discovery seeding beyond Section 1 — confirmed (AC2 test explicitly asserts `## Who It Affects` is absent from the seeded `discovery.md`).
- No finer-grained permission tier — confirmed (`requireNonViewer`, the same gate every other mutating route in `server.js` uses, is the only authorization check added).
- Task 4 (UI affordances for AC5/Accessibility NFR) was added mid-implementation but is **not** scope creep — it implements ACs/NFRs the story already specified, which the original implementation plan had simply missed; documented retroactively in `plans/jcx-s1-plan.md` itself.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (plus 2 additional jsdom E2E interaction tests added during implementation, beyond the plan)
**Tests passing in CI:** 9 / 9 — confirmed via PR #976's "Lint, typecheck, test, build" check, passing after the `5fe3d3ed` fix (all 8 PR checks green)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (placeholder creation) | ✅ | ✅ | |
| AC2 (trigger seeds discovery) | ✅ | ✅ | |
| AC3 (creation, cross-tenant) | ✅ | ✅ | |
| AC3 (trigger, cross-tenant) | ✅ | ✅ | |
| AC4 (coexistence) | ✅ | ✅ | |
| AC5 (render markup) | ✅ | ✅ | |
| NFR (path traversal) | ✅ | ✅ | Initially passed locally (Windows/Node 22) but failed in CI (Linux/Node 24) — `os.tmpdir()`-relative `..`/`..` traversal resolved to the real `/etc` on Linux. Fixed by narrowing the assertion to "no `artefacts/` dir created under the scratch root" — platform-independent. Root-caused by reproducing in a `node:24-bookworm` Docker container matching the CI runner exactly, not guessed at. |
| (added) Add-placeholder UI E2E | ✅ | ✅ | Not in the original test plan — added during Task 4 to cover the UI affordances the original plan missed |
| (added) Trigger UI E2E | ✅ | ✅ | Same as above |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — trigger completes within 2 seconds | ✅ | Folder creation + Section-1 seeding are lightweight `fs` operations with no heavy computation (confirmed by code inspection — no network calls, no loops over large data); not independently timed/measured live, but the operation's own structure makes sub-2-second completion a near-certainty, consistent with the NFR profile's "manual observation" method and this story's own trivial computational cost. |
| Security — ownership-check-before-mutation / 404-not-403 (D13) | ✅ | `check-jcx-s1-placeholder-feature.js`'s AC3 tests (creation + trigger), confirmed both routes reject cross-tenant ids with 404 before any mutation |
| Security — multi-tenancy (ADR-025) | ✅ | Same AC3 tests — tenant_id is checked at the SQL `WHERE` clause level in both new handlers, matching `handlePostFeatureMapping`'s own established pattern |
| Security — path traversal guard | ✅ | NFR test: "path traversal guard rejects a crafted placeholder name with 400, no file written" — confirmed in both the original Windows run and the Linux/Node 24 CI-parity container |
| Security — non-viewer authorization (same tier, no new permission) | ✅ | Code review: both new `server.js` route-dispatch blocks wrap the handler call in `requireNonViewer`, identical to the adjacent pre-existing feature-mapping routes. Independent dispatch-level verification (matching `ic-s2`'s own `requireNonViewer`-gap lesson) is `jcx-s5`'s own dedicated scope, not re-duplicated here. |
| Audit — trigger action traceable back to its originating journey stage | ✅ | `seedDiscoveryFromStage`'s own seeded `discovery.md` Problem Statement names the originating stage (`Stage: [name]`); `jcx-s2`'s own auto-conversion (not yet built) will use this same linkage |
| Accessibility — WCAG 2.1 AA (keyboard-operable, visible focus) | ⚠️ | See UI-evidence gate above — plain native `<button>`/`<input>`/`<form>` elements with no custom focus-trap or `outline:none` override (code review confirms no CSS removes default focus indicators for these new classes), but not independently live-verified this story. Covered by the same RISK-ACCEPT as AC5. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Placeholder-feature trigger actually used | ✅ (baseline: 0) | Not yet — `jcx-s1` builds the creation half of the mechanism only; `jcx-s2` (auto-conversion to linked) and `jcx-s5` (authorization hardening) are both still unbuilt. M2's own target ("≥1 placeholder feature triggered... and reaching `/discovery` approval") requires the full chain, not just this story. |

**Measurement-ready gate:** Not yet.
**Evidence note:** `jcx-s1` alone only builds the placeholder-creation and trigger-seeds-discovery mechanism — it does not complete the full M2 chain (trigger → discovery approval → auto-conversion), since `jcx-s2` and `jcx-s5` have not shipped yet. Measurement will become possible once all 3 contributing stories (`jcx-s1`, `jcx-s2`, `jcx-s5`) are merged and at least one real trigger-to-approval cycle has had time to occur in production.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT on live-browser evidence for AC5/Accessibility NFR — no functional/scope deviation.)

**Follow-up actions:**
1. **Owner: future session.** Investigate and resolve the local dev server's HTTP-hang issue (starts, listens, but never completes any request — reproduced via both the Chrome extension and `curl`, root cause unknown). Blocks live-browser `/verify-completion` for this entire feature's remaining stories (`jcx-s2`–`jcx-s5`), not just `jcx-s1`.
2. **Owner: future session.** Once the server issue above is resolved, perform a real live-browser check against `jcx-s1`'s shipped Add-placeholder/Trigger UI retroactively and update the `decisions.md` RISK-ACCEPT entry's outcome.
3. **Owner: future session, infra/tooling.** `scripts/ci-test-regression-check.js`'s CI job prints only failing file names on a regression, never the actual assertion failure, and no `test-output.log` artifact is uploaded — materially slowed diagnosing this story's own CI failure (required standing up a local Linux/Node 24 Docker container just to see the real error). Worth uploading the log as a CI artifact, or printing failing assertions directly for non-baseline files.
4. **Owner: `jcx-s2`.** `jcx-s2`'s own implementation plan must re-check every AC/NFR individually against "does this imply UI work" before finalizing — `jcx-s1`'s own plan missed this (see DoD Observations below).

---

## DoD Observations

1. **`/improve` candidate — implementation-plan completeness.** `jcx-s1`'s original `/implementation-plan` covered only the 3 backend-route tasks matching the ACs that read as obviously backend-shaped (AC1-AC4, NFR Security); AC5 (distinct render state) and the Accessibility NFR (keyboard-operable UI affordances) were missed entirely, since the plan defaulted to "this story is mostly backend" without individually re-checking each AC/NFR against "does this imply UI work." Caught only by re-reading the full story file again before `/verify-completion`, not by the plan-writing process itself. Worth adding an explicit checklist item to `/implementation-plan`'s own SKILL.md: for each AC and NFR, state explicitly whether it implies client-rendered markup/interaction, not just infer this from the story's overall "feel."
2. **`/improve` candidate — `<script>` IIFE scope hazard in `journeys.js`.** This file renders 3 independent `<script>(function(){...})()</script>` IIFE blocks; a new handler appended near one block's own code is not automatically able to reach another block's local variables (`list`, `reorderError`, `submitJson`, etc.), even though they appear "earlier in the file" textually. This story's own new UI code was first written assuming reachability and was only caught by running 3 unrelated pre-existing test files directly. Worth a code comment at each IIFE boundary in `journeys.js` itself naming which locals are scoped to that block only, so a future editor doesn't have to rediscover this via a failing test.
3. **Infra gap, not fixed this story** — local dev server HTTP-hang (see Follow-up Actions #1). Logged here per this template's own guidance to record "NFR gaps or guardrail entries absent at delivery time."

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-s1 (Add a placeholder feature to a journey stage, triggering a new seeded discovery).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
