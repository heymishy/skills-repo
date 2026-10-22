# Definition of Done: Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth

**PR:** https://github.com/heymishy/skills-repo/pull/1013 | **Merged:** 2026-10-22
**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s1.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s1-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handleGetPlaybackEvidence` resolves via `getJourneyByTenantProductSlug` (tenant_id + product_id, never the unscoped `getJourneyByFeatureSlug`); `isDodComplete` gates the list. | `integration-real-code` (test: "AC1: GET surface lists ACs scoped to the requesting tenant+product only") + `live-verified` (real browser check at `/verify-completion`: real headings, real AC list rendered in Chrome) | None |
| AC2 | ✅ | `handlePostCaptureTarget` → `setCaptureTarget`, CSRF-guarded, round-trip-through-read-path tested, crafted-`acId` rejection tested. | `integration-real-code` + `live-verified` (real `<form>`/`<input>` fields observed pre-filled in Chrome, Tab-reachable) | None |
| AC3 | ⚠️ | `handlePostCaptureTrigger` seeds the Playwright cookie from `req.sessionId`, navigates, captures, commits via `commitArtefact`. | `integration-real-code` only — `sessionPageAdapter` and `artefactCommitWriter` are both mocked in every test; no test invokes a real Playwright browser or a real GitHub Contents API call. | **Recorded, not a failure.** AC3's actual claim is about two external, real-world effects (a real headless browser navigating/screenshotting a real page; a real commit landing in the tenant's GitHub repo) that no automated test in this suite exercises for real — by design, ADR-018 forbids invoking real Playwright from the unit test chain, and no staging environment with a connected test repo exists yet to exercise the real GitHub commit path. See Follow-up Actions. |
| AC4 | ✅ | "Capture target not set" literal text, `targetSet: false`. | `integration-real-code` + `live-verified` (the exact text observed rendered in the real browser check) | None |
| AC5 | ⚠️ | `handleGetCaptureScreenshot` (new, tenant-scoped, not `/playback-media/`) serves the real file; `<img>` tag points at it. | `integration-real-code` (route itself: real file on disk, 200 + correct bytes, tenant-scoped 404s) + partial `live-verified` (the `<img>` tag/src structure was observed in the real browser check, but the actual image bytes did not load in that check — no live backend was running behind the static HTML preview used for the render check, so "the screenshot visibly displays" end-to-end was not directly observed, only inferred from the two passing pieces of evidence above). | **Recorded, not a failure.** See Follow-up Actions — a true end-to-end live check (real server, real captured screenshot, real browser) has not been performed. |
| AC6 | ✅ | Real `feature_slug` collision between two tenants: each sees only its own capture target/screenshot, full-body string search confirms no leak. | `integration-real-code` (real `journey-store.js`, no mocks for the isolation logic) — not a browser-rendering claim, so `integration-real-code` is sufficient evidence class | None |
| AC7 | ✅ | Guessed URL to a real other tenant's feature → 404, `{error:'not found'}` exactly, no slug/secret leak; mismatched tenant+product pair also tested with the same full-body/exact-shape assertions. | `integration-real-code` | None |
| AC8 | ✅ | New D37 adapter: throwing stub until wired (`0327e984`), wired as a separate commit (`90817c69`), behavioural wiring test proves two sessions produce two distinct, correctly-isolated pages (fake chromium, real cookie-seeding logic). | `integration-real-code` — the real `realGetAuthenticatedPage` cookie-seeding logic is exercised with an injected fake transport; the real Playwright `chromium.launch()` call itself is never exercised in the test suite. This is a deliberate, approved architectural trade-off (ADR-018: "unit test chain must not invoke Playwright"), not an unexamined gap — distinct from AC3/AC5 above, which have no such architectural exemption and remain genuinely unverified end-to-end. | None (architecturally justified, not a new gap) |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Reviewed all 30 commits on the branch (via `/verify-completion`'s own Step 3) — every one traces to an AC, a task from the implementation plan, or a documented review/verify-completion finding. Confirmed absent: looping capture across ACs (`ppc-s2`'s own scope), rate limiting (`ppc-s3`'s own scope), automatic AC→target derivation, video capture/redaction/ffmpeg polish (epic-level out of scope) — none of these were built.

---

## Test Plan Coverage

**Tests from plan implemented:** 38 / 17 originally scoped (see note below)
**Tests passing in CI/full suite:** 38 / 38, plus the full repo suite at 775/775 (2 pre-existing, unrelated, load-sensitive timing flakes — `check-pcr-s1-test-runner.js`, `check-spc5-capture-completeness-script.js` — confirmed clean on standalone re-run, not caused by this story)

**Note on the 17 → 38 growth:** the original test plan (written before implementation) scoped 17 tests across 8 ACs. Actual delivery needed 38, for legitimate, documented reasons found during implementation and review — not scope creep:
- Task 0's extraction of `captureAcScreenshots` (a Docker-deployability fix, not an AC) added its own regression test.
- AC8's wiring behavioural-correctness requirement (D37 rule 4) needed more test surface than originally estimated.
- `/verify-completion`'s own two findings (the missing UI layer; the `acId` path-traversal gap) each required dedicated new tests, since both were real, previously-undetected gaps, not re-tests of existing behaviour.

| Test file | Tests | Notes |
|-----------|-------|-------|
| `tests/check-ppc-s1-journey-store-helpers.js` | 7 | journey-store.js helper functions (isDodComplete, getCaptureTargetState, getJourneyByTenantProductSlug, setCaptureTarget) + the Postgres durability fix |
| `tests/check-ppc-s1-session-page-adapter.js` | 4 | D37 adapter stub + wiring (AC8) |
| `tests/check-ppc-s1-playback-evidence-route.js` | 21 | All 3 JSON-API handlers (AC1-AC7), NFR-SEC tests, path-traversal guard |
| `tests/check-ppc-s1-ui-layer.js` | 6 | HTML rendering, screenshot route, form redirects (built mid-`/verify-completion`) |

**Gaps (tests not implemented):** None against the final, corrected scope. Coverage gap audit (Step 4): the test plan's own gap table identified one pre-existing gap — "Accessibility (WCAG 2.1 AA) has no automated check" (this repo has no `axe`/`pa11y` tooling anywhere) — mitigated by a manual verification scenario, not a CSS-layout-dependent AC requiring a RISK-ACCEPT under CLAUDE.md's B2 rule (confirmed: "No CSS-layout-dependent ACs found" at test-plan time). The keyboard-navigation portion of that manual scenario WAS actually exercised live during `/verify-completion`'s real browser check (Tab-key traversal, visible focus ring confirmed) — partial real evidence beyond what the test plan anticipated, though a full WCAG 2.1 AA audit (colour contrast, comprehensive ARIA labelling) was not performed. See Follow-up Actions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Authentication (real session only, never `NODE_ENV=test` bypass) — ADR-018 | ✅ | Direct spy on `seedTestSession` during capture-trigger, asserts zero calls (`tests/check-ppc-s1-playback-evidence-route.js`) |
| Authorisation (tenant_id + product_id scoping) — ADR-025 | ✅ | AC6/AC7 real-collision and mismatched-pair tests |
| Input validation / path-traversal guard | ✅ | `ACID_RE` allowlist + resolved-path containment check, found and fixed by the final whole-arc review (`d2482cd5`), independently re-verified as closed |
| Secrets management (`session_id` never leaves the server) | ✅ | Dedicated full-body leak-check test across all 3 routes |
| Audit logging | N/A (explicitly deferred) | `nfr-profile.md`: "None identified for this feature at this stage — not a blocking gap" |
| Performance (single-AC capture time) | ⚠️ not formally measured | `nfr-profile.md` specifies no fixed SLA for this story ("expected a few seconds, observed during implementation") — no explicit wall-clock measurement was recorded as DoD evidence. Low severity: no SLA target exists to miss, and `ppc-s2` is where real per-feature timing becomes a measured AC. |
| Data residency | N/A | `nfr-profile.md`: no regulated constraint identified |
| Availability | N/A | `nfr-profile.md`: no dedicated SLA beyond the existing product's own |
| Compliance | N/A | `nfr-profile.md`: no framework identified, sign-off not required |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Self-service DoD validation adoption | ✅ (0%) | Not yet — no live paying tenants exist for `wuce` yet | `contributingStories` for this metric did not previously include `ppc-s1` despite the benefit-metric artefact's own Coverage Matrix naming it — corrected in this DoD run (see DoD Observations) |
| Metric 3 — Engineer manual-demo load removed | ✅ (not yet established) | Not yet — same reason | Same `contributingStories` gap, corrected in this DoD run |

Metric 2 (Time to DoD sign-off) is not assessed here — the benefit-metric artefact's own Coverage Matrix scopes it to `ppc-s2` only (the full-feature capture loop), not `ppc-s1`.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 8 ACs are satisfied in merged code. Two (AC3, AC5) are recorded with a verification-strength caveat rather than full `live-verified`/`production-observed` evidence — both are real, no-live-environment-exists limitations of this session, not implementation defects, and are named explicitly as Follow-up Actions rather than silently accepted.

**Follow-up actions:**
1. **AC3 — live-verify the real capture path.** Once a staging environment with a connected test repo exists, run one real end-to-end capture (real Playwright browser, real GitHub commit) and record the result as `live-verified` evidence. Owner: Platform Owner, due: before `ppc-s2`'s own DoD if a staging environment exists by then, otherwise flag at that point.
2. **AC5 — confirm the screenshot genuinely displays inline in a real running instance.** The render check used a static HTML file, not a live server, so the `<img>` never actually loaded a real image. Owner: Platform Owner, due: same staging-environment trigger as #1 — can likely be combined with that check.
3. **Accessibility — full WCAG 2.1 AA audit.** Only keyboard-reachability was live-confirmed this session; colour contrast and comprehensive ARIA labelling were not audited. This repo has no automated tooling (`axe`/`pa11y`) for this — a pre-existing, repo-wide gap, not specific to `ppc-s1`. Owner: Platform Owner, due: not urgent given the minimal surface (3 form fields + 2 buttons per AC), but should be swept before this surface grows.
4. **Performance — record a real wall-clock single-AC capture time** once a live capture is possible (ties to #1), per `nfr-profile.md`'s own stated measurement method ("Observed during implementation").

---

## DoD Observations

1. **`contributingStories` was never populated for this feature's metrics array, despite `benefit-metric.md`'s own Coverage Matrix explicitly naming `ppc-s1` for Metric 1 and Metric 3.** Found and fixed in this DoD run (`m1`/`m3` now correctly list `ppc-s1`; both recorded as `not-yet-measured` with a concrete evidence note, since no live tenant exists to measure against). **Candidate for `/improve`:** check whether `/benefit-metric` or `/definition` should write `contributingStories` at the time the Coverage Matrix is authored, rather than leaving it for `/definition-of-done` to backfill per-story — this gap could easily have gone unnoticed if Step 6 had been run mechanically without cross-checking the matrix.
2. **ADR-018/ADR-025 guardrail entries were last assessed at `/review` time (pre-implementation)**, with evidence citing the planned design, not the merged code. Refreshed both with DoD-level evidence citing the actual merged tests in this run. Not a defect — just worth noting that guardrail `assessedAt` timestamps from `/review` reflect design-time confidence, not implementation-time confirmation, and DoD is the point where that gets closed out.
3. **The final whole-arc review (at `/verify-completion`) found two real, substantial gaps that no individual task review caught**: the missing UI layer, and the `acId` path-traversal gap. Both are now fixed and independently re-verified. This is recorded here as a positive signal for the governed-pipeline process itself (the final review step did its job), not a story-level deviation — flagging as a `/improve` candidate: consider whether an earlier checkpoint (e.g. after Task 7, the first route handler) should include a lighter-weight "does this match the AC's literal wording" sanity check, to catch a JSON-vs-HTML mismatch sooner than the very end of the inner loop.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s1 (Walking skeleton — tenant-scoped surface and single-AC capture via session-reuse auth).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
