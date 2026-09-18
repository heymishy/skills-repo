# Definition of Done: Filter Stage Visibility by Role

**PR:** [#901](https://github.com/heymishy/skills-repo/pull/901) | **Merged:** 2026-09-18
**Story:** artefacts/new-feature-2b74a292/stories/ep2-s2.md
**Test plan:** artefacts/new-feature-2b74a292/test-plans/ep2-s2-test-plan.md
**DoR artefact:** artefacts/new-feature-2b74a292/dor/ep2-s2-dor.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-09-18

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (engineer default view: 4 stages including "coding") | ⚠️ | `tests/e2e/ep2-s2-stage-visibility.spec.js` (AC2 test — engineer path), `stage-visibility.js` unit tests, integration tests | `integration-real-code` + Playwright evidence (real DOM assertions, real API response) | **Deviation**: implemented as 3 stages (`test-plan`/`review`/`definition-of-ready`), not the AC's literal 4-stage text. "coding" cannot exist in this codebase's real `completedStages` data model — confirmed by reading every real `completeStage()` call site; the inner coding loop and DoD happen entirely outside the chat-session flow that populates this data. RISK-ACCEPTed and logged in `decisions.md` before any code was written. |
| AC2 (product default view differs) | ✅ | `tests/e2e/ep2-s2-stage-visibility.spec.js` (AC1+AC3 test — product path), same suite | `integration-real-code` + Playwright evidence | None. |
| AC3 (show-all toggle reveals all, no refresh) | ✅ | `tests/e2e/ep2-s2-stage-visibility.spec.js` (AC1+AC3 test) | `integration-real-code` + Playwright evidence (genuine union check, `aria-pressed` state, no-reload marker, keyboard round-trip) | None. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

**UI-evidence gate:** all 3 ACs describe browser-observable behaviour (stage list content, toggle state). Gate satisfied via Playwright evidence (option 2 of 3) for every AC — real visible-state assertions (item counts, text content, `aria-pressed`, focus state), not DOM-presence-only.

**Architecture Constraints deviation (story artefact, not an AC):** the story's own Architecture Constraints and Dependencies sections both name a "`role_definitions` table" defining `stageVisibility` per role as a hard dependency. No such table exists or was created — role comes from `feature_collaborators.role_id` (the same source `ep2-s1` already established), and stage-visibility mapping is a new hardcoded constant (`stage-visibility.js`'s `STAGE_VISIBILITY_BY_ROLE`), following the same "hardcode now, DB-backed later" precedent `pod-store.js`'s `VALID_ROLES` already set in `ep1-s1`. Fully documented in `decisions.md` before any code was written.

**Cross-artefact note on the "coding" gap:** the same "coding" stage name appears not just in this story's own AC1 text but in `benefit-metric.md`'s own "Role-filtered visibility" metric definition ("an engineer role sees test-plan/DoR/coding stages by default") — confirming this is a gap baked into this feature's benefit-metric and story artefacts from the start, not a one-off typo introduced later. Worth a future correction to those source artefacts (out of scope for this DoD to fix retroactively).

---

## Scope Deviations

None. Checked against the story's Out of Scope list (hiding stages permanently, preventing "show all" access, backend-enforced visibility) — none of these were implemented. The real endpoint (`GET /api/journey/:journeyId/stage-visibility`) returns both `visibleStages` and `allStages` in every response; nothing is server-side hidden — filtering is purely client-side, matching the explicit "Enforcing role-based access at the backend" exclusion. Checked against the epic's own out-of-scope section (`artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md`) — no violation found.

---

## Test Plan Coverage

