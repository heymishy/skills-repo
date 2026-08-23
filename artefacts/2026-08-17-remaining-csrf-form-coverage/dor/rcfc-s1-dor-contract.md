# Contract Proposal: Extend CSRF token protection to the remaining server-rendered POST forms

**Story reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Test plan reference:** artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
**Date:** 2026-08-24

---

## What will be built

- **`src/web-ui/routes/journey.js`** — add `csrfGuard(req, res)` call at the top of 6 handlers (`handlePostWizardSelection`, `handlePostJourney`, `handlePostGateConfirm`, `handlePostReferenceModalSkip`, `handlePostReference`, `handlePostStories`), matching the exact idiom already used elsewhere in this file/repo. Embed `csrfField(generateCsrfToken(req))` into each handler's corresponding GET-rendering form (the wizard page, and the 4 in-journey forms found during investigation).
- **`src/web-ui/routes/annotation.js`** — add `application/x-www-form-urlencoded` body-parsing support to `_readBody` (prerequisite fix for AC2, scoped strictly to making this route's real form path work, not a general refactor), then add `csrfGuard(req, res)` to `handlePostAnnotation`.
- **`src/web-ui/views/artefact-view.js`** — embed the CSRF field into the annotation form.
- **`src/web-ui/routes/skills.js`** — add `csrfGuard(req, res)` to the 2 form-path handlers (`handlePostSkillSessionHtml`, `handlePostCommitHtml`) — the JSON-path siblings are untouched, per the story's own scope boundary.
- **`src/web-ui/views/commit-view.js`** — embed the CSRF field into the commit form.
- **`src/web-ui/routes/products.js`** — add `csrfGuard(req, res)` to `handlePostProductConfirm` and `handlePostProductFeature`, embed the CSRF field into their respective forms.
- **`src/web-ui/utils/html-shell.js`** — embed the CSRF field into `renderLoginPage()`'s sign-in and sign-up forms. No wiring change needed on the handler side — `auth-email.js`'s `handleEmailLogin`/`handleEmailSignup` already call `csrfGuard`; this form currently omits the token entirely, which is why every real submission through this fallback shell currently 403s regardless of credentials (found during investigation).
- **4 new test files** (`tests/check-rcfc-s1-journey-forms-csrf.js`, `tests/check-rcfc-s1-annotations-skills-csrf.js`, `tests/check-rcfc-s1-products-csrf.js`, `tests/check-rcfc-s1-legacy-login-csrf.js`), 26 tests total, matching `sec-perf-s3`'s established full-router-dispatch integration-test convention.

## What will NOT be built

- Any change to the CSRF mechanism itself (`src/web-ui/middleware/csrf.js`) — reused exactly as `sec-perf-s3` built it.
- CSRF protection on `POST /webhook/stripe` or any `NODE_ENV==='test'`-gated endpoint — correctly excluded per `sec-perf-s3`'s own established reasoning (server-to-server HMAC auth, or unreachable in production).
- A double-submit-header convention for JSON/fetch-only endpoints — separate, larger decision, explicitly out of scope.
- Any broader refactor of `annotation.js`'s body-reading logic beyond the minimal form-urlencoded support needed for this story's own AC2.
- Any change to Agency/Client org provisioning, skill-session, or product-creation business logic itself — only the additive CSRF gate is added.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — journey-flow forms (6 routes) | Full `server.js` router dispatch: reject-without-token + full round-trip (render → extract real token → submit) per route | Integration |
| AC2 — annotations + skill-session-form + skill-commit-form (3 routes + 1 prerequisite fix) | Same dispatch pattern; annotations additionally gets a dedicated test proving the form-urlencoded parsing fix independent of CSRF | Integration |
| AC3 — products confirm + features (2 routes) | Same dispatch pattern | Integration |
| AC4 — legacy login shell (2 forms) | Same dispatch pattern via the real catch-all fallback path; round-trip test also serves as the regression guard for the pre-existing "always 403s" bug | Integration |
| AC5 — full round-trip for every route in AC1–AC4 | Folded into each route's own "full round trip" test above — no separate test file | Integration |

## Assumptions

- `sec-perf-s3`'s existing CSRF mechanism (`generateCsrfToken`, `csrfField`, `csrfGuard`) requires no modification and behaves identically at every new call site as it already does at the 4 existing ones.
- `journey.js`'s existing test suite's journey-creation fixtures can be reused as setup for the new AC1 tests rather than duplicated.
- The legacy login shell (`renderLoginPage()`) is confirmed still reachable in production as of 2026-08-24 (server.js's unconditional catch-all `else` branch for unauthenticated requests to unmatched routes) — not dead code.
- No other pre-existing test file dispatches any of these 9 routes through the real `server.js` router with an incomplete/no-CSRF-token request in a way that would newly regress once the gate is added (to be re-confirmed via a full-suite run at `/verify-completion`, following this session's own established practice of never assuming this without fresh evidence).

## Estimated touch points

**Files:** `src/web-ui/routes/journey.js`, `src/web-ui/routes/annotation.js`, `src/web-ui/views/artefact-view.js`, `src/web-ui/routes/skills.js`, `src/web-ui/views/commit-view.js`, `src/web-ui/routes/products.js`, `src/web-ui/utils/html-shell.js`, plus 4 new test files under `tests/`.
**Services:** None.
**APIs:** None — all changes are internal to this app's own server-rendered form/route handling.

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC coverage table:

- AC1 ↔ 12 tests across 6 journey-flow routes (reject-without-token + full round-trip each) — ✅ aligned.
- AC2 ↔ 7 tests: the prerequisite form-parsing-fix test, plus reject/round-trip pairs for annotations, skill-session-form, skill-commit-form — ✅ aligned. The prerequisite fix is explicitly named as in-scope in both the story (AC2's amended text) and this contract's "What will be built" section, not silently assumed.
- AC3 ↔ 4 tests across products/confirm and products/:id/features — ✅ aligned.
- AC4 ↔ 3 tests covering both legacy-shell forms, including the round-trip test that also serves as the regression guard for the pre-existing "always 403s" bug found during investigation — ✅ aligned.
- AC5 ↔ folded into each route's own "full round trip" test above, per the test plan's own explicit note that no separate AC5 test file exists — ✅ aligned, matches the story's own AC5 wording ("a round-trip test ... is run").

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform operator responsible for the security of state-changing form endpoints" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 12, AC2: 7, AC3: 4, AC4: 3, AC5: folded into the above (26 total) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions, each with a stated reason |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track feature, no benefit-metric artefact — see story's own Benefit Linkage field, matches the direct sibling precedent `sec-perf-s2`/`sec-perf-s3`'s own DoR handling |
| H6 | Complexity is rated | ✅ | Rating 2, Stable (updated 2026-08-24 after code investigation confirmed the full route count) |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track feature — `/review` is explicitly skipped per `CLAUDE.md`'s short-track flow (discovery through review, steps 1-4, are skipped; short-track starts directly at `/test-plan`) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps — see test plan's own Coverage gaps section |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies block lists `sec-perf-s3` as upstream, but the dependency is code-level (reusing an existing exported module's functions), not a `pipeline-state.json` field read — `schemaDepends: []` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated; reuses `sec-perf-s3`'s existing mechanism exactly, no new architecture decision introduced |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI/layout-dependent ACs — every AC is a backend HTTP-response-code assertion |
| H-NFR | NFR profile exists (or story has explicit NFR section) | ✅ | `artefacts/2026-08-17-remaining-csrf-form-coverage/nfr-profile.md` created 2026-08-24 (this feature's direct sibling, `sec-perf-s2`/`s3`, had none — creating one here is a stricter standard than precedent, not a gap) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance-regulated NFR named in the profile |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in the NFR profile |
| H-NFR-profile | NFR profile presence check (B1-enforce) | ✅ | Story's NFR section is populated; profile exists (see H-NFR) |
| H-GOV | Governance approval | ✅ N/A | No discovery artefact exists for this short-track feature — `## Approved By` check does not apply, matching `CLAUDE.md`'s short-track rule and the direct sibling `sec-perf-s2`/`s3` precedent. Operator is directly reviewing this DoR in-session. |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No new injectable adapter introduced — reuses `sec-perf-s3`'s existing, already-wired `csrfGuard`/`generateCsrfToken`/`csrfField` functions, which are plain exported functions, not an adapter-with-setter pattern |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review report exists (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT — see `decisions.md`, matching this session's own established precedent (`jatg-s1`, all 4 `vrne` stories) for solo-operator low-ambiguity mechanical stories |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | — |
