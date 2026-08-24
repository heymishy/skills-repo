# Discovery: Skill Tool Invocability Pilot

**Status:** Clarified — Not Pursuing
**Created:** 2026-08-24
**Approved by:** N/A — decision made not to proceed to /benefit-metric (see Clarification log)
**Author:** Claude (agent)

---

## Problem Statement

`CLAUDE.md` and every `SKILL.md` file in this repo instruct the operator/agent to "run `/workflow`", "run `/test-plan`", "run `/discovery`", and so on — phrased as if these are directly invocable Claude Code slash commands. In a real Claude Code session, they are not registered: there is no `.claude/skills/` directory and no plugin manifest (`.claude-plugin/plugin.json`) anywhere in the repo declaring these skills to the Skill tool. Confirmed directly this session — attempting to call the Skill tool with `skill="workflow"` or `skill="test-plan"` fails with "Unknown skill". Every one of the 40+ skill invocations this session actually used was executed by manually reading the target `SKILL.md` file and following its steps via ordinary Read/Bash/Edit/Agent tool calls — never via the Skill tool itself. This creates a documented mismatch between what the instructions say and what actually happens.

## Who It Affects

- **Operators** (e.g. the person running this pipeline day to day) reading `CLAUDE.md`'s instructions and expecting `/workflow`, `/test-plan`, etc. to work as real slash commands in their Claude Code session.
- **Fresh Claude Code agent sessions** on this repo, which have to discover — via trial, error, or close reading of `CLAUDE.md` — that skills are meant to be read from `skills/*/SKILL.md` and followed manually, not invoked via the Skill tool. Both groups hit this friction at the very start of every session, before any real pipeline work begins.

## Why Now

Not a hypothetical — this session hit the gap directly while executing `rcfc-s1`, attempting to call the Skill tool with `skill="workflow"`/`"test-plan"` and getting "Unknown skill". The platform's own `product/mission.md` states that skill files are "versioned, hash-verified instruction sets ... that AI agents execute against," which is ambiguous as to whether "execute against" means genuine Claude-Code-native invocation or documentation-style manual reading. That ambiguity is now a confirmed, repeatable friction point — logged in `workspace/capture-log.md`, 2026-08-24 — not a one-off guess, and worth resolving deliberately rather than leaving as a standing quirk every new session re-discovers independently.

## MVP Scope

A bounded pilot, not a full rollout:

- Pick a small, representative slice of 3–5 skills (candidates: `/workflow`, `/test-plan`, `/checkpoint` — final selection to be confirmed at `/benefit-metric` or `/definition` once the registration mechanism itself is validated).
- Build real Claude Code registration for just those skills — via a `.claude/skills/` wrapper structure, a plugin manifest, or whichever mechanism direct technical verification (see Assumptions) shows is lower-friction and compatible with this repo's existing `SKILL.md` authoring pattern.
- Validate the mechanism actually works (skills become genuinely invocable via the Skill tool) and is worth the per-skill packaging cost, before any decision is made about the full ~40+ skill library.

## Out of Scope

- **Registering all ~40+ skills** — this initiative is a pilot on 3–5 skills only. Rolling out native registration to the full library is a separate, later decision gated on this pilot's outcome.
- **Changing SKILL.md content/authoring format** — the pilot wraps or points at existing `SKILL.md` files as-is. It does not redesign how skills are authored, versioned, or hash-verified — that remains the existing pipeline mechanism, untouched.
- **Changing the outer/inner loop model itself** — this is purely about the invocation mechanism (how a skill gets triggered), not about redesigning which skills exist, their sequencing, or the discovery-through-DoD pipeline itself. That is `/loop-design`'s territory (a separate, already-logged item: the inner-loop ceremony redundancy review).
- **Cross-session skill-state persistence** — whether registered skills can carry state between invocations, or interact more deeply with Claude Code's own session/task features, is out of scope. This pilot is about basic invocability, not deeper integration.

## Assumptions and Risks

