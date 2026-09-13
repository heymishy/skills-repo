# Definition of Done: Require verification-strength tagging and a live UI-evidence gate at /verify-completion and /definition-of-done

**PR:** https://github.com/heymishy/skills-repo/pull/873 | **Merged:** 2026-09-13T00:19:37Z
**Merge commit:** d632cfb943542b7137d900260c9399cd5c70edd5
**Story:** artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-verification-strength-and-ui-gate.md
**Test plan:** artefacts/2026-09-13-dod-live-verification-gate/test-plans/dvlg-s1-test-plan.md
**DoR:** artefacts/2026-09-13-dod-live-verification-gate/dor/dvlg-s1-dor.md
**Decisions:** artefacts/2026-09-13-dod-live-verification-gate/decisions.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `/verify-completion` requires real browser check / Playwright evidence / RISK-ACCEPT for a UI-rendering diff, blocks Step 4 otherwise — `verifyCompletionRequiresThreeOptionGateAndBlocks` test, re-run fresh against merged master | Automated content-assertion test (`unit`) | None |
| AC2 | ✅ | non-UI-touching diffs get an explicit N/A, check does not run unconditionally — `verifyCompletionStatesExplicitNAPath` test | Automated content-assertion test (`unit`) | None |
| AC3 | ✅ | every DoD AC's evidence carries a verification-strength tag; `unit`/`integration-real-code`-only evidence for an external-effect claim cannot be marked ✅ without either the live check or a named Follow-up Action — `dodRequiresVerificationStrengthTagAndExternalEffectRule` test | Automated content-assertion test (`unit`) | None |
| AC4 | ✅ | browser-observable DoD ACs get the same three-option gate before ✅ — `dodAppliesSameThreeOptionUIGateBeforeMarkingAcSatisfied` test | Automated content-assertion test (`unit`) | None |
| AC5 | ✅ | `check-skill-contracts.js` passes with the new required strings for both skills — `skillContractsGuardBothNewSections` + `skillContractsScriptActuallyPasses` (runs the real script), re-run fresh: `41 skill(s), 192 contract(s) OK` | Automated test + integration test (`integration-real-code`) | None |

**All 5 ACs satisfied.** 7/7 tests re-run fresh against merged master (commit `d632cfb9`), 0 failures.

**Verification strength:** 4 unit, 1 integration-real-code, 0 live-verified, 0 production-observed. All 5 ACs describe changes to instructional text consumed by a model, not a runtime external effect — none carry an external-effect claim requiring live/production evidence under this story's own new AC3 rule (self-consistently applied).

---

## Scope Deviations

None. The merged diff (`skills/verify-completion/SKILL.md`, `skills/definition-of-done/SKILL.md`, `.github/scripts/check-skill-contracts.js`, the new test file `tests/check-dvlg-s1-verification-strength-and-ui-gate.js`, artefacts under `artefacts/2026-09-13-dod-live-verification-gate/`, and `.github/pipeline-state.json`) maps directly to the story. One test regex fix during implementation (AC4's assertion expected a bare `⚠️` but the actual instruction text used backtick-wrapped `` `⚠️` `` — the test was corrected to match the real, intentional text, not the other way around).

---

## Test Plan Coverage

**Tests passing:** 7/7, re-run fresh 2026-09-13 against merged master (commit `d632cfb9`) — `tests/check-dvlg-s1-verification-strength-and-ui-gate.js`.

**Gaps:** None. Per the story's own Architecture Constraints, both target files are pure conversational-instruction Markdown, not executable code — tests assert on the literal instruction text present in the real files (this repo's established pattern, `evcg-s1`), plus one integration test that actually runs `check-skill-contracts.js` via `execSync` rather than only source-inspecting it.

**Full regression suite:** 650 files run, 1 failure — `tests/check-p3.5-validate-trace.js` (`ps1-exits-0-on-valid-repo-with-ci-flag`), the pre-existing documented resource-contention flake tracked in this repo's own baseline. No new regressions.

**Real-world validation beyond the test plan itself:** this story is itself the direct, applied fix for a finding from the 2026-09-12/13 DoD-triage sweep — `tgid-s1` and `wusl-s2` had both closed `COMPLETE` on unit-test evidence alone for claims about real external effects (a PostHog group-identify call; a session surviving a real server restart), and both required a separate, operator-requested live check after the fact to actually confirm. `tgid-s1`'s live check additionally surfaced a real, unrelated blocker (PostHog's Group Analytics addon not being subscribed on this project) that no unit test could ever have found. This story's own AC3/AC4 rules, applied retroactively, would have caught both gaps at DoD time instead of after.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — zero added local runtime for diffs that don't touch rendered UI or browser-observable ACs | ✅ | `verifyCompletionStatesExplicitNAPath` test confirms the explicit N/A / "does not run unconditionally" language is present |
| Security / Accessibility / Data-residency / Availability | ✅ N/A | Instruction-text-only change, no new runtime code surface (per story's own NFR framing) |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). This story closes a structural gate gap found during the 2026-09-12/13 pipeline-state DoD-triage sweep, and separately applies an already-approved, previously-unenforced proposal (`workspace/proposals/2026-08-29-verify-completion-improve-proposal.md`) that had sat `pending_review` for two weeks — its own delay was cited by the operator as direct evidence that DoD/process-improvement mechanisms need to be more triggered, not optionally reviewed.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **CI false-failure during delivery, correctly diagnosed rather than worked around.** PR #873's "Scenario A E2E (staging)" check initially showed `fail`, but the actual annotation was "Canceling since a higher priority waiting request for deploy-group exists" — a concurrency-group cancellation (likely triggered by this same session's own flurry of `flyctl machine restart` calls and rapid pushes during `wusl-s2`'s live-verification work colliding on a shared deploy concurrency lock), not a real test failure. Fixed via `gh run rerun 34725053848 --failed`; both Scenario A (2m10s) and Scenario B (1m50s) E2E genuinely passed on re-run. No skill or gate change was needed — this was operational noise, not a defect in the delivered fix.
2. **Self-referential scope note:** every AC in this story is itself instruction-text-only (no runtime external effect), so under this story's own new AC3 rule, none of its ACs require live/production evidence — all 5 are correctly `unit`/`integration-real-code`-tagged with no Follow-up Action needed. This is the expected, non-hypocritical outcome for a story whose subject is process instructions rather than application behaviour.
3. **This story, plus ADR-030 (PR-state reconciliation) and ADR-031 (structured follow-up-action registry) in `.github/architecture-guardrails.md`, together close out the full set of findings from the 2026-09-12/13 sweep** — the two live-verification gaps (this story), the `pipeline-state.json` PR-state corruption class (ADR-030, found via `eatrl-s1`/`srmw-s1`), and the lack of a durable, structured place to track follow-up items found mid-sweep (ADR-031).
