# Discovery: CLI Deterministic Governance — Executable Gate Enforcement and Tamper-Evident Audit Trail

**Status:** Approved
**Created:** 2026-05-19
**Approved by:** Hamis — 2026-05-19
**Author:** Copilot (GitHub Copilot — Claude Sonnet 4.6)

---

## Problem Statement

The skills platform currently encodes 243 deterministic governance checks inside SKILL.md prose — instructions like "check that field X is present", "verify gate Y has passed", and "write Z to pipeline-state.json". These checks look like enforcement, but they are not: they run inside a language model's context window, with no external verifier, no typed exit codes, and no tamper-evident record of whether they executed. The model can bypass them (skip a check without error), hallucinate completion (claim a gate passed when it did not), or produce invalid state writes (wrong enum values, missing required fields, schema violations). Two concrete evidence points confirm this is a live risk, not a theoretical one: (1) EXP-003 Config C — Haiku on regulated stories produced a composite pipeline fidelity score of 0.675 against a 0.90 threshold, with root cause traced to deterministic regulated constraint propagation (definition Step 4a) running in model context; and (2) the CI audit comment post-mortem (four bugs found post-merge) — a structurally identical failure where inline JavaScript in a GitHub Actions workflow performed the same invisible pattern: logic that looked like enforcement, was never executed by any test, and contained four bugs that only appeared in production.

Platform operators in regulated delivery environments cannot satisfy auditors with a pipeline whose gate enforcement is "the model was instructed to check it". They need: a gate check that exits non-zero with a specific code when a violation exists; a state write that is atomic, schema-valid by construction; and a trace entry that is append-only and chain-hashed so that post-hoc tampering is detectable.

---

## Who It Affects

**Platform operators (primary)** — engineers and tech leads running the pipeline against regulated software delivery stories. They experience the problem when a gate-bypass or schema-violation silently corrupts pipeline-state.json and the next skill runs with bad state, producing downstream artefact quality failures that are expensive to diagnose.

**Platform maintainers (primary)** — those who own the SKILL.md files and improvement loop. They experience it when they cannot write a meaningful test for a gate rule because the rule lives in prose, not code — as confirmed by the CI audit comment post-mortem where four prose-encoded logic bugs had zero test coverage before merge.

**Risk and compliance stakeholders (secondary)** — auditors reviewing delivery traces for regulated work. They experience the problem at evidence collection time: today's trace has no way to distinguish "gate was checked by deterministic code" from "gate was mentioned in a prompt and the model agreed it passed".

**Solo operators on personal projects (secondary)** — any operator who wants a durable, inspectable audit trail of pipeline advancement decisions, even without enterprise compliance requirements.

---

## Why Now

Three triggers have converged:

**1. EXP-003 Config C failure (evidence):** The regulated story composite pipeline fidelity score of 0.675 (threshold 0.90) provides the first quantified proof that deterministic checks running in model context are causing measurable delivery failures — not just theoretical risk. The root cause is identified: definition Step 4a.1–4a.4 (regulated constraint propagation) is a list of deterministic field checks, and Haiku skips or partially executes them under context pressure.

**2. CI audit comment post-mortem (structural analogy):** The four post-merge bugs in the assurance gate inline JavaScript are the exact same architectural anti-pattern applied to a different surface. "Logic that looks like enforcement but runs in an untested context and is never verified by code" — whether that context is a GitHub Actions YAML inline script or a SKILL.md prompt section, the failure mode is identical. The platform has now seen the pattern fail twice in two different surfaces.

**3. Pre-architecture work completed (execution readiness):** The ideation session for this initiative completed a full 298-item skills audit across 8 skills, a 7-subcommand CLI design with typed exit codes, a skill surgery specification (~670 lines removal across 8 SKILL.md files), and a testing strategy (~60 unit fixtures + 7 integration + 1 E2E). Unusually, the initiative arrives at /discovery with its architecture largely pre-validated. The remaining blockers (web UI backend subprocess cost assessment, correction loop convergence experiment) are execution risks, not discovery uncertainties. This makes discovery the right next step — not another spike.

