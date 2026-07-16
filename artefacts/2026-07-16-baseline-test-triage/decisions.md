# Decision Log: 2026-07-16-baseline-test-triage

**Feature:** Triage the pre-existing baseline test failures unmasked by pcr-s1
**Story reference:** artefacts/2026-07-16-baseline-test-triage/stories/tst-s1-triage-pre-existing-baseline-failures.md
**Last updated:** 2026-07-16

---

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-16 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the verification/test plan before implementation begins.
**Alternatives considered:** Block on a formal review pass first (rejected, same rationale as pcr-s1).
**Rationale:** Bounded, short-track infra/process story (test triage, no new production feature). The operator reviewed the story and ACs directly in-session before requesting this be short-tracked.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-16
**Revisit trigger:** None.
---
**2026-07-16 | GAP | definition-of-ready (H-GOV)**
**Decision:** H-GOV satisfied via the operator's direct in-session instruction to proceed short-track, same as `pcr-s1`'s precedent (artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md, 2026-07-11 GAP entry) — this is the same unresolved skill-design gap (`definition-of-ready/SKILL.md`'s H-GOV check assumes a discovery artefact exists), not a new one.
**Made by:** Claude (agent), definition-of-ready, 2026-07-16
**Revisit trigger:** Same as pcr-s1's — resolve once, applies to both.
---
**2026-07-16 | GAP | subagent-execution (cdg.7 tooling)**
**Decision:** Used `node bin/skills advance` directly for the `branch-complete` stage transition instead of `node bin/skills gate-advance`, because `gate-advance` currently fails with `UNSUPPORTED_GATE` for the `branch-complete` gate name.
**Alternatives considered:** Block this story's pipeline-state bookkeeping until `gate-advance` supports `branch-complete` (rejected — this is a pre-existing tooling gap unrelated to this story's own scope, and blocking would leave the story's real work uncommitted for no benefit).
**Rationale:** `src/enforcement/cli-outer-loop.js`'s `SUPPORTED_GATES` constant currently only lists `'definition-of-ready'`, even though `src/enforcement/gate-map.js` defines 7 gated stage names including `branch-complete` and `definition-of-done`. Confirmed by direct invocation: `node bin/skills gate-advance 2026-07-16-baseline-test-triage tst-s1 branch-complete <dor-path>` returns `UNSUPPORTED_GATE: 'branch-complete' is not a recognised gate. Supported gates: definition-of-ready` (exit 8). This may also be the root cause of `tests/check-cli-outer-loop.js`'s 1 failing assertion (deferred separately in `triage-report.md`'s individual-files table) — worth checking when that file's follow-up investigation happens.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** File a follow-up to extend `cli-outer-loop.js`'s `SUPPORTED_GATES` (and its validation logic) to cover all 7 gate names in `gate-map.js`, not just `definition-of-ready`.
---

## Architecture Decision Records

<!-- Coding agent: append RISK-ACCEPT entries per category-(b) file/group here during implementation. -->

---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 1: missing `.github/skills/<name>/SKILL.md` mirror (34 files)**
**Decision:** Defer fixing the missing `.github/skills/<name>/SKILL.md` (and `.github/templates/<name>.md`) references in 34 test files rather than repointing them at the real location (`skills/<name>/SKILL.md`) or creating mirror files.
**Alternatives considered:** (1) Repoint all 34 test files' path references from `.github/skills/` to `skills/` (rejected for this story — would require verifying each file's remaining content assertions still hold against the real `skills/<name>/SKILL.md` content, a large surface for a single triage story, and doesn't resolve why `.github/skills/` exists as a partial mirror at all). (2) Create the missing mirror files in `.github/skills/` (rejected — inventing SKILL.md content/copies to satisfy a test is exactly the "do NOT invent a fix" case the DoR calls out; whether `.github/skills/` should mirror all of `skills/` at all is an open architecture question).
**Rationale:** This exact gap has already been independently found and RISK-ACCEPTed 3 times by different coding agents on different stories (`bri-s1.2`, `bri-s1.4`, `bri-s2.2` — see `artefacts/2026-07-09-beta-readiness-infra/decisions.md`, 2026-07-10/07-11 entries), each time citing it as out-of-scope for that story. `pcr-s1`'s own decisions.md explicitly named this exact bucket ("missing `.github/skills/definition/SKILL.md` and other missing skill files referenced by several `check-i*`/`check-rrc*`/`check-p11*` tests") as the follow-up this tst-s1 story now addresses. Confirmed via direct listing: `.github/skills/` contains only 5 special-purpose entries (`infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`); the real, current files for `discovery`, `definition`, `benefit-metric`, `orient`, `ideate`, `prioritise`, `modernisation-decompose`, `improve`, `improvement-agent`, `review`, `test-plan`, `definition-of-ready`, `tdd`, `systematic-debugging`, `implementation-review`, `checkpoint`, `trace`, `verify-completion`, `reverse-engineer`, `reference-corpus-update`, `issue-dispatch` all live at top-level `skills/<name>/SKILL.md`. Deciding whether `.github/skills/` should be extended to mirror all of `skills/`, or retired in favour of updating these 34 tests, is a real, repo-wide structural decision — not a bounded per-file fix.
**Affected files:** `tests/check-challenger.js`, `tests/check-definition-skill.js`, `tests/check-discovery-skill.js`, `tests/check-i2.1-entry-a-story-first.js`, `tests/check-i2.2-entry-b-code-first.js`, `tests/check-i2.3-entry-c-no-history.js`, `tests/check-i3.1-discovery-attribution.js`, `tests/check-i3.2-benefit-metric-attribution.js`, `tests/check-i3.3-dor-h-gov.js`, `tests/check-ilc2-agent-selfrecord.js`, `tests/check-inc2.2-condition-marker-instruction.js`, `tests/check-inc3-question-cadence.js`, `tests/check-inc5-canvas-skill-instruction.js`, `tests/check-iwu6-skillmd.js`, `tests/check-md-1-skill-md.js`, `tests/check-md-2-skill-contracts.js`, `tests/check-p11-attribution.js`, `tests/check-p11-hgov.js`, `tests/check-p11-start.js`, `tests/check-p3.6-dispatch.js`, `tests/check-pr.1.js`, `tests/check-pr.2.js`, `tests/check-pr.3.js`, `tests/check-pr.4.js`, `tests/check-pr.5.js`, `tests/check-rrc1-discovery-seed.js`, `tests/check-rrc2-constraint-index.js`, `tests/check-rrc3-discovery-integration.js`, `tests/check-rrc4-corpus-update-skill.js`, `tests/check-sfa1-state-schema.js`, `tests/check-spc2-capture-block-template.js`, `tests/check-sro1-skill-routing.js`, `tests/check-srt1-status-report-template.js`, `tests/check-trace-commit.js`.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** File a dedicated follow-up story to make the `.github/skills/` vs. `skills/` architecture decision explicit (repo-level ADR), then either mirror the missing files or repoint these 34 tests — whichever the ADR selects.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 2: missing ANTHROPIC_API_KEY (1 file)**
**Decision:** Accept `tests/check-mfc1-model-first-chat-session.js`'s 3 `ANTHROPIC_API_KEY`-dependent failures as an environment gap, not a code defect.
**Alternatives considered:** Set a dummy `ANTHROPIC_API_KEY` for test purposes (rejected — already-established pattern per pcr-s1's decisions.md names this exact bucket; a dummy key changes test semantics without validating real provider behaviour).
**Rationale:** Already documented in `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` as one of pcr-s1's three named failure buckets ("missing `ANTHROPIC_API_KEY` for several `check-mfc*` tests"). No new investigation needed; this triage story only re-confirms it's still true.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** When a CI/dev-environment secret for `ANTHROPIC_API_KEY` is provisioned for local/test use.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 3: canvas panel / assumption cards UI feature incomplete (4 files)**
**Decision:** Defer `tests/check-inc2.1-conditions-panel.js`, `tests/check-inc4-canvas-panel.js`, `tests/check-iwu2-right-panel-layout.js`, `tests/check-mfc2-chat-ux-improvements.js` as a single, multi-file feature-completeness gap rather than patching each in isolation.
**Alternatives considered:** Fix each file's specific missing HTML/JS assertion independently (rejected — the four files' failures (`#canvas-panel`, `#condition-items`, `#assumption-cards`, `renderCanvasBlock` and its handlers) are clearly one incomplete UI feature spanning several related stories (`inc2`, `inc4`, `iwu2`, `mfc2`); patching them one at a time risks landing an inconsistent partial UI with no coherent design).
**Rationale:** All four show missing DOM elements/handlers for the same panel-and-canvas UI surface. This needs a dedicated implementation pass across the whole feature, which is out of proportion for a test-triage story explicitly scoped to bounded fixes.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** File a dedicated follow-up story to complete the canvas-panel/assumption-cards UI feature across all four touch points together.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 4: auth/session flow redirects and fields not observed (3 files)**
**Decision:** Defer `tests/check-s0.2-tenant-login-fallback.js`, `tests/check-sec3-return-to.js`, `tests/check-sec5-session-rotation.js` as a likely-shared root cause, not three independent bugs.
**Alternatives considered:** Investigate and fix each independently (rejected — all three show the identical failure shape: expected 302 redirects and session fields (`tenantId`, `login`, `accessToken`) not materializing; treating them as unrelated risks three partial fixes that miss a shared underlying cause, e.g. a shared test mock/helper or session-middleware change).
**Rationale:** The consistency of failure shape across three otherwise-unrelated auth stories strongly suggests one shared cause. Isolating it needs a dedicated auth-flow debugging session, out of proportion for this triage story's bounded scope.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** Dedicated auth-flow investigation story; check whether a shared request/response test helper or session middleware changed recently across all three story branches' merge history.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 5: journey STAGE_SEQUENCE `design` step inconsistency (5 files)**
**Decision:** Defer `tests/check-ougl2-journey-state-store.js`, `tests/check-ougl3-journey-entry-and-start.js`, `tests/check-ougl4-journey-aware-chat-button.js`, `tests/check-ougl5-gate-confirm-feature-stages.js`, `tests/check-ougl6-perstory-stage-routing.js` rather than editing `STAGE_SEQUENCE` or the tests unilaterally.
**Alternatives considered:** (1) Remove `'design'` from `STAGE_SEQUENCE` in `src/web-ui/modules/journey-store.js` to match the tests (rejected — `design` is a real, existing skill (`skills/design/SKILL.md`); removing it from the sequence could silently break routing for any journey currently relying on it). (2) Update the 5 tests to expect `'design'` in the sequence (rejected — CLAUDE.md's own documented pipeline table lists `benefit-metric → definition` with no `/design` step between them, so it's not certain the tests are the ones that are wrong).
**Rationale:** `getNextStage('benefit-metric')` returns `'design'` in current production code, but `check-ougl2-journey-state-store.js` expects `'definition'` directly, and the downstream routing tests (`ougl3`, `ougl4`, `ougl6`) show consistent, plausibly-related redirect/routing mismatches. `check-ougl5-gate-confirm-feature-stages.js`'s failures additionally touch the disk-canonicity rule (CLAUDE.md's `ougl` ADR-023, "read priorArtefacts from disk, not session.artefactContent") and may be a distinct regression worth separate attention. Whether `design`'s insertion into the mandatory sequence was intentional pipeline evolution or accidental drift is a product decision, not a bounded test/code fix.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** Confirm with the operator whether `/design` is meant to be a mandatory step in the journey `STAGE_SEQUENCE`; update either the production sequence or the 5 tests accordingly, and separately verify `check-ougl5-gate-confirm-feature-stages.js`'s disk-canonicity failures against ADR-023.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 6: Stripe placeholder price ID not configured (1 file)**
**Decision:** Accept `tests/check-lab-s3.5-billing-portal.js`'s `STRIPE_PRICE_ID_STARTER` placeholder failure as an environment/config gap.
**Alternatives considered:** Set a real Stripe price ID in this dev environment (rejected — requires a real Stripe account/dashboard action this coding agent cannot perform, and inventing a fake-but-plausible price ID would mask the real pre-launch gate this check exists to enforce).
**Rationale:** Consistent with the already-resolved sibling tests `check-lab-s3.2-stripe-checkout.js`/`check-lab-s3.4-stripe-webhook.js` (now passing once genuinely configured, per this story's own "5 now-passing" list) — `lab-s3.5` simply hasn't had its price ID configured yet in this environment.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** When `STRIPE_PRICE_ID_STARTER` is set to a real (non-placeholder) value in this environment.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 7: stale testPlan.passing bookkeeping across 11 merged stories (1 file)**
**Decision:** Defer `scripts/check-pipeline-state-integrity.js`'s 15 findings (11 distinct stories) rather than editing `.github/pipeline-state.json`'s `testPlan.passing` fields for each.
**Alternatives considered:** Bulk-correct all 11 stories' `testPlan.passing` values to equal `testPlan.totalTests` (rejected — this triage story cannot responsibly confirm each of those 11 already-merged, unrelated stories' actual final passing count without re-verifying each one individually; guessing risks recording an inaccurate historical record, which is worse than leaving the gap visible).
**Rationale:** This is accumulated pipeline-state bookkeeping debt across many unrelated, already-shipped features (`lab-s1.1`–`lab-s3.5`, `arl-s1`–`arl-s3`, `bri-s2.2`), not a defect introduced by this story or related to test-runner behaviour. Per CLAUDE.md's `cdg.6` rule, any correction must go through `node bin/skills advance`, one story at a time, with a real confirmed count — out of proportion for this triage story's scope.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** A dedicated pipeline-state bookkeeping cleanup pass, story by story, using `node bin/skills advance <slug> <story-id> testPlan.passing=<confirmed count>` per CLAUDE.md's cdg.6 rule.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 8: skill session creation returns SKILL_NOT_FOUND (2 files)**
**Decision:** Defer `tests/artefact-preview.test.js` and `tests/artefact-writeback.test.js`'s session-creation failures.
**Alternatives considered:** Trace the exact skill-resolution code path now (rejected — plausibly related to GROUP 1's `.github/skills`-vs-`skills` gap, which is already deferred as an architecture decision; tracing it fully was not completed within this story's time budget and risks either duplicating GROUP 1's finding or missing a genuinely distinct cause).
**Rationale:** Both files fail identically with `{"error":"SKILL_NOT_FOUND"}` on session creation (400 instead of 201). Logged separately from GROUP 1 in case the root cause differs (e.g. a different skill-registry lookup than the `.github/skills/` path), pending a dedicated trace.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** Trace the skill-session-creation route's skill-name resolution logic; confirm whether it shares GROUP 1's root cause or is distinct.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — GROUP 9: check-wuce4-docker-deployment.js hangs after completion (1 file)**
**Decision:** Accept `tests/check-wuce4-docker-deployment.js` as "hangs, not fails" — already an established, pre-existing category for this exact file.
**Alternatives considered:** Investigate and close the lingering handle (rejected — out of scope per the existing precedent below; the underlying cause (PostHog config validation call after test completion) is unrelated to this triage story's scope).
**Rationale:** All 14 real assertions pass (`14 passed, 0 failed` printed before the hang). Matches the existing "hangs, not fails" category already logged in `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` for this exact file, alongside `check-wucp1-context-autoloader.js` and `check-wusl1-chat-streaming.js` (both of which, in this fresh run, actually completed and failed on real content — that prior "hangs" classification is stale for those two, corrected in the individual entries in `triage-report.md`).
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** Same as pcr-s1's original entry — investigate the lingering PostHog-config-validation handle if this file's runtime becomes a practical CI bottleneck.
---
**2026-07-16 | RISK-ACCEPT | subagent-execution (tst-s1) — individually-investigated, no shared group (14 files)**
**Decision:** Defer the following 14 files, each investigated individually (root cause read from actual failure output, not filename-only guessing), none sharing a common cause with another deferred file: `tests/check-artefact-coverage.js` (5 uncovered `src/` slugs need per-slug exemption/story decisions), `tests/check-bee3-posthog.js` (2 `posthog.capture('journey_created')` assertions need a dedicated instrumentation review), `tests/check-bri-s2.2-neon-staging-branch.js` (already documented in `artefacts/2026-07-09-beta-readiness-infra/decisions.md`, bri-s2.4), `tests/check-cli-outer-loop.js` (1 of 33 checks, not isolated in time budget), `tests/check-i1.1-orient-skill.js` (real content gap in `skills/orient/SKILL.md`, missing routing-target entries), `tests/check-i1.2-platform-init-fetch.js` (real script-behaviour gap in the platform-init install script), `tests/check-model-routing.js` (5 of 30 checks, not isolated in time budget), `tests/check-ougl1-buildsystemprompt-handoff.js` (apparent off-by-one in PRIOR ARTEFACT block rendering, not isolated), `tests/check-p4-enf-decision.js` (ADR-phase4-enforcement guardrails entry missing fields), `tests/check-wsm2-collaborative-sessions.js` (real collaborative-session feature regression, 404s), `tests/check-wuce24-guided-question-form.js` (2 of 43 checks, not isolated), `tests/check-wuce3-attributed-signoff.js` (real regression, uncaught exceptions), `tests/check-wucp1-context-autoloader.js` (real content-assembly gap; corrects a stale "hangs" classification from pcr-s1 — this file completed in 654ms and failed on real assertions), `tests/check-wusl1-chat-streaming.js` (specific ordering bug in chat page inline script, not isolated).
**Alternatives considered:** Continue investigating each to a fully bounded fix or full root-cause trace (rejected for this pass — each would require its own dedicated debugging session per CLAUDE.md's `/systematic-debugging` process; attempting all 14 in the remaining time budget risked either rushing bad fixes or leaving the story unfinished with uncommitted work, both worse outcomes than an honest, well-evidenced deferral).
**Rationale:** Every one of these 14 was run standalone and its actual failure output read (see `triage-report.md`'s individual table for the one-sentence reason per file, each derived from real observed output). None are filename-guesses. Each is either a real, non-trivial feature/content gap or a not-yet-isolated failure that would need dedicated follow-up time exceeding this story's bounded triage scope.
**Made by:** Claude (agent), tst-s1 inner loop, 2026-07-16
**Revisit trigger:** Per-file: see `triage-report.md`'s individual table. Each should become its own bug-fix or `/systematic-debugging` follow-up story.
---
