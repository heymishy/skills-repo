# Discovery: Real Playback Capture Automation

**Status:** Approved
**Created:** 2026-10-19
**Approved by:** Hamish King — Platform Owner — 2026-10-19
**Author:** Claude Sonnet 5 (session), with Hamish King

---

## Problem Statement

The Feature Playback mechanism's own screenshot/video capture (`scripts/playback-capture.js`) has never actually been automated, despite `skills/feature-playback/SKILL.md` describing it as a runnable CLI that drives Playwright per AC. The file has no CLI entrypoint, requires a pre-built Playwright `page` object and a hand-authored `{acId, url, selector}` list that nothing derives automatically, and has only ever been unit-tested against a mocked `page` — confirmed by the same finding repeated across 5 separate RISK-ACCEPT entries in `decisions.md` (`fpd-s1` through `fpd-s5`). Every real screenshot in this repo's history was produced by an operator or Claude manually driving an authenticated Chrome session. This costs real time every time a feature needs its playback package filled in (confirmed directly this session — capturing `journey-cx-redesign`'s own evidence took a multi-hour session), and doesn't scale: roughly 270 DoD-complete features in this repo have at least one real story; essentially none have real captured evidence.

## Who It Affects

**Primary — Feature sponsors / business owners:** Same persona as `feature-playback-demo`'s own discovery. They still see mostly empty playback packages despite the viewer working correctly, undermining the whole acceptance-loop purpose that feature was built to close.

**Primary — The operator / engineer:** Has to manually drive a browser session every time real evidence is needed, instead of the mechanism just working — a real, repeated cost confirmed directly this session.

**Secondary — Platform maintainer:** Inherited 5 repeated RISK-ACCEPT entries for the same unclosed gap, each logged at a different story's own DoR/DoD without the underlying gap ever actually closing.

## Why Now

`fpd-s6` just shipped (2026-10-18) specifically to make the coverage gap visible at a glance on the review page, rather than hidden by scrolling — which makes the gap it's measuring (real capture coverage near-zero across ~270 features) impossible to ignore instead of quietly tolerated. Separately, this session's own direct investigation found the blocker is **not** infrastructure — Playwright runs fine in this sandbox and reaches the real deployed site — it's a credential-handling gap (GitHub OAuth can't be scripted) with an already-built, already-deployed non-OAuth path on staging (`E2E_STAGING_AUTH_STUB_SECRET`) nobody has wired up yet. The fix is concretely scoped now in a way it wasn't before this session's own investigation.

## MVP Scope

1. `scripts/playback-capture.js` gets a real CLI entrypoint (`node scripts/playback-capture.js [feature-slug]`), replacing the current pure-function-library-only shape.
2. The CLI authenticates against `wuce-staging` via the already-deployed `E2E_STAGING_AUTH_STUB_SECRET` / `x-e2e-test-endpoint-bypass` mechanism (`GET /test/session`, `src/web-ui/server.js` ~line 1773-2263) — no GitHub OAuth scripting, no real credentials handled by the CLI.
3. Both screenshot **and** video capture are wired for real: `captureAcScreenshots` and `captureVideoRecording` — both currently exercised only against mocked Playwright objects — now drive a real authenticated browser session.
4. Per-AC `{url, selector}` is derived from existing `tests/e2e/*.spec.js` files where a matching spec exists for that AC, with a manual-authored field as the fallback for ACs with no E2E coverage — E2E specs are the primary source, not a new mandatory authoring step.
5. **Production capture is explicitly out of this MVP** — see Out of Scope and the risk decision below.
6. **`skills/feature-playback/SKILL.md`'s own documented steps are updated to describe what the CLI actually does, and the 5 repeated RISK-ACCEPT entries in `decisions.md` are closed as superseded.** Added 2026-10-19, at `/definition` time — this was always implied by the problem statement (the SKILL.md describing something that didn't exist is itself part of the problem) but not originally itemized as its own deliverable.

## Out of Scope

