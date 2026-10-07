# Story: /improve must default to Sonnet, matching the same conservative-absent-evidence precedent already applied to /ideate

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real gap found mid-session below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator clicking "Review" on a signal (or otherwise launching `/improve`)**,
I want **that session to run on the same quality tier this codebase already uses for every other open-ended synthesis task**,
So that **signal-triage and improvement-proposal output isn't silently generated on a cheaper model with no evidence it performs adequately for this specific, judgment-heavy task**.

## Benefit Linkage

**Metric moved:** None formally tracked — this is a short-track model-routing correctness fix, not a metric-bearing feature. Direct benefit: closes a real, confirmed gap found while investigating signals-panel work this session (2026-10-06/07). `src/web-ui/config/model-routing.js`'s `DEFAULT_SONNET_SKILLS` (`['discovery', 'ideate']`) and `DRIFT_GUARD_SONNET_SKILLS` (the 8 governance-gate skills forced to Sonnet via Fly secrets) both omit `improve` — it falls through to the Haiku default with zero skill-specific eval evidence backing that choice.
**How:** Brings `/improve` in line with this codebase's own already-established precedent for exactly this situation (see Architecture Constraints) — no new policy invented, an existing one correctly applied to a skill it was never checked against.

## Architecture Constraints

**Root cause, fully confirmed (not speculative) — read directly, not guessed:**
- `src/web-ui/config/model-routing.js:30`: `const DEFAULT_SONNET_SKILLS = ['discovery', 'ideate'];` — `improve` is absent.
- `src/web-ui/config/model-routing.js:46`: `const DRIFT_GUARD_SONNET_SKILLS = ['design', 'definition', 'review', 'test-plan', 'definition-of-ready', 'benefit-metric', 'decisions', 'definition-of-done'];` — `improve` is absent here too.
- `getModelForSkill('improve', ...)` therefore falls through to `envVars.WUCE_HAIKU_MODEL || 'claude-haiku-4-5'` (line 76) with no override in place by default.
- `signals-panel-view.js`'s `_signalItem()` confirms `/improve` is the **default CTA skill** for the large majority of signal types (`cta || { label: 'Review', skill: '/improve' }`) — this is not a rarely-used skill, it is the primary "do something about this signal" entry point surfaced to the operator from the signals panel.

**Why Sonnet, specifically — this codebase's own existing precedent, not a new policy:** `model-routing.js`'s own inline comments document the eval evidence behind each current routing decision:
- `EXP-021: Haiku 0/22 passes on /discovery S-series → Sonnet only for discovery` — real measured failure, `discovery` is additionally `HAIKU_BLOCKED_SKILLS`-protected.
- `EXP-006/007R/004/016/037/038: Haiku FDR=1.00 / TCF=1.00 / GF=1.00 on all gate skills at 4× lower cost` — this is the evidence backing the 8 `DRIFT_GUARD_SONNET_SKILLS` gate skills defaulting to Haiku-tier cost characteristics in the eval, yet they are STILL routed to Sonnet in production via the governance-critical override mechanism, not defaulted to Haiku outright — i.e. even with measured equivalence, this codebase's own practice is to keep governance-critical output on Sonnet.
- `EXP-044: no Haiku/Sonnet gap on /ideate in current eval (eval gap noted in scorecard)` — note precisely what this says: **no gap was found, but the eval itself had a noted coverage gap**, i.e. the evidence is inconclusive, not a clean "Haiku is fine" result. Despite this inconclusive evidence, `/ideate` is in `DEFAULT_SONNET_SKILLS` — the established practice in this exact codebase is to default conservative (Sonnet) when evidence for an open-ended synthesis skill is inconclusive or absent, not to default cheap and wait for a complaint.
- **`/improve` has strictly weaker evidence than `/ideate`'s own inconclusive EXP-044 result: zero dedicated eval exists for `/improve` at all** in `workspace/experiments/EXPERIMENTS-SUMMARY.md`. By the same precedent already applied to `/ideate`, `/improve` should default to Sonnet until (or unless) a dedicated eval establishes otherwise.
- `/improve`'s own task shape (synthesizing patterns across up to thousands of heterogeneous, messy real signals — parse errors, feature-status entries, dod-follow-ups, decisions — into an actionable improvement proposal) is at least as open-ended and judgment-heavy as `/ideate`'s own lens-cycling synthesis work, arguably more so given the volume and heterogeneity of its real input data (confirmed this session: 4,776+ real signals in the production project).

