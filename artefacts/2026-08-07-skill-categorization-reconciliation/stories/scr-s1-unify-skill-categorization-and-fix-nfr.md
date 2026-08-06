## Story: Unify skill-categorization into one source of truth and close the --with-outer-loop NFR gap

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
<!-- No domain field: this story touches CI-governance and CLI-assembly scripts, which don't clearly match any domain in .github/standards/index.yml (api/auth/data/web-ui/payments/ui/security) -- omitted rather than forced into an inaccurate match. -->

## User Story

As a **platform maintainer relying on skill categorization staying consistent across this repo's CI governance checks and its CLI bootstrap tooling**,
I want **a single source of truth for which skills are outer-loop vs inner-loop, with the `--with-outer-loop` assembly step's redundant subprocess calls eliminated**,
So that **adding a new skill to one categorization list can't silently diverge from the other, and the `--with-outer-loop` NFR budget (≤3 seconds) is actually met instead of honestly failing at ~3.6–3.7 seconds**.

## Benefit Linkage

**Metric moved:** Two related operational/maintenance-debt gaps closed together (short-track, no formal benefit-metric artefact).
**How:** `.github/scripts/check-assembly.js` hardcodes its own `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` arrays, entirely independent from `cli/lib/skills-registry.js`'s own `SKILL_CATEGORIES` mapping — two sources of truth for the same classification that will silently diverge the moment a skill is added to one without the other. Separately, `rb-s5`'s own `decisions.md` left an NFR honestly failing (measured ~3.6–3.7s vs. a 3s budget) and root-caused it to `assemble-copilot-instructions.sh` calling `get_skill_triggers` twice per outer-loop skill (once to check presence, once to format output) — its own revisit trigger explicitly names reconciling the categorization as a plausible path to also closing this gap.

## Architecture Constraints

- **Single-source-of-truth constraint:** `cli/lib/skills-registry.js`'s already-exported `SKILL_CATEGORIES` object becomes the one place a skill's outer-loop/inner-loop/ancillary category is declared. `check-assembly.js`'s `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` arrays are replaced by deriving from `SKILL_CATEGORIES` (filtered by `category === 'outer-loop'` / `'inner-loop'`), not duplicated a third time.
- **No D37/adapter concern:** both `check-assembly.js` and `assemble-copilot-instructions.sh` are build-time/CI-time scripts with no runtime external service calls — this is a script-level refactor, not a new injectable adapter.
- **Cross-directory require is a new but architecturally sound pattern:** `.github/scripts/check-assembly.js` currently has zero module dependencies beyond Node built-ins; requiring `cli/lib/skills-registry.js` from it is a plain relative `require()`, not a violation of any existing boundary.

## Dependencies

- **Upstream:** None — `cli/lib/skills-registry.js`'s `SKILL_CATEGORIES` and `.github/scripts/check-assembly.js` already exist and are in production/CI use.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `check-assembly.js` currently hardcodes `OUTER_LOOP_SKILLS`/`INNER_LOOP_SKILLS` arrays independently from `cli/lib/skills-registry.js`'s `SKILL_CATEGORIES`, When this story ships, Then `check-assembly.js` derives both lists from `SKILL_CATEGORIES` instead of maintaining a separate copy — a skill's category is declared in exactly one place in the codebase.

**AC2:** Given a new skill is added to `SKILL_CATEGORIES` with `category: 'outer-loop'` (or `'inner-loop'`), When `check-assembly.js`'s progressive-disclosure check (AC3 of its own original story) next runs, Then the new skill is automatically included in its check without any change to `check-assembly.js` itself — proving the two lists can no longer silently diverge.

**AC3:** Given `assemble-copilot-instructions.sh`'s `--with-outer-loop` "enabled" branch currently calls `get_skill_triggers` twice per outer-loop skill (once for the presence check, once for the formatted output), When this story ships, Then the triggers value is computed once per skill and reused for both purposes, eliminating the redundant subprocess spawn.

**AC4:** Given the NFR threshold "`--with-outer-loop` adds no more than 3 seconds" (`rb-s5`'s own NFR, currently honestly failing at ~3.6–3.7s on Windows/Git-Bash per its `decisions.md` RISK-ACCEPT), When this story's subprocess-reduction fix (AC3) ships, Then the measured overhead on the same Windows/Git-Bash environment is re-verified against the 3-second threshold, and `rb-s5`'s RISK-ACCEPT is either resolved (removed, with updated passing measurements) or explicitly re-affirmed with fresh measurements if it still doesn't pass.

## Out of Scope

- **The "Core Platform Layer" loop's own separate description-extraction calls** — `rb-s5`'s own root-cause analysis attributes the NFR overage specifically to the "enabled" branch's per-outer-loop-skill extraction, not this pre-existing, unmodified loop; touching it is a larger, separate concern.
- **Any change to which skills ARE outer-loop vs. inner-loop** — this story only unifies *how* that classification is stored and read, not the classification itself.
- **Rewriting `assemble-copilot-instructions.sh`** in a different language or architecture — stays a bash script; this is a targeted subprocess-count fix.

## NFRs

- **Performance:** The explicit target of AC4 — re-verify `--with-outer-loop`'s measured overhead against the existing 3-second budget on the same Windows/Git-Bash environment `rb-s5` measured on.
- **Security:** None new.
- **Accessibility:** Not applicable — no UI surface.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — touches both a CI governance script (JS) and a bash assembly script, requiring cross-language coordination, though each individual change is well understood.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