- **Production capture.** Explicitly deferred to a fast-follow story. A production-equivalent auth-bypass secret carries materially higher risk than the staging one (staging holds non-production data; a leaked production secret could mint a session for a real tenant on the real app) — scoping it separately, after the staging mechanism is proven in practice, rather than bundling the two risk profiles into one story.
- **A new manual-authoring step as the primary selector source.** Manual `{url, selector}` entry is a fallback only, not the main mechanism — adding it as a mandatory step on every future story would just trade one kind of toil for another.
- **Captions/transcript generation quality.** `fpd-s2`'s existing `generateCaptionsForVideo` (the D37 adapter pattern) is reused as-is — not revisited or improved in this story.
- **Retrofitting real capture against the ~270 existing DoD-complete features in bulk.** This discovery scopes the mechanism working for real, not a backfill campaign — that's a separate, later follow-up once the mechanism exists and has been proven on new features.

## Assumptions and Risks

**[CONFIRMED via /clarify, 2026-10-19]** `E2E_STAGING_AUTH_STUB_SECRET` does not need its scope extended at all. `tests/e2e/fixtures/auth.js` already calls `GET /test/session` — one of the existing routes gated by `_isTestEndpointAllowed` — before every E2E test today. The capture CLI is simply a new caller of this same, already-deployed, unchanged mechanism; no new route, no widened blast radius.

**[CONFIRMED via /clarify, 2026-10-19]** Existing `tests/e2e/*.spec.js` selectors are stable and reusable. Sampled 3 spec files (`jcx-s3-emotion-curve`, `fpd-s4-caption-sync`, `jcx-s7-panel-entry-and-save-feedback`) — every selector used is a stable CSS class or `id`/`data-*` attribute (e.g. `.sw-emotion-curve-point--negative circle`, `.playback-ac__video`, `#sw-stage-panel`), none text-content or position-index based.

**Risk:** ACs with no E2E spec and no manually-authored fallback simply never get captured — reproducing the current gap in a smaller form, not eliminating it.

**Risk:** `wuce-staging` may lack realistic data for some capture targets, the same gap already found this session when a disposable synthetic test journey had to be created by hand to generate `fpd-s6`'s own real screenshots.

## Directional Success Indicators

**Real capture coverage on new DoD-complete features:** Baseline: ~1 of ~270 features has any real captured evidence today (confirmed this session). Target: a new DoD-complete feature reaches non-zero real capture coverage without a manual Chrome session. Measured via: `fpd-s6`'s own coverage-summary counts, sampled on features shipped after this lands.

**Manual capture time per feature:** Baseline: multi-hour session (confirmed this session capturing `journey-cx-redesign`'s own evidence). Target: near-zero — the CLI runs unattended. Measured via: session timing.

## Constraints

- No new npm dependencies — Playwright is already present as a devDependency, already used by the existing `tests/e2e/*.spec.js` suite.
- Secret handling follows `product/constraints.md` #12 (credentials are structural, never in the agent's environment) — the CLI reads `E2E_STAGING_AUTH_STUB_SECRET` from an environment variable at runtime only; it is never hardcoded, printed, or logged.
- No new production auth-bypass mechanism is introduced by this story — explicitly deferred per the fast-follow decision above.
- The capture CLI must not widen `_isTestEndpointAllowed`'s existing blast radius on `wuce-staging` beyond what `fpd-4`'s own 4-5 named `/test/*` routes already accept.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- Hamish King — Platform Owner

## Approved By

Hamish King — Platform Owner — 2026-10-19

---

## Clarification log

[2026-10-19] Clarified via /clarify:
- Q: Can `E2E_STAGING_AUTH_STUB_SECRET`'s existing scope be extended to authenticate the capture CLI's own session without widening its blast radius?  A: No extension needed — confirmed directly from code that the CLI can reuse the already-existing `GET /test/session` route, the same one `tests/e2e/fixtures/auth.js` already calls for every E2E test.
- Q: Are existing E2E spec selectors stable/precise enough to reuse directly for capture?  A: Yes — confirmed by sampling 3 spec files; every selector is a stable CSS class or `id`/`data-*` attribute, none fragile.

Both resolved by direct code investigation, not operator judgment — 0 unconfirmed assumptions remain.

---

**Next step:** Human review and approval → /benefit-metric
