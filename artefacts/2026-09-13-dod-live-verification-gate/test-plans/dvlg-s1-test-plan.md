# Test Plan: Require verification-strength tagging and a live UI-evidence gate (dvlg-s1)

**Story:** artefacts/2026-09-13-dod-live-verification-gate/stories/dvlg-s1-dod-verification-strength-and-live-ui-gate.md
**Track:** Short-track

---

## Test Cases

This is a SKILL.md instruction-file change, not runtime application code — `/verify-completion` and `/definition-of-done` are conversational skill instructions consumed by a model, not executable functions. Tests assert on the actual instruction text, following the established pattern in `tests/check-evcg-s1-verify-completion-e2e-check.js`.

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Text-assertion | `/verify-completion` names the three-option gate (real browser check / Playwright evidence / RISK-ACCEPT) and blocks Step 4 without one |
| T2 | AC2 | Text-assertion | `/verify-completion` states the explicit N/A path and "do not run this check unconditionally" |
| T3 | AC3 | Text-assertion | `/definition-of-done` requires a verification-strength tag per AC and names the external-effect mismatch rule |
| T4 | AC4 | Text-assertion | `/definition-of-done` applies the same three-option UI-evidence gate before marking a browser-observable AC ✅ |
| T5 | AC5 | Integration | `node .github/scripts/check-skill-contracts.js` actually passes (not just source-inspected) |
| T6 | Non-regression | Text-assertion | Pre-existing sections in both SKILL.md files are untouched |

## Regression coverage

- `tests/check-evcg-s1-verify-completion-e2e-check.js` re-run unmodified — all its existing assertions about the Route/handler E2E coverage check must still hold (this story is additive, not a rewrite).

## Out of Scope (per story)

- `/branch-complete` or any other skill file.
- Retroactive re-verification of already-closed stories.
- The reconciliation-job and follow-up-registry proposals (ADR-030/ADR-031) — separate, not part of this diff.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