**4. Convergent peer implementation — external design validation:** A peer operator (Craig, @craigfo on GitHub) shared four private repositories for review: `mdpm` (a Go binary CLI tool), `outer-loop` (the skills-repo outer loop ported as an mdpm package), `lite-sdlc` (a 4-stage lightweight SDLC methodology as a package), and `homer-demo` (a worked end-to-end example with a real append-only trace log). These were shared for comment and input, and independently arrived at the same core architectural conclusion this initiative proposes: state management and gate enforcement must be owned by a deterministic CLI layer, not embedded in model-readable SKILL.md prose. Three specific design convergences are notable. First, Craig's `mdpm validate` exits with typed exit codes per failure category (heading drift, frontmatter drift, missing required section, length out of bounds, forbidden pattern) — the same pattern our exit codes 1–8 propose, derived from different analysis. Second, the `outer-loop` package's README explicitly states: "mdpm owns orchestration, gates, state, drift detection, and trace. The skills are interview scripts only" — this is the Phase 2 goal of this initiative stated verbatim. Third, the `homer-demo` trace log shows a real feature delivery where the done artefact surfaced exit code 4 (length out of bounds) after structural issues were resolved — empirical confirmation that granular exit codes surface different issue categories progressively (4→3→2→0 validate rounds before clean pass), not just binary pass/fail. A peer independently reaching the same architectural conclusions from a different starting point (Go binary for cross-platform distribution vs Node.js for our existing test suite) is the strongest form of external validation available at discovery stage. Craig has confirmed access for the platform maintainer to view and clone all four repos.

---

## MVP Scope

**Phase 1 — Validate only (no state writes, no model integration):**

A single `skills validate <artefact-path> <gate-name>` CLI command that:
- Reads an artefact file from the local repository
- Applies deterministic structural checks for the specified gate (H1–H9 for `definition-of-ready`, or gate-specific rules for `discovery`, `definition`, `test-plan`, `review`)
- Exits non-zero (exit codes 1–8, one per failure category) with a human-readable error message naming the specific failing check
- Exits 0 when all checks pass, printing a one-line success summary
- Has no external dependencies (pure Node.js, no network, no model invocation)
- Is covered by a test fixture for every exit code, tested in the npm test suite

This MVP demonstrates the core proposition: gate enforcement is executable and testable, independent of model judgment. It does not write state, does not modify artefacts, and does not integrate with the web UI. It is a standalone CLI utility that the operator (or the model, receiving its exit code) can act on.

**In scope for Phase 1:**
- `src/enforcement/cli-outer-loop.js` — core validate logic
- `bin/skills` — CLI entry point
- Exit codes 0–8 (validate path only; advance/state codes Phase 2+)
- npm test fixtures for all exit codes
- H-priority deterministic items from definition-of-ready gate (H1–H9) — 33 items, the highest-value gate
- Governance check `tests/check-cli-governance.js` confirming bin/skills exists and is executable

---

## Out of Scope

- **State writes (`skills advance`) — Phase 2.** Advancing pipeline-state.json via the CLI requires the web UI backend subprocess integration assessment (H7.1 spike). Until that spike completes and PROCEED is confirmed, no state write commands are implemented. Writing validate-only code now does not block Phase 2.

- **Skill surgery (SKILL.md modification) — Phase 3.** Removing the 670 lines of prose that duplicate what the CLI will enforce requires a correction-loop convergence experiment per skill (H7.2) to confirm that surgically modified skills still produce high-quality artefacts with the CLI's error output as feedback. Surgery cannot merge before that experiment completes.

- **Chain-hash trace (`skills emit-trace`) — Phase 2.** Tamper-evident append-only trace.jsonl generation is part of the state-write phase. It has no standalone value without the advance command producing the records being chained.

- **Non-English language support.** Error messages and CLI output are English only. Internationalisation is not a platform concern at this stage.

- **Windows batch file CLI wrapper.** The bin/skills file will be a Node.js CLI script. A `.cmd` wrapper for Windows (no WSL) may be needed but is not required for MVP — operators using this platform already have Node.js on PATH and can run `node bin/skills` directly if needed.

- **Integration with third-party CI systems (GitHub Actions, Jenkins, etc.) — Phase 4+.** The CLI will be runnable in CI, but no purpose-built workflow templates or action wrappers are in scope.