[ASSUMPTION] Claude Code's Skill tool can register skills from this repo's own directory structure (e.g. via a `.claude/skills/` wrapper or a plugin manifest) without requiring external publishing or marketplace steps — unconfirmed, requires /clarify (direct technical verification, e.g. via the `claude-code-guide` agent or Claude Code's own documentation) before the pilot's implementation scope is locked.

[ASSUMPTION] Existing `SKILL.md` files — with their conversational, multi-step, gate-heavy instructions (see `/discovery`'s own one-question-at-a-time design, used to produce this very artefact) — can be wrapped or pointed at as-is in Claude Code's native skill format without restructuring — unconfirmed. If native skills expect a materially different shape (e.g. shorter, single-purpose, non-conversational), the "wrap as-is" MVP promise breaks down and the effort could balloon well past a bounded pilot.

**Risk — native invocation may change skill behaviour:** if the Skill tool's own execution model differs from how this session currently reads-and-follows `SKILL.md` manually (e.g. context handling, ability to pause mid-skill for operator replies across multiple turns), registering a skill natively could change its behaviour in ways not yet tested — particularly risky for conversational skills like `/discovery` that rely on strict one-question-at-a-time gating (the same gating this discovery artefact was itself produced under).

**Risk — the friction may be largely cosmetic:** this session has run 40+ skills successfully all session by just reading `SKILL.md` manually. The actual functional cost of the gap may be low — operators typing `/workflow` and finding it "doesn't work" as a literal command, rather than a hard blocker to getting work done — in which case a lighter documentation-only fix might fully resolve the real problem without any registration engineering.

---

## /clarify recommendation

This discovery contains 2 unconfirmed assumptions that affect scope and implementation approach. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Claude Code's Skill tool can register skills from this repo's own directory structure (e.g. via a `.claude/skills/` wrapper or a plugin manifest) without requiring external publishing or marketplace steps — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Existing `SKILL.md` files can be wrapped or pointed at as-is in Claude Code's native skill format without restructuring — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification. In practice, resolving the first assumption (the registration mechanism itself) is likely a direct technical-verification step — e.g. consulting Claude Code's own documentation or the `claude-code-guide` agent — rather than a further round of operator questions, since it is a factual question about the platform, not a scope judgment call.

## Directional Success Indicators

- **Skill Tool invocation succeeds.** Baseline: 0 of this repo's skills are invocable via the Skill tool (confirmed this session — calling `skill="workflow"` fails with "Unknown skill"). Target: all skills chosen for the pilot (3–5) are successfully invocable via the Skill tool in a real Claude Code session. Measured via: direct Skill tool invocation test in a live session, plus a note in `workspace/capture-log.md` recording pass/fail per piloted skill.
- **No behavioural regression vs. manual reading.** Baseline: piloted skills currently work correctly when read and followed manually (established, in daily use all session). Target: natively-invoked piloted skills produce the same conversational flow, gating, and output as the manual-read path — no loss of one-question-at-a-time gating, approval gates, or state-file writes. Measured via: running each piloted skill both ways (manual-read vs. Skill-tool-invoked) on the same input and diffing behaviour.
- **Per-skill packaging cost is bounded.** Baseline: `[UNKNOWN BASELINE]` — no data yet on how much extra authoring/maintenance work native registration adds per skill. Target: packaging each piloted skill for native invocation takes under a modest time threshold (e.g. under 30 minutes/skill) with no duplication of `SKILL.md` content (single source of truth preserved). Measured via: time-tracking during pilot implementation.

## Constraints

- **Single source of truth for `SKILL.md`.** Whatever mechanism is used, `SKILL.md` must remain the authoritative content — no forked or duplicated copies that can drift. If native registration requires a second file, it should reference or point at the existing `SKILL.md`, not duplicate its content.
- **No change to hash-verification.** This platform's `SKILL.md` files are versioned, hash-verified instruction sets (per `product/mission.md`). The pilot must not break that mechanism — whatever wrapper or manifest gets added must not require re-hashing or bypassing existing verification.
- No further constraints identified — time, budget, and team-capability are not meaningfully bounded for this solo-operator repo.

## Contributors

- Hamish King — Operator

## Reviewers

- [Name — Role]

## Approved By

[Name — Role — Date]

---

## Clarification log

[2026-08-24] Clarified via /clarify (routed to direct technical investigation via the `claude-code-guide` agent, since both flagged assumptions were investigable facts rather than operator scope judgments):

- Q: Does Claude Code support registering skills from a repo-local directory without any external publishing/marketplace step? A: Yes — Claude Code auto-loads project skills from `.claude/skills/<name>/SKILL.md` in the working directory and its parents up to the repo root. No plugin install step needed. [ASSUMPTION 1 resolved: CONFIRMED.]
- Q: Can existing `skills/<name>/SKILL.md` content be wrapped/pointed-at as-is, avoiding duplication? A: No native reference/include mechanism exists — content must live directly at `.claude/skills/<name>/SKILL.md`. Zero-duplication would require a filesystem-level solution (e.g. a symlink), not a Claude Code feature. [ASSUMPTION 2 resolved: PARTIALLY — mechanism exists but requires an OS-level workaround, a new constraint not originally known.]
- Q: Is native skill registration lazy-loaded (same zero-baseline-cost behaviour as this repo's current manual Read-on-demand convention), or does it add an always-on token cost? A: NOT lazy — Claude Code injects all registered skills' `name`+`description` frontmatter into context at session startup by default, regardless of whether they're ever invoked. The current manual-Read convention has zero baseline cost by contrast. [New finding, not part of the original 2 flagged assumptions — surfaced by the operator's own question during /clarify.]
- Q: Given CLAUDE.md already documents an explicit, working skill-routing table, what functional value does native registration add? A: Primarily operator-typed `/skill-name` slash-command convenience and IDE/menu discoverability. The other headline benefit (Claude auto-suggesting/triggering skills without being told) is largely redundant here, since CLAUDE.md's routing table already tells the agent exactly which skill to read and when.

**Outcome:** The token-cost finding, combined with the redundancy of native auto-suggestion against this repo's already-working CLAUDE.md routing table, undermines the pilot's original premise — there is no clear functional gain to justify a permanent, always-on context cost. **Decision: do not pursue native Claude Code skill registration.** Superseded by a smaller, bounded fix: correcting `CLAUDE.md`'s wording so it no longer implies `/workflow`, `/test-plan`, etc. are literal invocable slash commands, and states the real mechanism (agent reads `skills/<name>/SKILL.md` directly) plainly. Tracked as a separate short-track story, not requiring its own discovery per this repo's short-track convention (bounded fix, not a scope decision).

---

**Next step:** None — not pursuing native registration. See Clarification log for the superseding short-track fix.
