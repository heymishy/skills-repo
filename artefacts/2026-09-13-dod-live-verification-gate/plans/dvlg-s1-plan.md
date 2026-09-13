# Implementation Plan: dvlg-s1

**Story:** artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-dod-verification-strength-and-live-ui-gate.md
**Test plan:** artefacts/2026-09-13-dod-live-verification-gate/test-plans/dvlg-s1-test-plan.md

## Tasks

1. Add "Live browser render check" section to `skills/verify-completion/SKILL.md`, mirroring the existing "Route/handler E2E coverage check" conditional-step pattern exactly.
2. Update `/verify-completion`'s Step 4 completion-report template and "Common failures" table to surface the new signal.
3. Add "Verification strength" and "UI-evidence gate" sections to `skills/definition-of-done/SKILL.md`'s Step 2.
4. Update `/definition-of-done`'s Completion output template to surface both new signals.
5. Update `.github/scripts/check-skill-contracts.js` with new required strings for both skills.
6. Apply the already-approved 2026-08-29 `verify-completion` improve-proposal (status flipped to `accepted`, applied note added).
7. Write `check-dvlg-s1-verification-strength-and-ui-gate.js`, covering AC1-AC5 plus the skill-contracts integration test and a non-regression check.
8. Re-run `tests/check-evcg-s1-verify-completion-e2e-check.js` unmodified — confirm all 9 tests still pass.
9. Run the full `npm test` suite — confirm no new regressions.
10. Commit, push, open draft PR, gate-advance to `branch-complete`.

## Notes

`.github/architecture-guardrails.md`'s ADR-030/ADR-031 (the reconciliation-job and follow-up-registry proposals) are committed separately, directly to master — not part of this PR, since architecture-guardrails.md is not in CLAUDE.md's Platform Change Policy PR-required list.
