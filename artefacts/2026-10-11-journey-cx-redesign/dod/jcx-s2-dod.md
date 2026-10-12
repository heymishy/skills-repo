# Definition of Done: Placeholder mapping auto-converts to linked once its triggered discovery is approved

**PR:** https://github.com/heymishy/skills-repo/pull/978 | **Merged:** 2026-10-12
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s2.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s2-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — approval converts placeholder → linked, feature_slug updates | ✅ | `check-jcx-s2-placeholder-conversion.js`: "AC1: approval converts the mapping to linked with the real feature slug" — real `fs.readFileSync` against a real temp `discovery.md` fixture, not a mocked status check | `integration-real-code` (real file-system read for the approval check; mocked DB layer) | None |
| AC2 — unapproved discovery leaves mapping untouched | ✅ | "AC2: an unapproved discovery leaves the mapping untouched" | `integration-real-code` | None |
| AC3 — independent conversion across two mappings | ✅ | "AC3: two independent placeholder mappings convert independently" — asserts exactly one UPDATE, targeting only the approved mapping's own id | `integration-real-code` | None |
| AC4 — abandoned trigger persists indefinitely | ✅ | "AC4: an abandoned (never-triggered) placeholder never auto-converts" | `unit` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

### Verification strength summary
- `integration-real-code` (real `fs` reads): 3 (AC1, AC2, AC3)
- `unit`: 1 (AC4)
- NFR (tenant-scoping): 1, `integration-real-code`
- `live-verified`: 0 — see UI-evidence gate below

### UI-evidence gate
AC1's own full claim ("the stage now shows a real, linked feature") has a visual-rendering component. This story's diff does not touch `buildDeliveryAnnotations` (the rendering function) at all — it only flips the underlying `mapping_state`/`feature_slug` DB values that function already reads and renders correctly today (confirmed by `jcx-s1`'s own already-tested rendering logic: a `mapping_state !== 'placeholder'` row with a resolvable `feature_slug` renders via the pre-existing real-feature path, not the placeholder path). No new rendering risk is introduced. Still, the end-to-end live flow (trigger → approve → reload → see it convert) was not observed in a real browser — **logged as an explicit RISK-ACCEPT** (decisions.md, 2026-10-13), same blockers as `jcx-hotfix1` (local server hang unresolved; staging session logged out after that hotfix's redeploy, and the operator already declined to re-authenticate once this session).

---

## Scope Deviations

None beyond the already-documented, necessary `triggered_feature_slug` provenance-column addition (a real gap found in `jcx-s1`, not optional scope — without it, this story cannot function at all; see `jcx-s2-plan.md`'s own Architecture Note and the PR description).

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5
**Tests passing in CI:** 5/5 — confirmed via PR #978 (all 8 checks green), and independently verified in a Linux/Node 24 Docker container matching the CI runner before pushing (per the lesson from `jcx-hotfix1`'s own platform-dependent test bug)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (approval converts) | ✅ | ✅ | |
| AC2 (unapproved untouched) | ✅ | ✅ | |
| AC3 (independent conversion) | ✅ | ✅ | |
| AC4 (abandoned persists) | ✅ | ✅ | |
| NFR (tenant-scoped) | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — single-row state transition, no bulk operation | ✅ | Code review: `checkPlaceholderConversions` iterates only the placeholder mappings for the one journey being viewed (SQL-filtered), not a global scan |
| Security — tenant-scoping/ownership-check (D13/ADR-025) | ✅ | NFR test: "conversion check is tenant-scoped -- a cross-tenant mapping is never touched" — the SELECT itself filters by `tenant_id`, so no per-row check is even reachable for another tenant's rows |
| Accessibility — visual distinction placeholder vs. linked meets WCAG 2.1 AA, not color alone | ✅ | Unchanged from `jcx-s1`'s own already-verified rendering (text label "Placeholder" vs. the real feature's own name — never color-only); this story introduces no new visual state |
| Audit — conversion event traceable (when, which approval triggered it) | ⚠️ | The conversion itself is not independently logged (no audit row, no console log on success) — only discoverable by diffing `mapping_state`/`feature_slug` before and after. Not blocking (the DoR's own Assumption didn't specify a log format), but a real, minor gap — see Follow-up Actions. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Placeholder-feature trigger actually used | ✅ (baseline: 0) | Not yet | `jcx-s1` + `jcx-s2` together now build the FULL mechanism M2's own target requires ("≥1 placeholder feature triggered and reaching `/discovery` approval"). Still not yet measured — no real trigger-to-approval cycle has occurred in production since `jcx-s2` merged. `jcx-s5` (authorization hardening) is the last contributing story before this is fully shippable to real usage. |

**Measurement-ready gate:** Not yet.
**Evidence note:** The mechanism is now functionally complete (trigger + conversion), but `jcx-s5`'s own authorization verification pass hasn't run yet, and no real operator has completed a full cycle in production.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT on live-browser evidence — no functional/scope deviation beyond the documented, necessary provenance-column addition.)

**Follow-up actions:**
1. **Owner: future session.** Once the local dev server's hang is fixed or a fresh staging login is available, perform the real end-to-end live check named in the RISK-ACCEPT (decisions.md, 2026-10-13).
2. **Owner: future session, minor.** The conversion event has no dedicated audit log line — add one (e.g. `console.log` matching this app's own existing event-logging convention) if `jcx-s5`'s own authorization-hardening pass finds audit traceability is actually needed for a real investigation, rather than pre-building it speculatively now.
3. Carries forward all 3 follow-up actions already logged in `jcx-hotfix1-dod.md` (mock-pool SQL blind spot, live-browser verification urgency, staging session logout-on-redeploy not yet confirmed as expected behavior) — unchanged, not re-duplicated here.

---

## DoD Observations

1. Same `/improve` candidates as `jcx-hotfix1-dod.md` apply here too (live-browser verification urgency after a RISK-ACCEPT; mock-pool tests cannot catch real SQL errors) — not re-logged as new candidates, just reaffirmed by a second story hitting the same blockers.
2. **New observation:** a DoR's own "Assumption" section can be WRONG about something it assumes already exists upstream (jcx-s1's provenance mechanism) without that being caught until implementation time. The DoR's own H8-ext cross-story dependency check (confirming `jcx-s1 dorStatus: signed-off`) checks that the upstream story is READY, not that its own implementation actually delivered every property a downstream story's Assumption relies on. Worth considering for `/definition-of-ready`'s own SKILL.md: when a story's Assumption section says "X already exists from story Y," that claim should be spot-checked against Y's actual shipped code at DoR time if Y is already merged, not just trusted from Y's own DoR-time plan.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for jcx-s2 (placeholder auto-conversion).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the RISK-ACCEPT on live-browser evidence reasonable given the stated blockers, or should it be escalated?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Is the DoD Observation about DoR Assumption-checking worth acting on (e.g. feeding into /improve)?
Report findings as HIGH / MEDIUM / LOW.
```