**Tests from plan implemented:** 10/12 (2 NFR-latency tests explicitly RISK-ACCEPTed, not automated — see NFR Status below)
**Tests passing in CI:** 11/11 implemented (9 Node assertions + 2 E2E tests covering AC1/AC2/AC3 together — the plan's literal 3-separate-E2E-test-block structure was consolidated into 2 tests reflecting the real identity-resolution constraint discovered during Task 6, documented in `decisions.md`)

| Test (plan name) | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `stage-visibility.filter.engineer-default-view` | ✅ | ✅ | `stage-visibility.js` unit test + E2E engineer-role test |
| `stage-visibility.filter.product-default-view-differs` | ✅ | ✅ | `stage-visibility.js` unit test + E2E product-role test |
| `stage-visibility.toggle.show-all-reveals-all-seven` | ✅ | ✅ | E2E toggle test — real 8-stage universe, not the plan's literal "seven" (an earlier planning-stage miscount corrected against the real `ALL_STAGES` value before code was written) |
| `stage-visibility.integration.multi-role-feature-load-full-path` | ✅ | ✅ | `testMultiRoleFullPathLoad` (Task 5) |
| `stage-visibility.integration.role-filtering-isolation-by-tenant` | ✅ | ✅ | `testRoleResolutionIsolatedPerCollaborator` (Task 5) — rewritten mid-task after being found "true by construction" by code-quality review; the fix was empirically verified twice (once by the fixer, once independently by a re-reviewer who personally reproduced a fail-then-pass proof by injecting the bug class it claims to catch) |
| `stage-visibility.e2e.engineer-default-renders-on-page-load` | ✅ | ✅ | E2E engineer-role test |
| `stage-visibility.e2e.product-default-differs-same-feature` | ✅ | ✅ | E2E product-role test |
| `stage-visibility.e2e.show-all-toggle-no-refresh` | ✅ | ✅ | E2E toggle test |
| `stage-visibility.nfr.stage-list-load-latency` | ❌ | N/A | RISK-ACCEPT, not automated — see NFR Status |
| `stage-visibility.nfr.toggle-response-latency` | ❌ | N/A | RISK-ACCEPT, not automated — see NFR Status |
| `stage-visibility.nfr.stage-list-keyboard-navigation` | ✅ | ✅ | E2E a11y block (focus + Enter-key toggle activation) |
| `stage-visibility.nfr.toggle-button-accessible` | ✅ | ✅ | Real `<button>` element with `aria-pressed`, confirmed keyboard-focusable/activatable by default — verified directly, not assumed |

**Gaps (tests not implemented):** the 2 NFR-latency tests above. RISK-ACCEPTed, matching this feature's own established precedent (`ep1-s1`/`ep1-s2`/`ep1-s3`/`ep2-s1` all RISK-ACCEPTed their own NFR-Perf-1 for the identical reason — no plausible path to the stated threshold at this scale: a single lookup/join, or a synchronous client-side re-render of ≤8 items with no network call).

**Full CI evidence (merge commit `0f5eec89`):** all 8 PR checks passed on PR #901, including "Lint, typecheck, test, build," "Playwright E2E smoke tests," "Scenario A/B E2E (staging)," "Run assurance gate," "Validate traceability chain," "Watermark gate," and "Cross-tenant isolation spec (20x repeat, zero-tolerance)." One CI run of "Scenario B E2E (staging)" failed on first attempt with a `502` on an unrelated, `@real-staging`-tagged spec (`b1-formed-idea-outer-loop-story-map.spec.js`, a real-LLM turn-submission call with no relation to this story's own diff) — confirmed transient by re-running the exact same job, which then passed cleanly. `/verify-completion`'s own mandatory route-coverage check (this diff touches `routes/journey.js` and `routes/features.js`) found 2 pre-existing, unrelated local E2E failures, both root-caused and logged in `decisions.md`: a second confirmed instance of an already-known hardcoded-port-3000 assertion, and a newly-found gap where an older sibling story's own fixture (`frsr-s1-feature-row-session-resume.spec.js`) predates a later story's repo-connection gate (`das-s2`) and gets a 409 instead of the expected 303.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Role-filtered default view applied on page load (no separate click) | ✅ | E2E tests confirm the filtered view renders on initial `page.goto`, before any interaction |
| "Show all stages" toggle persists for the user's current session (localStorage) | ✅ | `stage-list.js` implements this via `localStorage`, keyed uniquely per journeyId; cross-session persistence was explicitly out of scope per the story's own NFR wording ("cross-session persistence deferred") |
| (Story-level, not in a formal profile) Stage-list load latency ≤500ms / toggle response ≤200ms | ⚠️ RISK-ACCEPT | Not automated. No feature-level `nfr-profile.md` exists for this feature (confirmed absent, same gap noted in every prior DoD this session — falls back to story-level NFR fields per this skill's own Step 5 instruction). Load latency: a single tenant-scoped collaborator lookup plus in-memory constant access, no plausible path to 500ms at any realistic scale. Toggle latency: a pure synchronous client-side re-render of ≤8 already-fetched items, no network round trip, no plausible path to missing 200ms. |

---

## Metric Signal

**Measurement-ready gate:** yes.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Role-filtered visibility (`benefit-metric.md`: "A user assigned a product role sees discovery/benefit-metric/definition stages by default; an engineer role sees test-plan/DoR/coding stages by default. A conductor role sees all stages. All stages remain accessible on request." — "Measured via: E2E test confirming stage visibility matches role; manual verification in beta.") | ❌ — no `metrics[]` array exists yet in `pipeline-state.json` for this feature (same structural gap already flagged in every prior story's own DoD this session — not re-fixing here, outside this story's scope) | **Yes — the metric's own stated measurement method (E2E test confirming stage visibility matches role) now exists and passes.** This is a stronger signal than `ep2-s1`'s own DoD recorded: that story proved a *capability* existed structurally; this story directly satisfies the benefit-metric's own literal "Measured via" clause. The one qualifier: the metric's own text also names "coding" for the engineer role, which this story's own AC1 deviation (above) confirms is unsatisfiable as written — the metric definition itself should be corrected to match the real 3-stage engineer view, not just the story artefact. | Signal recorded as `on-track` (not `not-yet-measured`) — unlike `ep2-s1`, this metric's stated measurement mechanism is now literally in place and passing, not merely inferred capability. `pipeline-state.json` has no `metrics[]` array to write this signal into structurally (same gap noted above); recorded narratively here per this skill's own fallback guidance. |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **[Cross-artefact correction]** `benefit-metric.md`'s "Role-filtered visibility" metric and `stories/ep2-s2.md`'s own AC1 text both name "coding" as a stage an engineer should see by default — confirmed structurally unsatisfiable in this codebase's real data model (see AC1's deviation above). Worth a source-artefact correction (updating both to the real 3-stage engineer view) so future readers of this feature's own artefacts don't re-derive the same investigation. Not fixed here — artefact correction, not a code change, and arguably belongs to whoever owns `/improve` for this feature.
2. **[Pre-existing, unrelated, already logged]** `tests/e2e/wuce20-artefact-index-html.spec.js`'s own instance of the hardcoded-port-3000 assertion (a second confirmed occurrence of the same bug class already logged against `feature-navigation.spec.js` in `ep2-s1`'s own DoD) — logged, not fixed here.
3. **[Pre-existing, unrelated, newly found and logged]** `tests/e2e/frsr-s1-feature-row-session-resume.spec.js` predates the `das-s2` repo-connection gate and never seeds a repo before creating a feature, producing a deterministic `409` instead of `303` on both of its tests. Logged in `decisions.md`, not fixed here (out of scope for this story; the fix is a one-line addition of a `/test/seed-product-repo` call to that older spec's own setup).
4. `pipeline-state.json`'s feature-level `metrics[]` array for `new-feature-2b74a292` is still not populated (5th consecutive story in this feature to note this same gap across all its DoDs) — worth fixing once, structurally, rather than a 6th narrative workaround in a future story's DoD.
5. Optional, not blocking: a genuine live-browser check (Claude-in-Chrome or equivalent) against the now-live staging deployment, to upgrade AC1-3's evidence tier from `integration-real-code`/Playwright to `live-verified` — the existing Playwright evidence already satisfies the mandatory UI-evidence gate, so this is a strengthening opportunity, not an open gap.

---

## DoD Observations

1. **A genuinely vacuous integration test was found and fixed within its own task's review cycle** (not after merge, unlike `ep1-s3`'s own comparable Task 7 finding): `testRoleResolutionIsolatedPerCollaborator` originally picked two same-role collaborators and asserted their views were equal — true by construction regardless of whether role resolution actually worked. Rewritten to test the resolution mechanism directly, and empirically verified twice (once by the implementer who made the fix, once independently by a re-reviewer who personally injected the bug class it claims to catch and confirmed a genuine fail-then-pass cycle) — not just argued to be correct. **/improve candidate**: this is now the second vacuous-test finding in this same feature's delivery record (the first being `ep1-s3`'s own E2E-test finding). Both were caught before merge, which is the system working as intended — but the recurrence across two different stories suggests it may be worth an explicit "would this test genuinely fail if the feature were broken?" prompt in `/tdd`'s or `/subagent-execution`'s own reviewer-dispatch instructions, rather than relying on each individual reviewer to think to ask it.
2. **A real identity-resolution constraint in the E2E design was solved with a deliberate, documented, and independently-verified design deviation, not a workaround that quietly weakened coverage**: no demo roster member has role `product`, and the fixed E2E test identity can never match a UI-built pod's roster. The implementer bypassed the pod-manager UI and called the real pod-creation API directly with the test session's own login — still exercising the full real HTTP → DB → client-render chain end-to-end, confirmed by both the spec-compliance reviewer and this DoD's own author independently re-verifying every factual claim in the implementer's own investigation (auth fixture behaviour, role-resolution logic, roster contents, and the absence of CSRF/allowlist checks on the pod-creation route) against the real source, not just trusting the report.
3. **This story's own implementation plan learned directly from the immediately-preceding story's mistake and applied the fix proactively**: `ep2-s1` shipped a client script and its serving route as two separate tasks, only discovering the missing route via its own E2E run after PR open. `ep2-s2`'s Task 3 deliberately paired the client component and its static route in one commit from the start, specifically citing that prior gap as the reason. No equivalent bug recurred.
4. **A route/handler E2E coverage check, run as part of this story's own `/verify-completion`, surfaced a genuinely new pre-existing finding** (the `frsr-s1`/`das-s2` repo-gate gap) beyond simply re-confirming the already-known port-3000 issue — this is the second consecutive story in this feature where the mandatory coverage check has found something beyond what it was originally added to catch, suggesting the check continues to earn its cost as this feature's surface area grows.
