# Definition of Done: Auto-sync a product's pipeline-state.json immediately on repo connection

**PR:** https://github.com/heymishy/skills-repo/pull/1059 | **Merged:** 2026-11-09
**Story:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
**Test plan:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s1-auto-sync-on-repo-connect-test-plan.md
**DoR artefact:** artefacts/2026-11-08-unified-reactive-proactive-visibility/dor/urpv-s1-auto-sync-on-repo-connect-dor.md
**Assessed by:** Claude Sonnet 5
**Date:** 2026-11-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-urpv-s1-auto-sync-on-connect.js`: "AC1: triggerProductSync called with correct productId/repoOwner/repoName/accessToken, response completes without awaiting it" — passes fresh on master (`e0199809`) | `integration-real-code` | None |
| AC2 | ✅ | Same test file: "AC2: re-connect while a sync is already in-flight still succeeds; call site relies on triggerProductSync's own guard, not a duplicate one" — passes fresh | `integration-real-code` | None |
| AC3 | ✅ | Same test file: "AC3 + NFR-Security: sync failure logged via console.error, connection unaffected, accessToken never logged" — passes fresh | `integration-real-code` | None |
| AC4 | ⚠️ | Code-level evidence is solid: "AC4: connect triggers the sync call site end-to-end with no manual Refresh call needed" passes fresh. But AC4's actual claim is an external, real-world effect — that a real user, in the real running app, sees real data appear on `GET /products/:id` without clicking Refresh. That specific end-to-end claim has only `integration-real-code` evidence (mocked `triggerProductSync`/DB layer), not `live-verified` against a real running instance. Confirming it live would require a real GitHub OAuth sign-in to connect a real repo through the real UI — not something an unsupervised agent should do against a live third-party production identity provider. | `integration-real-code` (claim requires `live-verified`) | See Follow-up Actions |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Confirmed against the real merged diff (`git show e0199809 --stat`): only `src/web-ui/routes/product-repo.js` (+20 lines), the implementation plan artefact, the test file, and `pipeline-state.json` bookkeeping were touched. No scheduled/periodic resync was added (the story's own Out-of-Scope item 1), and `products.js`'s manual Refresh endpoint was not touched at all (Out-of-Scope item 2).

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 (4 unit, 2 integration, 2 NFR per the original test plan — the shipped single test file covers all AC/NFR assertions in 5 named test blocks, consistent with the plan's intent)
**Tests passing in CI:** 5 / 5 (re-run fresh on current master, not relying on the pre-merge PR's own claimed result)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: triggerProductSync called correctly, non-blocking | ✅ | ✅ | |
| AC2: isSyncInProgress guard respected on re-connect | ✅ | ✅ | |
| AC3 + NFR-Security: failure logged, token never leaked | ✅ | ✅ | |
| AC4: connect reaches sync call site end-to-end | ✅ | ✅ | Code-level only — see AC4 row above |
| NFR-Performance: response completes without waiting | ✅ | ✅ | 0ms response vs. 500ms mocked sync delay |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — repo-connect response not blocked by sync | ✅ | NFR-Performance test: response completed in 0ms against a 500ms mocked sync delay |
| Security — Authentication (session-scoped `accessToken`, ADR-020) | ✅ | `accessToken` parameter flows from the same `req.session.accessToken` already used by `_applyRepoChange`'s pre-existing repo-access check; no new credential path introduced |
| Security — Authorisation (tenant/product scoping, ADR-025) | ✅ | `triggerProductSync` call is scoped by the same `productId` already validated in `_applyRepoChange`; no new cross-tenant query path |
| Security — Secrets management (token never logged) | ✅ | AC3 test asserts `accessToken` never appears in the logged payload |
| Audit — failure logging on auto-trigger | ✅ | Matches the real existing pattern exactly — confirmed by reading `products.js`'s manual-refresh error handler (`console.error` only, no `_posthog.captureException` call in either case); the NFR profile's "or" framing is satisfied by the pattern actually in use, not a gap |
| Accessibility | ✅ N/A | Story and NFR profile both correctly state "None identified — backend-only change, no new rendered UI" |

---

## Metric Signal

**Finding before recording this:** none of this feature's 3 metrics (`m1`/`m2`/`m3` in `pipeline-state.json`) have ever had their `contributingStories` array populated, even though `benefit-metric.md`'s own Metric Coverage Matrix explicitly names which stories move which metric. This is a real, pre-existing bookkeeping gap (the `/benefit-metric` skill's own State-update section does not populate this field) — same class of gap as the `testPlan.artefact` issue found and fixed earlier in this tranche. Fixing it here as part of this story's own DoD state write: `m1`'s `contributingStories` will be set to include `urpv-s1` (the only metric `benefit-metric.md` names urpv-s1 against — `m2`/`m3` are both attributed to `urpv-s4`, not this story).

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Reactive-work coverage on the surface (m1) | ✅ (0%) | Not yet — requires urpv-s2/s3's rendering work | Measurement-ready gate: **not yet**. Evidence note: "urpv-s1 ships only the backend auto-sync trigger; the feature's benefit metrics (reactive-work coverage, EM/team-lead usage) require urpv-s2/s3/s4's rendering work, not yet implemented." Signal: `not-yet-measured`. |

`m2` and `m3` are not attributed to `urpv-s1` in `benefit-metric.md` — no action taken on them in this story's DoD.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. **Live-verify end-to-end (AC4):** connect a real repo via the running web-ui and confirm `product_rollups` populates, and `GET /products/:id` reflects it, without a manual Refresh click. Requires a human with real GitHub OAuth credentials against the real identity provider — cannot be performed by an unsupervised agent. Owner: Hamish King (Platform Owner).
2. **Metric bookkeeping gap (process-level, not specific to this story):** `/benefit-metric`'s State-update section should be amended to populate `metrics[].contributingStories` from the Metric Coverage Matrix it already writes, so future stories don't need this same ad-hoc fix at DoD time. Candidate for the growing `/improve` backlog alongside the `testPlan.artefact` gap found earlier in this tranche.

---

## DoD Observations

1. The manual-refresh error-handling pattern this story was required to mirror (`products.js:3066`) uses `console.error` only, not `_posthog.captureException` — confirming the NFR profile's "or" framing was satisfied by what's actually in the codebase, not a gap introduced by this story. Worth noting so a future reader doesn't flag the absent `_posthog.captureException` call as a defect.
2. `metrics[].contributingStories` was empty for all three of this feature's metrics prior to this DoD — fixed for `m1` here; `/improve` candidate logged above to fix the root cause in `/benefit-metric` itself.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Auto-sync a product's pipeline-state.json immediately on repo connection.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
