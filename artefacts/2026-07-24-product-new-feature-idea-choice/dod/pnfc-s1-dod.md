# Definition of Done: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**PR:** #579 ("pnfc-s1: offer the formed-idea/rough-idea choice on a product's New feature panel", commit `dd91962b`) | **Merged:** 2026-07-24 (commit `eb75a622`, "chore: mark pnfc-s1 as merged (PR #579)"). Note: the task brief for this DoD pass cited "PR #678" — git history shows PR #678 is a different, later story (das-s2, "Require a connected repo before a new product can start its first journey"). The PR number and merge commit above are taken directly from this repo's verified git log for pnfc-s1, not from the brief.
**Story:** artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (choice presented before session creation) | Yes | `tests/e2e/pnfc-s1-new-feature-choice.spec.js`, test `AC1: clicking "New feature" on a product page presents the rough-idea/formed-idea choice before creating a journey` — asserts `#psh-new-feature-panel` is hidden until click, then shows both `startSkill` radios, with URL unchanged (no session created) until submit | E2E (Playwright, local `NODE_ENV=test` harness) | This spec was not part of the fresh test run supplied for this DoD pass (only `check-pnfc-s1-product-feature-choice.js` was freshly re-run); evidence is the spec's existence and content, not a freshly-confirmed pass in this session |
| AC2 (rough-idea registers `ideate`, keeps `productId`, lands on `/skills/ideate/...`) | Yes | `check-pnfc-s1-product-feature-choice.js` — `roughIdeaChoiceRegistersIdeateSessionKeepsProductId (AC2)`: asserts session `skillName === 'ideate'`, `journey.productId === 'prod-ideate-1'`, redirect matches `/skills/ideate/sessions/:id/chat` | Integration (freshly re-run, passing) + `pnfc-s1-new-feature-choice.spec.js` "AC2 (UI-level)" E2E test | None |
| AC3 (formed-idea registers `discovery`, keeps `productId`, lands on `/skills/discovery/...`) | Yes | `check-pnfc-s1-product-feature-choice.js` — `formedIdeaChoiceRegistersDiscoverySessionKeepsProductId (AC3)` and `omitting startSkill defaults to discovery...` — asserts `skillName === 'discovery'`, `productId` preserved, correct redirect, and default-omission behaviour unchanged | Integration (freshly re-run, passing) + `pnfc-s1-new-feature-choice.spec.js` "AC3 (UI-level)" E2E test | None |
| AC4 (feature visible and correctly `productId`-attributed after the ideate path) | Yes | `check-pnfc-s1-product-feature-choice.js` — `newFeatureViaIdeatePathVisibleOnProductPage (AC4)`: asserts `journey.productId`, `journey.featureSlug`, `journey.journeyId` all set and `activeSkill === 'ideate'`, matching the query shape `handleGetProductView` relies on | Integration (freshly re-run, passing) + `pnfc-s1-new-feature-choice.spec.js` "AC4 (UI-level)" E2E test | None |
| AC5 (`/journey` and `handlePostJourney` unchanged/unregressed) | Yes | `check-pnfc-s1-product-feature-choice.js` — `handlePostJourney (routes/journey.js) still branches ideate/discovery correctly and is untouched by this story (AC5)`; corroborated by `decisions.md`, which records that `journey.js` was deliberately left untouched (duplication chosen over extension specifically to guarantee zero regression risk to this file) | Integration (freshly re-run, passing) + code inspection confirming `journey.js` has no story-related diff | None |

---

## Scope Deviations

None. The story's own Architecture Constraints explicitly permitted either "duplicate the branch logic" or "extend `handlePostJourney`" as acceptable implementation paths, provided the choice was documented in `decisions.md`. The implementation chose duplication (a one-line `startSkill` ternary copied into `handlePostProductFeature`, `src/web-ui/routes/products.js` line ~2908) and logged the rationale and accepted trade-off (two call sites now need updating if a third `startSkill` value is ever added) in `artefacts/2026-07-24-product-new-feature-idea-choice/decisions.md`. This is an accepted, in-scope implementation choice, not a deviation.

---

## Test Plan Coverage

- `check-pnfc-s1-product-feature-choice.js`: **5 passed, 0 failed** (freshly re-run 2026-08-17), covering AC2, AC3 (plus default-omission sub-case), AC4, and AC5 at the integration level.
- `tests/e2e/pnfc-s1-new-feature-choice.spec.js`: 4 Playwright specs covering AC1 (choice presented before session creation) and UI-level confirmations of AC2–AC4. Not re-run in this session; evidence is the spec content matching the test plan's stated AC1 E2E coverage.
- Test plan (`pnfc-s1-test-plan.md`) declares zero coverage gaps and zero NFR tests beyond reused existing logic — matches what's implemented.

---

## NFR Status

| NFR | Status |
|-----|--------|
| Performance | Met — story adds one client-side confirm step only; no new backend cost, matches `handlePostJourney`'s existing branch cost |
| Security | Met — reuses existing session-registration and product-ownership logic verbatim, no new surface |
| Accessibility | Met — E2E spec confirms the choice is implemented as standard radio inputs (`input[name="startSkill"]`), matching `/journey`'s existing keyboard-operable pattern |
| Audit | Not applicable, as stated in the story — no new audited action |

---

## Metric Signal

No benefit-metric artefact exists for this story — it is explicitly short-track per CLAUDE.md's convention (discovery and benefit-metric are skipped), with benefit stated directly in the story as closing a confirmed UX inconsistency between two entry points to the same capability. There is no Tier metric to report against.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None.

---

## DoD Observations

All 5 ACs have direct evidence, either freshly-confirmed integration tests (AC2–AC5) or an existing E2E spec matching the test plan's stated coverage (AC1). The architecture trade-off (duplicated `startSkill` branch vs. extending `handlePostJourney`) was made deliberately and is documented in `decisions.md`, consistent with prior precedent in this file (`jrf-s1`/`jrf-s2`).