- **Automated skill surgery execution.** The SKILL.md line-removal surgery is a human-authorised change requiring platform team review (per product constraint 4). No automated tool will execute surgery — it requires a PR per skill.

---

## Harness Integration Architecture

The CLI's enforcement value depends on *who* calls it and whether the caller can be trusted to honour the exit code. Two integration modes are relevant.

**Mode B — Developer-driven (VS Code terminal):** The developer runs `node bin/skills validate artefacts/.../discovery.md` directly in a terminal. The model receives the output if it is in context and can self-correct, but the developer can also act on it manually. This mode requires zero harness changes and works today. Phase 1 (validate only) operates entirely in Mode B.

**Mode A — Harness-driven (automated enforcement):** Something calls the CLI as part of the agent loop, and the advance command is the only mechanism that can write state. In the current VS Code surface, the model could invoke `node bin/skills validate` via its Bash tool, read the exit code, and self-correct. This is technically possible today — Copilot agent mode can run Bash commands and read their output. However, if the model is calling the CLI via Bash, the model is still the orchestrator deciding when to call validate and whether to act on a non-zero exit. A model that skips the validate call or ignores the result is back to the same trust problem. Mode A with real enforcement requires the harness — not the model — to own the validate→advance call sequence.

Three options for Phase 2 VS Code integration follow from this:

**Option A — Model calls CLI via Bash, harness trusts model discipline.** Zero integration cost, better error messages and testable gate logic, but no compliance-grade enforcement boundary. The model could skip the validate call. This is an improvement but not a trust-gap closure.

**Option B — A thin wrapper script becomes the VS Code harness.** A workflow script calls validate, invokes the model for the fill step, calls validate again, then calls advance. The model only fills artefacts — it does not decide when to advance. This closes the trust gap in VS Code but requires designing the wrapper harness.

**Option C — VS Code surface is Mode B only; Mode A is the web UI.** The CLI's deterministic enforcement is fully realised in the web UI harness (a controlled server process that owns the subprocess call sequence without relying on model discipline). VS Code remains a developer-driven flow where validate is used manually. No trust-gap closure in VS Code, but the regulated compliance use case goes through the web UI where the call sequence can be enforced by construction.

For a regulated enterprise rollout, Option C is the honest answer. The VS Code surface is where individual developers and tech leads work interactively — Mode B (run validate manually, act on output) is the right fit there. The web UI harness is where compliance-grade Mode A enforcement lives because it is a controlled server process. Phase 1 validate works in VS Code as Mode B with zero integration work. The H7.1 spike (web UI backend subprocess assessment) determines whether Phase 2 Mode A in the web UI harness is weeks or months of work.

---

## Assumptions and Risks

**Validated assumptions (from ideation evidence):**

- 82% of skill logic items across the 8 audited skills are deterministic (298 items, 243 deterministic, 55 judgment). This is based on a full item-by-item audit completed in the ideation session. The 243 deterministic items are individually catalogued by skill and priority tier.

- Node.js is the correct implementation language. The existing `src/enforcement/governance-package.js` and `src/enforcement/cli-adapter.js` establish the structural pattern. No build step, no new language boundary, no dependency on the web UI runtime.

- EXP-003 Config C failure root cause is confirmed as deterministic check failure in model context, not a judgment gap. The specific items (definition Step 4a.1–4a.4) are in the audit catalogue as H-priority deterministic items.

**Risks requiring resolution before Phase 2:**

- **[ASSUMPTION] The web UI backend can be adapted to invoke `skills validate` / `skills advance` as Node.js subprocesses (Mode A, Option C) without a structural rewrite of `src/web-ui/server.js` or the session management layer.** This is the H7.1 risk. The VS Code surface does not have this constraint — Phase 1 validate runs as Mode B in VS Code with zero integration cost. The H7.1 spike applies specifically to the web UI harness: if the backend is tightly coupled to direct state writes, Phase 2 Mode A enforcement in the web UI may require architectural changes not scoped here. Resolution: `/spike` scoped to "assess web UI backend subprocess wiring cost for Mode A harness integration", TTL 2 sessions.

