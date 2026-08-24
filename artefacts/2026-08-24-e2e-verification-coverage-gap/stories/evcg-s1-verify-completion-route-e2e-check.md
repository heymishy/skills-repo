## Story: Close the E2E verification blind spot in /verify-completion and /branch-complete

**Epic reference:** None — short-track, closing a structural gate gap found during `rcfc-s1`'s (`2026-08-17-remaining-csrf-form-coverage`) own post-branch-complete CI remediation
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [pipeline-infrastructure, testing]

## User Story

As a **coding agent running `/verify-completion` before opening a PR**,
I want **an explicit, mandatory instruction to check for and run any locally-runnable E2E spec coverage of the routes/handlers my story's diff touches, and to name any coverage that cannot be verified locally as an explicit residual risk**,
So that **a story that passes local "full suite" verification does not silently open a PR against a real, CI-only-catchable regression, and any risk that genuinely cannot be closed pre-merge is stated, not hidden**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track process-gap closure, no benefit-metric artefact).
**How:** `rcfc-s1` ran `node scripts/run-all-tests.js` (543/0) at `/verify-completion`, opened a draft PR on that evidence, and then failed two separate CI-only gates in sequence: (1) the "Cross-tenant isolation spec" job — a `@mocked`-tagged Playwright E2E spec that would have failed identically if run locally, because `npm test` never invokes `npm run test:e2e`; (2) "Scenario A E2E (staging)" — a `@real-staging`-tagged spec that cannot be verified locally at all, since it runs against whatever is *currently deployed* to real `wuce-staging`, not this branch's own code. This story closes gap (1) (the genuinely closable one) and makes gap (2) an explicit, named risk in the completion report rather than a silent omission, for every future story that touches a route with existing E2E coverage.

## Architecture Constraints

- No new test framework, no new CI workflow. This is a `SKILL.md` instruction change to `skills/verify-completion/SKILL.md` and `skills/branch-complete/SKILL.md`, plus a matching `check-skill-contracts.js` entry, following the governed platform-change policy (PR required, not a direct master commit).
- Per this repo's own established pattern for SKILL.md instruction changes (`tests/check-csd-s4-data-model-diagram-instruction.js`, `tests/check-dta-s1-domain-tag-activation.js`), the "test" for this story is a dedicated test file that reads the actual `SKILL.md` file content and asserts the required instruction text is present — these are conversational instructions consumed by a model, not executable functions.
- Do not attempt to make `/verify-completion` run the *full* `npm run test:e2e` suite unconditionally — that suite includes `@real-staging`-tagged specs that hit real external infrastructure and require secrets not available to every contributor; this is exactly why the existing CI-side "Playwright E2E smoke tests" job is itself opt-in (`audit.e2e_tests` flag) and `continue-on-error: true`. The fix must be scoped: only the specific spec file(s) whose content references a touched route, and only the `@mocked`-tagged ones run automatically.

## Dependencies

- **Upstream:** None.
- **Downstream:** None — this changes instructions consumed by future `/verify-completion`/`/branch-complete` runs; it does not require any other story's cooperation.

## Acceptance Criteria

**AC1:** Given `skills/verify-completion/SKILL.md`'s Step 1, When a coding agent's diff touches any file under `src/web-ui/routes/` or a middleware wrapping a route handler, Then the instructions explicitly require identifying every touched route/handler and grepping both `tests/*.js` and `tests/e2e/*.spec.js` for any file that calls that handler directly or POSTs/interacts with that route path — not just the story's own new test files.

**AC2:** Given a match found in `tests/e2e/*.spec.js` tagged `@mocked` (or otherwise defaulting to the local `webServer`, no `@real-staging` tag), When `/verify-completion` runs, Then the instructions require running that spec file locally (`npx playwright test tests/e2e/<file> --repeat-each=1`, no `E2E_STAGING_BASE_URL` override) as part of the evidence gate, and a failure there blocks completion exactly like a failing unit test.

**AC3:** Given a match found in `tests/e2e/*.spec.js` tagged `@real-staging`, When `/verify-completion` runs, Then the instructions require explicitly naming that spec file as an unverifiable-pre-merge residual risk in the Step 4 completion report — not attempting to run it locally against real staging, and not silently omitting it either.

**AC4:** Given `skills/branch-complete/SKILL.md`'s Step 1 ("Final test verification"), When it runs, Then the instructions explicitly reference re-running `/verify-completion`'s Step 1 route/handler coverage check (by reference, not duplicated text) to confirm nothing changed since that gate last ran.

**AC5:** Given `.github/scripts/check-skill-contracts.js`'s `CONTRACTS` array entries for `verify-completion` and `branch-complete`, When this story's changes are committed, Then both entries include new required-string markers matching the new mandatory instruction text, so a future edit cannot silently strip this step without failing the pre-commit governance check.

## Out of Scope

- Making `/verify-completion` or `/branch-complete` run the full, unscoped `npm run test:e2e` suite — explicitly rejected per Architecture Constraints (would require staging secrets not every contributor has, and would slow every future story's local verification regardless of whether it touches a route at all).
- Any change to the actual CI workflow files (`.github/workflows/e2e.yml`, `bri-s3.4-cross-tenant-repeat-gate.yml`) — those gates already exist and already work correctly; this story only closes the *local pre-push* blind spot, not the CI-side gates themselves.
- Retroactively auditing other already-merged stories for the same blind spot — this story is a forward-looking process fix, not a backlog sweep.
- Building an automated "which routes does this diff touch" tool — the instruction is a manual grep step for the coding agent to follow, not new tooling.

## NFRs

- **Performance:** The new check must stay fast for stories that don't touch any route file — the grep-then-conditionally-run structure means zero added local runtime for non-route-touching stories.
- **Security:** Not applicable — this is a process/instruction change, no new code surface.
- **Accessibility:** Not applicable.
- **Audit:** Not applicable — no new logging behaviour.

## Complexity Rating

**Rating:** 1 — well-understood, clear path. Two `SKILL.md` text edits, one `check-skill-contracts.js` entry update, one new SKILL-content test file, following an already-established pattern in this repo (`csd-s4`, `dta-s1`) for exactly this kind of change.
**Scope stability:** Stable — the fix design is fully grounded in the two real, already-observed failure modes from `rcfc-s1`'s own CI remediation phase, not speculative.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
