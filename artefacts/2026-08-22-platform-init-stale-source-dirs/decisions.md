# Decisions Log: platform-init stale source directories

## RISK-ACCEPT — W4: Verification script not reviewed by a domain expert before DoR sign-off

**Date:** 2026-08-22
**Context:** `pisd-s1`'s DoR run flagged W4 — the AC verification script (`artefacts/2026-08-22-platform-init-stale-source-dirs/verification-scripts/pisd-s1-verification.md`) has not been walked through by a domain expert ahead of implementation.
**Decision:** Proceed without a pre-implementation review. The operator chose to acknowledge the risk rather than block on it, matching the precedent already set this session for `cmba-s1`.
**Rationale:** This is a bounded, low-ambiguity path-constant fix (`platform-init.js`'s `COPY_DIRS` source paths) with a small, mechanically-derived verification script (4 scenarios plus one investigation edge case). The risk of an unreviewed script missing edge cases is lower here than for a UI-behaviour story — the scenarios are direct file-count/presence checks against already-known real skill/template names, not subjective UX judgment calls. AC5 (the one genuinely judgment-dependent item — what `.github/skills/`'s current content is for) is explicitly carried forward as its own investigation requirement, not silently accepted.

## RISK-ACCEPT — Pre-existing baseline failures acknowledged at /branch-setup

**Date:** 2026-08-22
**Context:** `/branch-setup`'s clean-baseline check found 5 failing files in the worktree: `scripts/check-pipeline-state-integrity.js` (3 pre-existing C3 partial-pass entries, already-accepted baseline throughout this session — `wucp.1`, `lab-s3.1`, `rb-s5`), `tests/check-i1.2-platform-init-fetch.js` (2 failures — this is the exact bug `pisd-s1` exists to fix; expected to fail until the fix lands), `tests/check-p3.5-validate-trace.js` (genuinely reports 2 real un-approved discovery drafts, unrelated to this story), `tests/check-p4-enf-decision.js` (T6/T7 — a genuine, separately-tracked governance-coverage gap, unrelated to this story), and `tests/check-wsm2-collaborative-sessions.js` (T2/T4 — the F14/`jatg-s1` access-control bug, separately tracked, unrelated to this story).
**Decision:** Acknowledge as pre-existing and proceed with implementation, per `/branch-setup`'s own documented option 2.
**Rationale:** All 5 failing files are already fully diagnosed and either (a) this story's own known target (`i1.2`), or (b) already logged as separate, independently-tracked findings from earlier in this same session (F14/`jatg-s1`, the p3.5/p4-enf-decision governance gaps, and the pre-accepted C3 integrity baseline). None represent a new, unexplained regression this story would be masking.

## AC5 investigation — what `.github/skills/`'s current 5-entry subset is for

**Date:** 2026-08-22
**Investigation:**
- `git log --follow -- .github/skills/infra-definition/SKILL.md`: single commit `c7059896` (2026-06-25, `feat(inf.1): infra-definition SKILL.md with blast-radius, rollback, tier table`).
- `git log --follow -- .github/skills/schema-migration-plan/SKILL.md`: single commit `4ce1e96c` (2026-06-25, `feat(mig.1): create schema-migration-plan SKILL.md`).
- `git log --follow -- .github/templates/staging-data-policy.md`: single commit `364592e3` (2026-06-25, `feat(mig.5): staging-data-policy.md template with three options and declared-choice field`).
- All three (and, by the same pattern, `infra-plan`, `infra-review`, `schema-migration-review`) were added **two days after** the repo-root migration commit `1b1d0682` (2026-06-23, `feat(phase-0): ... migrate skills/templates to repo root`). None of the six files exist under a matching name in root `skills/`/`templates/` — no collision.
- `git grep -n "infra-definition\|infra-plan\|infra-review\|schema-migration-plan\|schema-migration-review"` (excluding `.github/skills` and `artefacts`) returns no hits — nothing else in the codebase specifically depends on these files living at `.github/skills/` rather than `skills/`.

**Conclusion (c): these are real, general-purpose pipeline skills/template that were added to the wrong (legacy, pre-migration) directory by mistake** — not dead leftovers, and not something requiring special preservation logic. `inf.1`/`mig.1`/`mig.5` (and presumably `inf.2`/`inf.3`/`mig.2`) were authored after the migration but the authors placed new files at the old `.github/skills/`/`.github/templates/` path, likely following outdated local habit/muscle memory rather than the new convention the rest of the repo had already moved to.

**Decision:** Move all 6 files (`infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review` directories; `staging-data-policy.md`) from `.github/skills/`/`.github/templates/` to root `skills/`/`templates/` via `git mv`, so they become ordinary members of the real, canonical skill/template set — no merge logic or second `COPY_DIRS` entry needed. Once moved, the AC1 fix (sourcing `COPY_DIRS` from `skills/`/`templates/`) picks them up automatically, and this also removes their exposure to F15/`csdg-s1`'s separate `.github/skills/`-default-resolution gap (once that story's own fix lands, every skill including these 5 resolves correctly via the corrected default).
**Note:** this leaves `.github/skills/` and `.github/templates/` empty after the move — expected and correct, since those directories' only real role (per F15's own investigation) is as the bootstrap-install *destination* for consumer repos, not a source directory in this repo.