**Scope decision — change the default, do not add `/improve` to `DRIFT_GUARD_SONNET_SKILLS`:** `DRIFT_GUARD_SONNET_SKILLS` membership does not itself force Sonnet — it only enables drift *monitoring* for a skill whose Sonnet routing is intended to be supplied via a separate, manually-provisioned `WUCE_MODEL_OVERRIDE_<SKILL>` Fly secret. Adding `/improve` there without also provisioning that secret would change nothing (still silently defaults to Haiku) while implying monitoring coverage that isn't actually backed by a forced default. `DEFAULT_SONNET_SKILLS` is the correct list: it is a direct, unconditional code default requiring no operator-side Fly secret provisioning, matching exactly how `/ideate`'s own precedent is implemented.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Does not affect `discovery`, `ideate`, or any `DRIFT_GUARD_SONNET_SKILLS` member's own routing.

## Acceptance Criteria

**AC1:** Given no per-skill or blanket model-override environment variables are set, When `getModelForSkill('improve', envVars)` is called, Then it returns a non-Haiku model (matching the existing `discovery`/`ideate` assertion pattern in `tests/check-psrc-s1-model-routing-config.js`'s own AC1).

**AC2:** Given `DEFAULT_SONNET_SKILLS` is read directly, When checked for membership, Then it contains `'improve'` alongside the pre-existing `'discovery'` and `'ideate'` entries — `discovery` and `ideate`'s own presence is unchanged (regression guard).

**AC3:** Given a per-skill override `WUCE_MODEL_OVERRIDE_IMPROVE` is set to some other model, When `getModelForSkill('improve', envVars)` is called, Then the override still takes precedence over the new Sonnet default — unchanged precedence behaviour, matching the existing AC2/AC2b pattern in `tests/check-psrc-s1-model-routing-config.js` for other skills.

**AC4:** Given the existing `tests/check-psrc-s1-model-routing-config.js` suite (AC1-AC5, covering `discovery`/`ideate`/`test-plan`/`definition-of-ready`/`review`/`definition`), When this fix is applied, Then every existing test in that file still passes unmodified — `improve` was not previously asserted by any existing test, so no prior assertion can be broken by adding it to the Sonnet default list.

## Out of Scope

- `improvement-agent` (`src/improvement-agent/`) — a completely separate, standalone scheduled GitHub Actions workflow with its own model configuration, unrelated to this web-UI skill-session routing module despite the similar name. Confirmed via direct code read: it does not call `getModelForSkill()`.
- Adding `/improve` to `DRIFT_GUARD_SONNET_SKILLS` or provisioning a `WUCE_MODEL_OVERRIDE_IMPROVE` Fly secret — explicitly rejected approach, see Architecture Constraints.
- Running a dedicated eval for `/improve` (mirroring EXP-044's own treatment of `/ideate`) to potentially downgrade it back to Haiku with real evidence later — a legitimate future `/improve`-candidate itself, but not required to close today's gap (defaulting conservative absent evidence is the already-established correct behaviour in this codebase).
- Any change to `HAIKU_BLOCKED_SKILLS` — `/improve` does not need the stronger "never allow a Haiku override at all" protection `discovery` has; a per-skill Haiku override remains possible for `/improve` if ever explicitly desired, matching `/ideate`'s own equivalent treatment (also absent from `HAIKU_BLOCKED_SKILLS`).

## NFRs

- **Performance:** None — this changes which model answers `/improve` turns; no new code path, no new I/O.
- **Security:** None identified.
- **Accessibility:** N/A — no UI change.
- **Cost:** This is a real, acknowledged cost increase for every `/improve` session (Sonnet vs Haiku per-token pricing) — accepted deliberately, matching this codebase's own existing precedent of prioritising output quality over cost for open-ended synthesis work with inconclusive/absent eval evidence (same tradeoff already made for `/ideate`).

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
