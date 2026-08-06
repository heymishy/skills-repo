# Discovery: Outer-Loop Flag Reconsideration — Maximize Real Context-Savings

**Status:** Approved
**Created:** 2026-08-07
**Approved by:** Hamish King — Platform maintainer / Product owner — 2026-08-07
**Author:** Copilot (Claude Code)

---

## Problem Statement

`--with-outer-loop`'s only real effect today is presentational: it controls whether the assembled instruction file's session-start section lists the 8 outer-loop skills (discovery through decisions) as "active" versus "installed but not yet enabled." It does not gate anything structural — every skill file, outer-loop included, is always copied to disk unconditionally, per `rb-s2`'s own already-shipped AC1 guarantee ("the target directory contains the platform's complete current skill set... not a subset or placeholder"). This was confirmed as a real usability concern through direct operator use this session: the flag's value proposition was unconvincing in practice, since a consumer could simply run `/discovery` regardless of the flag's state (the skill file is right there on disk). The one legitimate remaining rationale — progressive skill disclosure as a context-budget technique, already a named architectural value in this platform (`product/constraints.md` #14) — is only partially realized by the current implementation: the "disabled" branch already produces a cheaper, shorter presentation than the "enabled" branch (confirmed in `rb-s5`'s own NFR investigation), but the "enabled" branch's per-skill description-and-triggers extraction is itself inefficient (the redundant double-extraction `scr-s1` is fixing), and there has been no explicit design pass asking whether the disabled-branch presentation is actually *maximizing* the context savings the flag exists to provide, versus just being "not as bad as the enabled branch."

## Who It Affects

**Every operator or user of the hosted SaaS UI, or of a bootstrapped CLI repo, who isn't Hamish King** — anyone deciding at bootstrap time (or later, via a re-run) whether they want the full discovery-through-DoD outer loop presented as active tooling, versus running only inner-loop work against an already-defined story. This includes solo evaluators trying the platform for the first time (where a shorter, less overwhelming instruction file plausibly matters most) and teams who have deliberately decided to keep outer-loop work in a different tool/process and only want this platform for inner-loop execution.

## Why Now

Directly surfaced by real usage this session, immediately after the mechanism was built (`rb-s5`, 2 days prior) — the reasoning for keeping, changing, or removing it is still fresh, and the flag has not yet been relied upon by any real external adopter (this platform has no external consumers yet per `product/roadmap.md`'s commercialisation track status), so there is no compatibility cost to changing its behaviour now versus after it ships to a first beta customer.

## MVP Scope

Simplify the flag's disabled-state *effect* to actually maximize the context-savings it exists to provide, rather than removing the flag or merely fixing its documentation. Concretely: when `outerLoop.enabled: false`, the assembled instruction file's session-start section collapses the 8 individual outer-loop skill descriptions (each currently extracted via `assemble-copilot-instructions.sh`'s per-skill description+triggers logic) into a single one-line summary — e.g. "Outer loop (discovery through decisions, 8 skills) is installed but not active. Run `skills-repo init . --with-outer-loop` to enable it." — naming the exact re-enable command, not just that the skills exist. When `outerLoop.enabled: true`, behaviour is unchanged from today (full per-skill descriptions, matching `scr-s1`'s already-planned redundant-call fix for that branch).

## Out of Scope

- **Any change to `rb-s2`'s unconditional file-copy guarantee** — settled, already shipped, not reopening; every skill file stays present on disk regardless of this flag's state, in either direction.
- **Any change to the inner-loop skill set itself** — this reconsideration is scoped entirely to the outer-loop skills' *presentation*, not which skills exist or what they do.
- **Removing the flag entirely** — considered and explicitly not chosen (see Assumptions); this MVP keeps the flag and improves what it actually does.

## Assumptions and Risks

[ASSUMPTION] Collapsing 8 skill descriptions into one line measurably reduces the assembled instruction file's token count by an amount worth the added code complexity of a second presentation branch — unconfirmed without measuring the actual before/after token delta; requires verification at `/definition` or implementation time before claiming this as a real benefit, not just a plausible one.

**Risk:** If the token savings from collapsing the disabled-state description turn out to be trivial (a few hundred tokens at most, given 8 one-line skill descriptions were never large to begin with), this MVP's entire justification collapses to "it's a nicer message," which is a legitimate but much smaller benefit than "meaningful context-budget management" — worth being honest about if the measurement doesn't support the larger claim.

**What could make this not worth building:** If the token measurement in the open assumption above shows the savings are negligible, the better outcome may be Option 2 from the original three considered (keep the mechanism as-is, just fix the misleading "enables outer-loop skills" framing in documentation) rather than building a second presentation branch for a marginal gain.

## Directional Success Indicators

**Instruction-file token reduction in the disabled state.** Baseline: current disabled-branch token count (to be measured at `/definition` or implementation time — not yet measured as of this discovery). Target: a measurable, non-trivial reduction (the specific threshold for "non-trivial" is deferred to `/definition`, once the baseline is known — this discovery explicitly avoids inventing a number without first measuring the actual current cost). Measured via: token-counting the assembled instruction file's session-start section in both states, before and after this change.

**Re-enable discoverability.** Baseline: today's disabled-state message already names outer-loop skills as "installed but not yet enabled" but does not consistently name the exact re-enable command in one place. Target: the collapsed one-line message always includes the literal `--with-outer-loop` re-enable command. Measured via: a test asserting the exact command string appears in the disabled-state output.

## Constraints

- **Team capability:** Solo maintainer — the collapsed-message design should reuse `scr-s1`'s already-planned single-source-of-truth skill categorization (`SKILL_CATEGORIES`) rather than inventing a second categorization read path.
- **Sequencing:** This reconsideration's implementation should land after (or alongside) `scr-s1`, since both touch `assemble-copilot-instructions.sh`'s outer-loop presentation logic — implementing them independently risks a merge conflict or duplicated logic in the same script region.
- **Budget:** None.

## Contributors

- Hamish King — Platform maintainer / Product owner

## Reviewers

- Hamish King — Platform maintainer / Product owner

## Approved By

Hamish King — Platform maintainer / Product owner — 2026-08-07

---

**Next step:** /definition (benefit-metric skipped per this item's explicitly chosen lighter process weight — discovery+definition pass only)
