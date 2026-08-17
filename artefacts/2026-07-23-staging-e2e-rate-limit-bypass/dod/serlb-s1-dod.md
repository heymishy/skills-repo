# Definition of Done: Narrow, staging-only rate-limit bypass so Scenario A's real-staging CI gate can pass without weakening staging signup abuse-prevention

**PR:** https://github.com/heymishy/skills-repo/pull/564 (merge commit `711cb705`) | **Merged:** 2026-07-23
**Story:** artefacts/2026-07-23-staging-e2e-rate-limit-bypass/stories/serlb-s1.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- no bypass secret configured, 11th attempt still 429 (regression baseline) | Yes | `check-serlb-s1-staging-rate-limit-bypass.js` T1 ("11th signup attempt returns 429 when the bypass secret is not configured at all") and T7 (different-IP sanity) | Unit test, freshly re-run 2026-08-17 (7/7 passed) | None |
| AC2 -- secret + matching header + `e2e-test-` email allowed (302); same + non-tagged email still 429 | Yes | T2 ("11th signup attempt is allowed through (302, not 429) when all three gates are satisfied"), T3 (non-`e2e-test-` email still 429), T5 (mismatched header value still 429) | Unit test, freshly re-run 2026-08-17 | None |
| AC3 -- secret NOT configured: bypass never fires regardless of header/email (production isolation) | Yes | T4 ("bypass never fires when E2E_STAGING_AUTH_STUB_SECRET is unset") | Unit test, freshly re-run 2026-08-17 | None |
| AC4 -- full `npm test` regression, no new baseline failures | Yes | Recorded at DoR/merge time (`dor/serlb-s1-dor.md` step 4; `.github/pipeline-state.json` serlb-s1 notes: "AC1-AC4 fully verified (unit tests + zero regressions)") | Integration (full suite), not independently re-run this session | Not re-run in this DoD pass -- relying on the merge-time record per the brief's instruction not to re-run tests broadly |
| AC5 -- real `wuce-staging`, all four Scenario A specs run together, no 429 cascade | Partial at merge, resolved post-merge | `decisions.md` RISK-ACCEPT entry: `E2E_STAGING_AUTH_STUB_SECRET` was deployed as a Fly secret but never configured as a GitHub Actions secret, so the bypass header could not be sent by the real CI job at merge time. Fix itself was deployed and the underlying defect re-confirmed live. Subsequently, `.github/pipeline-state.json` notes for the very next dependent story (`eatrl-s1`, PR #573) record `scenario-a-staging-e2e 7 passed/3 skipped/1 failed` with the one failure being an unrelated session-resume assertion -- i.e. zero rate-limit-caused failures once the GitHub Actions secret was in place, confirming this fix's mechanism does work end-to-end in real CI | E2E (real staging CI), evidence drawn from this story's own merge-time record plus the subsequent `eatrl-s1` CI run | See Scope Deviations |

---

## Scope Deviations

**GitHub Actions secret gap (AC5), already RISK-ACCEPTed -- not a new finding.** At merge time, `E2E_STAGING_AUTH_STUB_SECRET` was deployed as a `wuce-staging` Fly secret but had never been configured as a GitHub Actions secret, so the bypass mechanism's request-side header could not be sent by the real CI job. This was independently discovered, investigated, and documented during this story's own delivery (`decisions.md` "FINDING" + "RISK-ACCEPT" entries, `dor/serlb-s1-dor.md` "Post-implementation finding"). An attempt to rotate/set the secret directly was correctly blocked by the auto-mode classifier (credential rotation is a human-judgment action) and the generated value was discarded. The gap was closed by an operator action outside this story's scope; by the time of the next dependent story (`eatrl-s1`, PR #573), the GitHub Actions secret was present and the real `scenario-a-staging-e2e` CI job ran with zero rate-limit-related failures. No further follow-up needed.

**All other scope:** as declared in the story's "Out of Scope" section (no change to `RATE_MAX`, `RATE_WIN_MS`, `_getIP()`, the local-harness `E2E_RATE_LIMIT_BYPASS` mechanism, or `routes/auth.js`/`auth/oauth-adapter.js`/`routes/auth-stub.js`; no new Fly secret provisioned) -- accepted as-is, not a defect.

---

## Test Plan Coverage

- **Unit (UT1-UT7, AC1-AC3):** `check-serlb-s1-staging-rate-limit-bypass.js` -- 7 passed, 0 failed (freshly re-run 2026-08-17).
- **Integration (IT1, AC4):** full `npm test` regression -- recorded as zero new baseline failures at DoR/merge time; not independently re-run this session.
- **E2E (E2E1, AC5):** partial at merge (deploy + underlying defect re-confirmed live, CI-side secret gap open); resolved post-merge per `eatrl-s1`'s subsequent real-CI evidence (see AC5 row above).

---

## NFR Status

| NFR | Status | Notes |
|-----|--------|-------|
| Performance | Met | Additive check only on the already-rare "over `RATE_MAX`" branch; no change to normal in-limit request path. |
| Security | Met | Three independent gates (staging-only secret, `crypto.timingSafeEqual` header match, `e2e-test-` email prefix) required for bypass; T3/T4/T5 unit tests directly prove no single gate alone is sufficient. |
| Accessibility | N/A | No UI change (per story). |
| Audit | N/A | No change to persisted user/session/audit data (per story). |

---

## Metric Signal

No dedicated benefit-metric artefact -- this is a short-track story. The story ties its benefit directly to `2026-07-23-e2e-core-journey-coverage`'s own m1 (real, staging-verified E2E coverage of the core product journey). At merge time this linkage was itself only partially realized (the CI gate could not yet go fully green due to the GitHub Actions secret gap); the subsequent `eatrl-s1` CI run confirms the gate's rate-limit-related failures are now resolved, so m1's intended outcome (genuine staging-verified coverage without 429 noise) is achieved, just not observed within this story's own session.

---

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** None -- the one deviation (AC5's CI-side secret gap) was already RISK-ACCEPTed with an explicit operator action at story time, and is independently confirmed resolved by the subsequent `eatrl-s1` story's real CI evidence.

## DoD Observations

The code fix (triple-gated bypass) has been live on `wuce-staging` since 2026-07-23 with no reported incidents. The one deviation found (CI secret wiring) was self-discovered, honestly reported, and correctly left for operator action rather than worked around -- a good example of the pipeline's RISK-ACCEPT mechanism functioning as intended.
