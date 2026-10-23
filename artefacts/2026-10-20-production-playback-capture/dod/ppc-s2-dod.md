# Definition of Done: Extend to full-feature capture loop with timing validation

**PR:** https://github.com/heymishy/skills-repo/pull/1014 | **Merged:** 2026-10-23
**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s2.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s2-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-23

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handlePostCaptureAll`'s sequential loop reuses `_captureOneAc` (the same single-AC mechanism `ppc-s1` established) across every AC returned by `buildCaptureAllList`, using one authenticated page for the whole run. | `integration-real-code` (real, unmocked route/loop logic; the underlying Playwright navigation itself is never exercised in the test chain, per ADR-018 — the same architecturally-approved exemption already recorded for `ppc-s1` AC8) + `unit` (`buildCaptureAllList` target/no-target split) | None |
| AC2 | ✅ | `capture-all-lock.js` rejects a second `tryAcquireLock` while one is held (real, unmocked lock module); `_renderCaptureAllProgress` emits `aria-live="polite"` progress markup; wiring tests confirm the button/progress markup toggle correctly when a lock is/isn't held. | `integration-real-code` + `live-verified` (real browser render check at `/verify-completion`: progress markup and trigger-button visibility confirmed in Chrome against real generated HTML) | None |
| AC3 | ⚠️ | `measureCaptureDuration` is called with real, unmocked `Date.now()` values around the real capture loop (test plan's own integration test asserts a positive, non-hardcoded duration); `captureAllDuration`/`captureAllCompletedAt` are persisted. | `integration-real-code` only. | **Recorded, not a failure.** AC3's actual claim is that a real elapsed time is measured "against a real feature with its real AC count" and recorded as DoD evidence. No live/staging run against a real, multi-AC, DoD-complete feature with real capture targets has been performed — zero E2E specs in `tests/e2e/` reference the new `capture-all`/`playback-evidence` routes (grep-confirmed), and no connected test repo with such a fixture exists in staging yet. This extends `ppc-s1`'s own Follow-up Action #1 (same root cause: no staging environment with a connected test repo existed at that DoD either). See Follow-up Actions. |
| AC4 | ⚠️ | `checkTimingThreshold` correctly flags `>60000ms` (strictly greater-than, boundary-tested) without failing the run; `decisionsLogWriter.appendScopeNote` is called with a SCOPE-note payload when the threshold is exceeded, using `fetchRepoPath`/`realCommitArtefact` against the tenant's own connected repo. | `integration-real-code` only — the decisions-log-writer's own tests mock `global.fetch`; no real GitHub Contents API commit has been exercised. | **Recorded, not a failure.** Same root cause as AC3 — no real run against a real tenant repo has occurred, so the >60s trigger condition has never fired for real and the real-commit path is unverified end-to-end. The mechanism is correctly built and unit/integration tested; what's missing is a live occurrence. See Follow-up Actions. |
| AC5 | ✅ | A mid-loop capture failure is caught per-AC (`try`/`catch` inside the loop) and does not abort the run; `captured`/`failed` arrays are independent; `captureAllFailed` persists the failure keyed by `acId` and is cleared on a successful retry. | `integration-real-code` (failure-injection test, resilience logic) + `live-verified` (real browser render check: the `role="alert"` retry notice confirmed rendered in Chrome) | None |
| AC6 | ✅ | `buildCaptureAllList` returns untargeted ACs in a separate `skipped` list with a named reason (`"no capture target set"`); the JSON API response (non-form callers) returns this list verbatim. | `integration-real-code` + `unit` | **Recorded, minor.** A real browser user triggering "Capture all evidence" is redirected (302) back to the GET page rather than receiving the JSON `skipped` list — the only run-scoped "why" a browser user actually sees is `ppc-s1`'s pre-existing, always-on `<p role="status">Capture target not set</p>` per AC row, not a dedicated per-run skip summary correlated to the action they just took. This satisfies AC6's literal requirement (the reason is visible, not a silent omission, and doesn't block other ACs) but is a narrower mechanism than a fresh UI build might have chosen. Not blocking; candidate for a later UX polish pass if tenants report confusion. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. `git diff --stat` between `master` (pre-merge) and PR #1014's merge commit shows exactly the 11 files named in the implementation plan (route handler, `capture-all.js`, `capture-all-lock.js`, `decisions-log-writer.js`, `journey-store-pg.js` allowlist, `server.js` mount, 2 new test files, the plan artefact, and `capture-log.md`). Confirmed absent: rate limiting (`ppc-s3`'s own scope), an async job queue (AC4's trigger never fired for real — correctly not built speculatively), video capture/redaction/ffmpeg polish (epic-level out of scope).

---

## Test Plan Coverage

**Tests from plan implemented:** 26 / 10 originally scoped (see note below)
**Tests passing in CI/full suite:** 26 / 26 (re-run fresh in this DoD session via `node tests/check-ppc-s2-capture-all-helpers.js` and `node tests/check-ppc-s2-capture-all-route.js`, both 0 failed), plus all 8 required PR checks green on PR #1014 (lint/typecheck/test/build, assurance gate, traceability chain, watermark gate, cross-tenant isolation, Playwright E2E smoke, and both real-staging E2E scenarios).

**Note on the 10 → 26 growth:** the original test plan scoped roughly 10 automated tests (5 unit + 5 integration) across 6 ACs. Actual delivery needed 26, for legitimate, documented reasons found during implementation and the two-stage task review — not scope creep:
- Task 0's `_captureOneAc` extraction needed a dedicated regression check that rationale comments survived the refactor (caught and fixed by its own code-quality review).
- Task 3's code-quality review found the progress markup had no integration-level wiring test (only the pure leaf function was tested) — 2 tests added.
- The mandatory final whole-arc review found two real cross-task gaps (real browser form submissions weren't redirected; AC5's failure state wasn't persisted/rendered, including in the empty-list branch) — each required its own dedicated regression tests across two fix rounds, plus an explicit ADR-018 regression test and a CSRF/server-wiring/`fdn-s1`-allowlist test.

| Test file | Tests | Notes |
|-----------|-------|-------|
| `tests/check-ppc-s2-capture-all-helpers.js` | 9 | `buildCaptureAllList`, `measureCaptureDuration`, `checkTimingThreshold` (incl. boundary), lock concurrency (2 tests), `aria-live` markup, 2 progress-wiring integration tests |
| `tests/check-ppc-s2-capture-all-route.js` | 17 | CSRF guard, ADR-018 regression, server-wiring, `fdn-s1` allowlist, form-redirect fixes (2), `captureAllFailed` persist/render/escape/clear-on-retry (plus the decisions-log-writer and AC1–AC6 route tests covered within this file) |

**Gaps (tests not implemented):** None against the final, corrected scope. Coverage gap audit (Step 4): no `CSS-layout-dependent` ACs were identified at test-plan time (`H-E2E: ✅ (N/A)` in the DoR), so no RISK-ACCEPT was required for that category. The real gap that exists — AC3/AC4's missing live-run evidence — is a staging-infrastructure gap, not a `CSS-layout-dependent` test-plan gap, and is tracked separately in Follow-up Actions below rather than under this audit.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (full-feature capture time measured and reported as real DoD evidence) | ⚠️ | The measurement *mechanism* (`measureCaptureDuration`, real unmocked timer) is built and tested, but no real number has been recorded yet — same staging-environment gap as AC3/AC4 above. `nfr-profile.md`'s own Gap row ("Real full-feature capture timing is unknown until `ppc-s2` is built... At `ppc-s2` DoD") remains open; not closed by this DoD. |
| Security (inherits `ppc-s1`'s session-handling constraint unchanged) | ✅ | Dedicated test asserts `capture-all` never invokes the `NODE_ENV=test` auth-bypass path (ADR-018); reuses `ppc-s1`'s own session-reuse mechanism and tests for `session_id` never leaving the server boundary — no new exposure introduced by the loop. |
| Accessibility (progress indicator exposed to assistive technology) | ✅ | Automated `aria-live="polite"` presence check (unit test) + manual verification scenario in `ppc-s2-verification.md`'s Edge Case; the live browser render check during `/verify-completion` confirmed the markup renders correctly, though the screen-reader announcement itself was not separately tested live in this DoD session. |
| Audit — None identified | ✅ | `nfr-profile.md`: "None identified for this feature at this stage — not a blocking gap", unchanged from `ppc-s1`. |
| Data residency | N/A | `nfr-profile.md`: no regulated constraint identified. |
| Availability | N/A | `nfr-profile.md`: no dedicated SLA beyond the existing product's own. |
| Compliance | N/A | `nfr-profile.md`: no framework identified, sign-off not required. |

---

## Metric Signal

**Measurement-ready gate:** Not yet — `product/roadmap.md` confirms wuce has no live paying tenants yet (pre-launch beta); the only usage possible right now is the operator's own dogfood tenant, which has not yet run a real capture-all cycle end-to-end (ties directly to the AC3/AC4 gap above).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Self-service DoD validation adoption | ✅ (0%) | Not yet — no live paying tenants exist for `wuce` yet | `contributingStories` did not previously include `ppc-s2` despite the benefit-metric artefact's own Coverage Matrix naming it ("makes it meaningful at feature scale") — corrected in this DoD run. |
| Metric 2 — Time to DoD sign-off | ✅ (not yet established — no self-service mechanism existed before this feature) | Not yet — same reason; this is the metric `ppc-s2` itself exists to move, but it requires a real sign-off cycle to run against real tenant usage, which hasn't happened yet | `contributingStories` was empty; now set to `["ppc-s2"]` per the Coverage Matrix ("the full-feature, single-sitting capture loop"). |
| Metric 3 — Engineer manual-demo load removed | ✅ (not yet established) | Not yet — same reason | `contributingStories` did not previously include `ppc-s2` — corrected in this DoD run. |

Signal recorded for all three: `not-yet-measured`, with the evidence notes above (not blank, not "N/A").

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 6 ACs are satisfied in merged code at the mechanism level. Two (AC3, AC4) carry a verification-strength caveat — no real, live run against a real multi-AC tenant feature has occurred yet — rather than full `live-verified` evidence. Both are real, no-staging-fixture-exists limitations of this session, not implementation defects, consistent with `ppc-s1`'s own DoD precedent for the same class of gap. AC6 carries one minor, non-blocking deviation (see AC Coverage table).

**Follow-up actions:**
1. **AC3/AC4/Performance NFR — run one real capture-all against a real, multi-AC, DoD-complete tenant feature with real capture targets, once a staging environment with a connected test repo and such a fixture exists.** Record the actual elapsed duration as real DoD evidence, and confirm whether it ever exceeds the 60s threshold in practice (if so, confirm the SCOPE note lands correctly in that tenant's real `decisions.md`). This supersedes and combines `ppc-s1`'s own Follow-up Action #1 (same unresolved root cause, now also covering `ppc-s2`'s timing-specific ACs). Owner: Platform Owner, due: before this feature's `/release`, or flagged again at `ppc-s3`'s own DoD if still unresolved.
2. **AC6 — consider a dedicated per-run "skipped" summary in the HTML page** (distinct from the always-on per-AC "Capture target not set" status) if real tenant usage shows confusion about which ACs a given capture-all run actually skipped versus which have simply never had a target set. Owner: Platform Owner, due: not urgent — UX polish, not a correctness gap.
3. **`ppc-s1`'s own open Follow-up Actions #2–#4** (AC5 real inline-image load check, full WCAG 2.1 AA audit, real single-AC capture timing) remain open and are not superseded by this story's own work — tracked separately on `ppc-s1-dod.md`.

---

## DoD Observations

1. **`contributingStories` for Metrics 1, 2, and 3 did not include `ppc-s2` despite `benefit-metric.md`'s own Coverage Matrix explicitly naming it for all three.** Found and fixed in this DoD run, mirroring the identical gap found and fixed at `ppc-s1`'s own DoD. **Candidate for `/improve`:** this is now the second consecutive story in this feature where `contributingStories` needed a DoD-time backfill — strengthens the case (already raised at `ppc-s1` DoD) for `/benefit-metric` or `/definition` writing `contributingStories` at Coverage Matrix authoring time rather than leaving it to accumulate as a per-story DoD correction.
2. **This story is a direct, real-world confirmation of the governed pipeline's own "final whole-arc review catches what per-task review can't" design rationale.** Two genuine cross-task gaps (unredirected form submissions; AC5's unpersisted failure state, found twice — once in the general case, once again in the empty-list branch on the second pass) were caught only by the mandatory final review after all 8 tasks individually passed their own spec+quality review. Not a story-level deviation — recorded as a positive process signal, same framing as `ppc-s1-dod.md` Observation 3.
3. **AC3/AC4's "real timing data" requirement is structurally gated on staging infrastructure that still doesn't exist**, two stories in a row now (`ppc-s1`'s Follow-up #1, now this story's #1 above). **Candidate for `/improve`:** if a third story in this feature (`ppc-s3`) hits the same gap, consider whether the feature's own `/definition-of-ready` should have required a staging-fixture spike before any story depending on real timing/live-environment evidence was allowed to proceed, rather than discovering the same blocker independently at each story's DoD.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s2 (Extend to full-feature capture loop with timing validation).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