- **[ASSUMPTION] The language model reliably converges to a clean-validate artefact in ≤3 correction loop iterations when receiving typed CLI exit codes as error feedback, after SKILL.md surgery has removed the duplicate prose.** This is the H7.2 risk. If convergence requires >3 iterations on any skill, the STUCK rate after surgery will be unacceptably high. Resolution: correction loop simulation experiment per surgically modified skill before Phase 3 merges.

**Accepted risks (RISK-ACCEPT, to be logged in decisions.md):**

- Operator identity for trace events will use `git config user.email` in Phase 1. This is sufficient for single-operator and small-team use. Enterprise HSM-managed identity is deferred to Phase 2 (H7.3). This risk is accepted for Phase 1 because the validate command produces no trace entries — operator identity only becomes material in Phase 2.

---

## Directional Success Indicators

**Gate bypass incident rate:**
Baseline: Unknown (no mechanism to detect bypasses today — this is the gap). Target: 0 undetected gate bypasses per quarter after Phase 1 is deployed and the validate command is in the correction loop. Measured via: audit of `pipeline-state.json` advancement events against `trace.jsonl` (Phase 2) or manual review (Phase 1 interim).

**Regulated story composite pipeline fidelity score (EXP-003 Config C analogue):**
Baseline: 0.675 (EXP-003 Config C — Haiku on regulated stories). Target: ≥0.90. Measured via: re-run EXP-003 equivalent experiment after Phase 1 + Phase 3 (skill surgery) are deployed, using the same eval corpus and scoring rubric.

**Schema violation rate on pipeline-state.json writes:**
Baseline: [UNKNOWN BASELINE] — no current mechanism counts schema violations per session; known from ad-hoc incidents (wrong enum values, missing required fields) that they occur regularly during inner loop runs. Target: 0 schema violations from CLI-written state writes. Measured via: `validate-trace.sh --ci` and `schema_valid` field in trace entries (Phase 2 onwards).

**npm test coverage of gate logic:**
Baseline: 0 gate-logic test fixtures today (all gate checks are in SKILL.md prose; tests only grep YAML/text for string presence). Target: ≥33 unit test fixtures covering all H-priority DoR deterministic items (Phase 1 exit condition). Measured via: npm test suite fixture count in `tests/check-cli-outer-loop.js`.

---

## Constraints

**From product/constraints.md:**

- Constraint 3 (Spec immutability): Story specs, ACs, DoR criteria, and DoD criteria are immutable to all automated processes. The CLI validate command must not modify SKILL.md files, artefact files, or governance criteria automatically. It reads and validates — it does not write to governed artefacts.

- Constraint 4 (Human approval gate): No change to a SKILL.md file may be merged without human review. Phase 3 skill surgery (the ~670-line removal across 8 skills) requires a PR per skill file, reviewed and approved by the platform maintainer before merge.

- Constraint 5 (Hash-verified instruction sets): The CLI validate command must itself be hash-verifiable. The `bin/skills` entry point and `src/enforcement/cli-outer-loop.js` must be covered by the existing `check-lockfile-pins.js` governance check once pinned to the lockfile.

**Technical constraints:**

- No new runtime dependencies. The CLI must run with the existing Node.js version (see `.nvmrc` / `engines` in `package.json`) and zero new `npm install` dependencies beyond what is already in `package.json`. Pure-Node implementation.

- Must not break existing npm test suite. All existing governance checks must continue to pass. The CLI implementation adds new test files; it does not modify existing test files or governance scripts.

- No subprocess calls from the CLI to external tools (git, node, curl) except for `git config user.email` in the trace emission phase (Phase 2). Phase 1 validate is pure file reads and structural checks.

- The `bin/skills` file must be committed with execute permission (`chmod +x` or `package.json bin` field). Tested on Linux (CI) and Windows (PowerShell — via `node bin/skills`).

---

## Contributors

- Hamish (@heymishy) — Platform maintainer / operator
- Copilot (GitHub Copilot — Claude Sonnet 4.6) — Discovery facilitator / artefact author
- Craig (@craigfo) — Peer review; shared mdpm, outer-loop, lite-sdlc, and homer-demo repositories for design input

## Reviewers

- Pending

## Approved By

- Hamis — 2026-05-19
