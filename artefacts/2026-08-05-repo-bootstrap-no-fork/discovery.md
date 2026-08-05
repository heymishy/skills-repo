# Discovery: No-Fork Repo Bootstrap for the Inner (and Optionally Outer) Loop

**Status:** Approved
**Created:** 2026-08-05
**Approved by:** Hamish King — Platform maintainer — 2026-08-05
**Author:** Human (Hamish King), scoped conversationally with Claude Code

---

## Problem Statement

Today, adopting this skills platform requires either forking the platform repository or cloning it directly — there is no packaged, no-source-checkout distribution path (e.g. an `npx`/`npm exec`-style init flow that materializes a deployment without ever checking out the platform's own source). The only alternative is the hosted web-UI SaaS. This forces every new consumer — a solo developer, a squad, an enterprise tribe — into either (a) a full git-native commitment (fork/clone) before they've evaluated the platform, or (b) the fully-hosted SaaS with none of the "run it in your own repo" flexibility. There's no lightweight middle path.

## Who It Affects

Two intersecting personas hit this:

1. **Engineering-capable evaluators** — developers/engineers who want to try the platform in their own repo before committing to a fork or full clone.
2. **SaaS-hosted consumers reaching the outer-loop/inner-loop boundary** — people running the hosted web-UI SaaS who take a feature through discovery → DoR entirely in the SaaS, then hit a wall the moment they need to turn that DoR-approved artefact into a real, executable outcome. The SaaS carries them through the outer loop fine; there is no packaged path to actually execute the inner loop against their own codebase without now forking/cloning the full platform repo — a much heavier lift than the outer-loop work they just did.

## Why Now

The SaaS web UI has just reached beta readiness (per recent delivery work — `agency-client-organisations` and related epics recently shipped to staging/production). Beta launch is the trigger: it's the first point real external users will hit the outer-loop/inner-loop boundary described above. Today, the friction of a full fork or clone to bridge that gap is high enough that it will actively suppress beta adoption — evaluators will complete a DoR-approved artefact in the SaaS and then stall, rather than convert into a working build. Addressing this now, before wider beta traffic arrives, avoids shipping a beta funnel with a known drop-off point already identified.

## MVP Scope

A single command that starts the inner loop, with two entry points:

1. **Fresh repo** — no existing skills-platform presence. Materializes a minimal working repo (core skills, templates, seeded instruction file, `pipeline-state.json`, `context.yml`) without `git clone`/`fork` of the upstream platform.
2. **Existing repo already connected to the SaaS outer loop** — bootstraps the inner-loop tooling into the user's existing repo and wires it to the SaaS-produced, DoR-approved artefact so the inner loop can start against real, already-approved scope.

Rather than the command choosing which skills to install via a flag (inner-loop-only vs. inner+outer), it **copies the full skill set uniformly every time**, plus a **lightweight skills registry** (a manifest file, alongside the existing `context.yml`/`pipeline-state.json` conventions) that declares which skills belong to the **outer loop**, which belong to the **inner loop**, and which are **ancillary/support** (e.g. `/tdd`, `/systematic-debugging`, `/checkpoint`). This pushes "what's relevant right now" into a declarative, readable registry rather than conditional file-copying logic in the bootstrap command itself.

**Harness-agnostic from the start** — the platform's own mission already states it governs the execution layer (Copilot, Claude Code, Cursor) rather than replacing it, so the bootstrapped instruction files cannot be Claude-Code-specific. One real instruction-file source of truth, with tool-specific filenames (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`) as symlinks/copies pointing at it, so VS Code+Copilot, Cursor, and Claude Code all read identical guidance.

Success for the first user, on any harness: one command, a full skill set plus a registry telling them (and their tools) what's outer/inner/ancillary, and they can run the inner loop against a real repo, with the option to keep running the full pipeline locally going forward.

## Out of Scope

- **Ongoing update-sync for an already-bootstrapped repo** — pulling later platform improvements into a repo after its initial bootstrap is a separate, later concern; this initiative only covers getting a repo started, not keeping it current.
- **The original "upstream-sync skill pair" idea (formalizing `skills_upstream` as two named skills, mirroring qm's `update-qm`/`upstream-pr`)** — this is really the same concern as the item above, deferred to a future initiative once bootstrap exists.
- **The "helper homes" table** (documenting canonical helper-code locations to prevent duplicate implementations in this repo's own `src/`) — unrelated to the bootstrap-command problem; split into its own discovery thread.
- **The non-technical/non-git-native channel** — already a separate named initiative (Phase 5 WS0 in `product/mission.md`); this bootstrap command is for git-native/engineering-capable consumers only.
- **Hosting or operating a central distribution/registry service** — this is about one consumer bootstrapping their own repo with one command, not building infrastructure to serve many organizations centrally.

## Assumptions and Risks

**Assumptions:**
- [ASSUMPTION] The distribution mechanism is an npm package (e.g. `npx @heymishy/skills-repo@latest init`) — unconfirmed, requires /clarify before scope is locked. No npm publishing pipeline currently exists for this repo.
- [ASSUMPTION] The SaaS web UI has (or can build) an API/export path that lets a bootstrap command fetch a specific repo's DoR-approved artefact and pipeline-state — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] The symlink/copy pattern for harness-agnostic instruction files (CLAUDE.md/AGENTS.md/.cursorrules/copilot-instructions.md all resolving to one source) works without per-harness adaptation — unconfirmed, requires /clarify before scope is locked.

**Risks — what could make this not worth building:**
- If beta users overwhelmingly stay inside the SaaS and never attempt to reach the inner loop, the fork/clone friction this initiative removes may not be the actual adoption blocker — worth checking against real beta usage signal once available, not just the friction hypothesis.
- If the SaaS has no practical way to export a DoR-approved artefact + pipeline-state to an external repo (the second assumption above), the "existing SaaS repo" entry point collapses to just the fresh-repo path, cutting the initiative's value roughly in half.
- If most real consumers are already comfortable cloning (i.e., the target persona is more engineering-capable than assumed), the friction being solved may be smaller in practice than the "why now" framing suggests.

## Directional Success Indicators

1. **Bootstrap-to-first-inner-loop-run time.** Baseline: `[UNKNOWN BASELINE]` — no bootstrap path exists today, so there's no comparable timing; the closest proxy is "however long a manual clone + setup currently takes," which isn't measured either. Target: a new user reaches a successfully-started inner loop (`/branch-setup` complete) within minutes of running the init command, not hours. Measured via: timestamp delta between init-command invocation and first `branch-setup` completion, logged to `workspace/state.json` or a bootstrap-specific log.
2. **SaaS-to-inner-loop conversion rate.** Baseline: 0% — today, no SaaS-only user can reach the inner loop without forking/cloning first. Target: a measurable non-zero share of DoR-approved SaaS artefacts get bootstrapped into a real repo within 7 days of DoR sign-off. Measured via: cross-referencing SaaS-side DoR-approval events against bootstrap-command invocations tagged with the same feature slug.
3. **Fork/clone avoidance rate among new adopters.** Baseline: 100% — every current adopter today forks or clones to get started. Target: majority of new adopters use the init command instead of fork/clone. Measured via: comparing GitHub fork/clone-then-first-commit patterns against init-command telemetry — flagged as a real measurement gap: init-command usage isn't trackable without either a phone-home ping (privacy/telemetry decision, out of scope for discovery) or self-reported signal.

## Constraints

- **Must not violate the platform's own "update channel never severed" rule** (`product/constraints.md` #1). Even though ongoing update-sync is out of scope for this initiative, a freshly-bootstrapped repo must not be architecturally cut off from ever receiving future platform updates.
- **No persistent agent runtime dependency** (`product/constraints.md` #11). The init command itself must run on standard tooling (npm/npx) without requiring a hosted service — the only backend dependency should be the SaaS's existing API, and only for the "existing SaaS repo" entry point.
- **Credential handling must follow the existing structural rule** (`product/constraints.md` #12) — if the "existing SaaS repo" path needs to authenticate to fetch a DoR-approved artefact, that credential must live in a secrets store, never in the agent's or the CLI's plain environment.
- **No npm publishing pipeline exists today** — this is a real build dependency; it needs setting up (package name, registry access, versioning/release process) before the init command can ship.
- **Verification surface spans three target harnesses** (Claude Code, VS Code+Copilot, Cursor) — team bandwidth is already stretched against the existing DoD backlog, so testing depth across all three should be scoped deliberately, not assumed free.

## Contributors

- Hamish King — Platform maintainer / Product owner

## Reviewers

- (none — approved without separate review pass)

## Approved By

Hamish King — Platform maintainer — 2026-08-05

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- The distribution mechanism is an npm package (e.g. `npx @heymishy/skills-repo@latest init`) — unconfirmed, requires /clarify before scope is locked. No npm publishing pipeline currently exists for this repo.
- The SaaS web UI has (or can build) an API/export path that lets a bootstrap command fetch a specific repo's DoR-approved artefact and pipeline-state — unconfirmed, requires /clarify before scope is locked.
- The symlink/copy pattern for harness-agnostic instruction files (CLAUDE.md/AGENTS.md/.cursorrules/copilot-instructions.md all resolving to one source) works without per-harness adaptation — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

**Next step:** Human review and approval → /benefit-metric
