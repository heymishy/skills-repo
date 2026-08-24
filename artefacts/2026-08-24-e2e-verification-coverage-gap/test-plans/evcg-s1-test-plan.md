## Test Plan: Close the E2E verification blind spot in /verify-completion and /branch-complete

**Story reference:** artefacts/2026-08-24-e2e-verification-coverage-gap/stories/evcg-s1-verify-completion-route-e2e-check.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/verify-completion` Step 1 requires identifying touched routes and grepping both `tests/*.js` and `tests/e2e/*.spec.js` | 1 test | — | — | — | — | 🟢 |
| AC2 | `@mocked`/untagged E2E matches run locally, failure blocks completion | 1 test | — | — | — | — | 🟢 |
| AC3 | `@real-staging` matches named as residual risk, not run locally | 1 test | — | — | — | — | 🟢 |
| AC4 | `/branch-complete` Step 1 references the check by reference, not duplicated | 1 test | — | — | — | — | 🟢 |
| AC5 | `check-skill-contracts.js` guards both new sections | 1 test | 1 test (runs the real script) | — | — | — | 🟢 |

This is a `SKILL.md` instruction change, not runtime application code — `/verify-completion` and `/branch-complete` are conversational instructions consumed by a model, not executable functions. Per this repo's established pattern for exactly this kind of change (`tests/check-csd-s4-data-model-diagram-instruction.js`, `tests/check-dta-s1-domain-tag-activation.js`), tests assert on the actual instruction text present in the real files, plus one integration test that runs the real `check-skill-contracts.js` governance script end-to-end (not just inspects its source) to prove the new contract entries genuinely match the live prose, not a stale copy.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** The real `skills/verify-completion/SKILL.md`, `skills/branch-complete/SKILL.md`, and `.github/scripts/check-skill-contracts.js` files themselves — no synthetic fixtures needed, this is a content-assertion test suite.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC5 | The 3 real files' post-change content | Repo files, read directly | None | Whitespace-normalised phrase matching, matching this repo's established SKILL.md content-test convention (hard-wrapped CRLF prose) |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Test file

### `tests/check-evcg-s1-verify-completion-e2e-check.js`

9 tests total:

- **routeDiffTriggersGrepBothTestSuites (AC1)** — asserts the new heading exists, names `src/web-ui/routes/`, requires grepping both `tests/*.js` and `tests/e2e/*.spec.js`, and explicitly says "not just this story's own new test files."
- **mockedMatchRunsLocallyAndBlocksOnFailure (AC2)** — asserts the exact local-run command (no staging override) and that a failure there blocks completion "exactly like a failing unit test."
- **realStagingMatchNamedAsResidualRiskNotRunLocally (AC3)** — asserts the "cannot be verified pre-merge by design" framing, the explicit instruction not to run it locally, the "never omit it silently" clause, and that Step 4's completion output template gained an `E2E route coverage:` / residual-risk line.
- **branchCompleteReferencesVerifyCompletionCheckByReference (AC4)** — asserts `/branch-complete` references the check by name/link rather than duplicating the full instruction text (checked negatively: the full grep-instruction string must NOT appear in `branch-complete/SKILL.md`).
- **skillContractsGuardBothNewSections (AC5)** — parses `check-skill-contracts.js`'s own `CONTRACTS` array source for the `verify-completion` and `branch-complete` blocks and asserts each contains the new required-string markers.
- **skillContractsScriptActuallyPasses (integration)** — actually executes `node .github/scripts/check-skill-contracts.js` as a subprocess and asserts it reports `OK` — proves the contract entries are genuinely in sync with the live file content, not just present in both places by coincidence.
- **nonRouteTouchingDiffSkipsCheckExplicitly (NFR-performance)** — asserts the explicit "N/A — no route/handler files touched" language and "do not run this check unconditionally" exist, so a non-route-touching story's local verification stays fast.
- **doesNotMandateFullUnscopedE2ESuite (out of scope guard)** — asserts the explicit rejection of running the full unscoped `npm run test:e2e` suite, and that the reasoning (CI's own smoke job being opt-in/`continue-on-error`) is stated, not just asserted.
- **non-regression: existing sections untouched** — confirms pre-existing headings and the Iron Law text in both files are still present, proving this change only inserts new sections rather than rewriting existing ones.

---

## NFR Tests

### performance — nonRouteTouchingDiffSkipsCheckExplicitly

- **NFR addressed:** Performance (Architecture Constraints: "zero added local runtime for non-route-touching stories")
- **Measurement method:** Structural assertion that the SKILL.md text explicitly gates the check on route/handler files being touched, and instructs skipping otherwise
- **Pass threshold:** Both the "N/A" template line and the "do not run unconditionally" instruction are present
- **Tool:** Node `assert`-equivalent boolean check, part of the test file above

No Security/Accessibility/Data-residency/Availability NFR tests — this story introduces no new code surface, only instruction text (per the story's own NFR framing: all "Not applicable").

---

## Out of Scope for This Test Plan

- Actually exercising `/verify-completion` end-to-end against a real story's diff (would require a full second story to drive through the pipeline) — the story's own Architecture Constraints scope this to instruction-content correctness, matching the established precedent for SKILL.md-only changes.
- Testing the CI-side `.github/workflows/e2e.yml` behaviour — unchanged by this story.

---

## Test Gaps and Risks

None.
