# Definition of Done: ppc-s7 — Record an in-app sign-off decision on captured evidence

**PR:** https://github.com/heymishy/skills-repo/pull/1031 | **Merged:** 2026-10-27
**Story:** `artefacts/2026-10-20-production-playback-capture/stories/ppc-s7-sign-off-recording.md`
**Test plan:** `artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s7-test-plan.md`
**DoR artefact:** `artefacts/2026-10-20-production-playback-capture/dor/ppc-s7-dor.md`
**Assessed by:** Claude (session)
**Date:** 2026-10-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — sign-off area shows Approve (primary)/Needs changes (destructive) buttons + optional comment field, plain `<form>` | ✅ | T1 (unit); real local browser check — seeded test session + journey, screenshot confirmed both buttons with correct variant styling and the comment textarea | `live-verified` | None. |
| AC2 — decision written to `journeys.data.signOff` with correct identity/timestamp/coverage snapshot, tenant-scoped | ✅ | T4 (write correctness), T5 (identity regression guard), T6 (coverage snapshot); real browser check — clicked Approve through the actual form, confirmed real identity (`e2e-tester`) and a real ISO timestamp on reload | `live-verified` | None. |
| AC3 — recorded decision renders as a status badge with escaped who/when/comment/coverage text | ✅ | T2 (XSS escaping), T7 (success badge), T7b (danger badge); real browser check — the submitted decision rendered correctly as an "Approved" badge with the comment text visible | `live-verified` | None. |
| AC4 — a stale decision (recorded against fewer ACs than currently captured) stays visible, always labelled with the originally-recorded snapshot | ✅ | T8 (original snapshot shown), T9 (never a bare unqualified "Approved") | `integration-real-code` (not independently re-confirmed live — would require a second real capture after the first sign-off, not exercised in the live check; the underlying logic is deterministic and directly tested) | None functionally, but this AC's live-verification is narrower than AC1–AC3's — see Follow-up Actions. |
| AC5 — sign-off write passes the same tenant/product access-control check as every other `ppc` write | ✅ | T11 (cross-tenant request denied, no write occurs) — reuses `_resolveJourney`'s existing guard, no new access-control code | `integration-real-code` (access-control logic, not a browser-rendering concern — consistent with `ppc-s1`'s own DoD precedent for the equivalent AC) | None. |
| AC6 — empty state reads "No decision recorded yet", distinct from the Approved badge | ✅ | T3 (unit); real browser check — confirmed before any decision was submitted | `live-verified` | None. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Reviewed the merged diff against the story's Out of Scope section — no edit/retract mechanism, no multi-approver workflow, no notification/alerting on decision, and `dodStatus` derivation itself is untouched (this story only records a human decision alongside it).

---

## Test Plan Coverage

**Tests from plan implemented:** 13/13 named test cases (all of T1–T13, including the two AC3 badge-variant tests T7/T7b, which is one more than the 13-count implies since T7b is an additional case within the same AC, not a separate plan line item).
**Tests passing in CI:** 13/13, plus 807/807 full suite (0 new failures vs. the 4 pre-existing, unrelated baseline failures: `ic-s1`/`ic-s3`/`ic-s4` canvas tests, `pcr-s1` test runner — none touch this story's files).

**Coverage gap audit (CSS-layout-dependent):** N/A — this story's test plan explicitly has no CSS-layout-dependent AC (`hasLayoutDependentGaps: false`, confirmed again at DoR's H-E2E check).

**CI evidence (PR #1031, all 8 required checks passed on final run):** Run assurance gate, Cross-Tenant Isolation Repeat Gate (20x repeat, zero-tolerance), Playwright E2E smoke tests, Lint/typecheck/test/build, Trace Validation, Watermark Gate, Scenario A E2E (staging), Scenario B E2E (staging). Two unrelated CI incidents occurred and were resolved during this PR's lifecycle, neither caused by this story's own changes:
1. Scenario A E2E (staging) initially timed out at the CI runner's 10-minute limit during Playwright's `apt-get install` step against a slow package mirror — the same root cause already seen on `ppc-s6`'s PR #1030 and on a post-deploy staging workflow (run 40554112300). Fixed properly this session via a separate PR (#1032, merged) adding apt-package caching to all 4 affected workflow files — confirmed working on the very next real `Staging Deploy` run (the previously-timing-out job completed in 3m41s afterward).
2. Scenario B E2E (staging) was separately cancelled mid-run with "Canceling since a higher priority waiting request for deploy-group exists" — a concurrency-group collision with the `Staging Deploy` run that PR #1032's own merge triggered moments earlier. Re-ran cleanly once that contention cleared.

---

## NFR Status

Three `ppc-s7`-relevant rows in `artefacts/2026-10-20-production-playback-capture/nfr-profile.md`, all addressed:

| NFR | Status | Evidence |
|---|---|---|
| Performance — sign-off write overhead (one additional JSONB write) | ✅ Met | `integration-real-code` — T12 asserts exactly one `setJourneyFields` call per submission |
| Security — identity via `req.session.login \|\| req.session.userId`, never `accessToken` | ✅ Met | `integration-real-code` — T5 asserts correct identity resolution and a source-level regression guard (no `accessToken` reference in `handlePostSignOff`'s own body) |
| Design-token compliance (`hasDesignSystemTrack: true`) | ✅ Met | `node scripts/check-design-tokens.js` run against `playback-evidence.js` — clean, no non-token colors (the destructive button and badge variants reuse the existing `--danger`/`--danger-soft`/`--success`/`--success-soft` tokens via locally-scoped CSS classes, not new hardcoded colors) |

Feature-wide `nfr-profile.md` status is **not** flipped to "Verified" — this was the last of `ppc-s5`/`ppc-s6`/`ppc-s7`'s own rows to reach DoD, and `ppc-s5` is already DoD-complete per an earlier session, so with this story's rows now addressed, all three are verified. Updating the profile's own `Status` line is listed as a Follow-up Action below since it requires touching that shared file, not something to bundle silently into this story's own DoD record.

---

## Metric Signal

**Found and fixed during this DoD run:** `benefit-metric.md`'s own coverage table (lines 63–64) has explicitly listed `ppc-s6` and `ppc-s7` as contributing to Metric 1, and `ppc-s7` as contributing to Metric 2, since 2026-10-26 — but `pipeline-state.json`'s `metrics[].contributingStories` arrays were never updated to match, for either story. Corrected as part of this DoD write (not a `ppc-s7`-only gap — `ppc-s6`'s own omission from `m1` is fixed here too, since leaving it half-fixed would be a strange partial state). See `decisions.md` entry below.

**Measurement-ready gate:** Not yet — same as every other story in this feature. `wuce` has no live paying tenants yet (pre-launch beta).

> **m1 (Self-service DoD validation adoption)**
> Signal: not-yet-measured
> Evidence note: `ppc-s7` adds a recorded sign-off decision, itself evidence the self-service loop was used end-to-end, not just opened — but still no live tenants exist yet to measure real adoption against.
> Date measured: null

> **m2 (Time to DoD sign-off)**
> Signal: not-yet-measured
> Evidence note: `ppc-s7` makes "recording a sign-off decision" literally true (`journeys.data.signOff`, timestamped) instead of the page-view proxy previously used — but `wuce` still has no live paying tenants yet, so no real sign-off cycle has run to measure a median time against.
> Date measured: null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Flip `nfr-profile.md`'s own `Status` line from "none of `ppc-s5`/`ppc-s6`/`ppc-s7` verified yet, pending their own DoD" to reflect that all three are now verified — a small edit to a shared file, deliberately not bundled silently into this story's own commit. Owner: next session touching that file, or standalone if prioritised sooner.
2. AC4 (stale-decision labelling) was verified via direct unit tests but not independently re-confirmed in the live browser check — doing so would require submitting a sign-off, then capturing new evidence, then reloading, which wasn't exercised live this session. The underlying logic is simple and deterministic (string comparison against a stored snapshot), so this is a low-risk gap, not a blocking one. Owner: next live-verification pass that touches this page, if one occurs before this becomes load-bearing.
3. Once `wuce` has a real pilot tenant, `m1`/`m2` should get their first real measurement — this is a repeat of the same Follow-up Action already logged on every other `ppc` story's own DoD in this feature, not new.

---

## DoD Observations

1. **Two separate, unrelated CI incidents landed on this same PR** — a genuine infra timeout (fixed via PR #1032, verified working on the very next real deploy) and a concurrency-group collision caused by that very fix's own merge landing moments before this PR's E2E jobs finished. Neither was a defect in `ppc-s7`'s own code; both were found, root-caused, and resolved within this session rather than silently retried past. `/improve` candidate: the `Staging Deploy` workflow's `deploy-group` concurrency setting could use a short queue/wait instead of a hard cancel for an already-running PR check, to avoid this exact collision recurring whenever a deploy and a PR's E2E job overlap.
2. **A real, dateable metrics-tracking drift was found and fixed**: `benefit-metric.md` and `pipeline-state.json`'s own `metrics[].contributingStories` arrays had been silently diverging since 2026-10-26 (`ppc-s6` never added to `m1`; `ppc-s7` never added to `m1`/`m2`), with no automated check catching it. `/improve` candidate: `check-pipeline-state-integrity.js` could add a check cross-referencing a feature's `benefit-metric.md` coverage table against its own `metrics[].contributingStories` arrays, so this class of drift fails CI instead of accumulating silently across multiple stories.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ppc-s7 (Record an in-app
sign-off decision on captured evidence, feature 2026-10-20-production-
playback-capture).
Check:
1. Do the AC Coverage verdicts (all ✅) match the cited test evidence in
   tests/check-ppc-s7-sign-off-recording.js and the live-browser
   verification described in /verify-completion?
2. Is the contributingStories fix (adding ppc-s6/ppc-s7 to m1, ppc-s7 to
   m2) correct per benefit-metric.md's own coverage table, or should it
   have been scoped differently?
3. Is Follow-up Action #1 (nfr-profile.md Status line) worth doing now
   rather than deferring?
```
