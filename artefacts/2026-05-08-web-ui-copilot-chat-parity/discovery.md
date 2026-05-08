# Discovery: Web UI Copilot Chat Parity

**Status:** Approved
**Created:** 2026-05-08
**Approved by:** Hamish King — Platform Owner — 2026-05-09
**Author:** Hamish King (platform owner) + GitHub Copilot

---

## Problem Statement

The skills platform web UI (delivered by ougl/owle/wsm features, now structurally complete) cannot execute the full pipeline skill set. Three runtime gaps prevent it from being used as a primary delivery surface:

1. **No tool execution loop** — skills like `/workflow`, `/trace`, `/improve`, and `/record-signal` require the model to read files, run governance scripts, and inspect artefacts mid-session. The current architecture has no mechanism for the model to emit a file-read request and receive the result. Every skill that reads pipeline state, artefact files, or test output produces shallow or fabricated output in the web UI.

2. **No slash command router** — the web UI exposes skills only through a hard-coded journey stage sequence (`discovery → benefit-metric → definition → review → test-plan → definition-of-ready`). An operator who wants to run `/estimate`, `/decisions`, `/improve`, `/coverage-map`, `/record-signal`, or any of the 30+ skills outside the linear sequence cannot do so. VS Code Copilot Chat allows free invocation of any skill at any point.

3. **No pipeline context at session start** — `buildSystemPrompt()` pre-loads the active skill's `SKILL.md` and `product/` context files but not the operator's current working state. Missing at session start: `pipeline-state.json` (current feature, phase, health), `workspace/state.json` (checkpoint and resume instruction), `context.yml` (toolchain settings: instrumentation flags, skills-upstream remote, E2E gate, MCP configuration), `fleet-state.json` (squad/tribe aggregation for fleet operators), `artefact-coverage-exemptions.json` (coverage gate config), and the listing of artefact files under the active feature slug. VS Code Copilot Chat has direct file system access to all of these — the model can read any of them on demand. In the web UI, none of them are present at session start and cannot be requested mid-session without the tool loop. The model begins every session unaware of where the operator is in the pipeline — it cannot give the same "here is where we are and what's next" orientation that VS Code provides.

The combined effect: the web UI is structurally complete but operationally shallow. Operators using it as their primary surface receive a degraded pipeline experience compared to VS Code, which defeats the purpose of the ougl/owle/wsm investment.

## Who It Affects

**Primary: Developer / engineer running the outer loop on a machine without VS Code or with limited IDE access.** When they open the web UI to run `/discovery` or `/benefit-metric`, the skill works. When they try `/workflow` to check pipeline health or `/trace` to validate a chain, the skill produces output that looks plausible but has not read any files — the operator has no way to tell the difference without opening artefacts manually.

**Primary: Tech lead using the web UI as the governance-facing view.** Wants to run `/coverage-map`, `/review`, and `/decisions` from the web UI for visibility across the delivery cycle. Currently must switch to VS Code to run any skill that reads artefacts or state — breaking the primary interface promise.

**Primary: Platform maintainer dogfooding the web UI.** The platform itself is delivered via the pipeline. Using the web UI to deliver the next improvement cycle is the primary adoption signal. The three gaps make this impractical for any skill beyond simple artefact-writing ones.

**Secondary: Non-technical channel participant (Phase 5 WS0).** The non-technical channel depends on the web UI as its primary interface. That channel requires the model to read and validate artefacts (DoR gate-confirm, AC verification) — neither of which works without the tool execution loop.

## Why Now

The ougl, owle, and wsm feature sets have been merged. The web UI has: a structured journey, multi-user session management, side-trips, collaborative handoff, non-happy-path recovery, and a streaming turn engine. The structural foundation is complete.

The remaining gap is not architectural — it is a missing runtime capability layer. Adding it now, before Phase 5 begins, means the Phase 5 WS0 non-technical channel work can depend on a fully capable web UI rather than needing to work around the same gaps.

Additionally: the improvement agent cycle (Phase 5 WS5) reads and writes artefacts autonomously. If that cycle is to run via the web UI at all, the tool execution loop is a prerequisite.

## MVP Scope

The smallest set of capabilities that closes the three runtime gaps:

1. **Tool execution loop (read-only subset):** The model can emit `<TOOL:read_file path="artefacts/..."/>` and `<TOOL:list_dir path="artefacts/..."/>` markers in its response. The server detects these markers, executes the file read (path-traversal guarded, scoped to repo root), injects a `tool_result` turn into the conversation, and resumes the model. Covers all skills that read artefacts or pipeline state — `/workflow`, `/trace`, `/improve`, `/record-signal`, `/coverage-map`, `/estimate`. Does not include write operations (artefact writes remain the model's prose output, copied by the operator).

2. **Slash command router:** A top-level entry mode (distinct from the journey stage sequence) where the operator types any skill name — e.g. `/workflow`, `/estimate`, `/decisions`, `/record-signal` — and the server dynamically loads the corresponding `SKILL.md` into `buildSystemPrompt()`. The skill list is derived from `fs.readdirSync('.github/skills')` — always in sync with the skill library, no per-skill routing code required. Journey stage mode and slash command mode coexist — the operator can switch between them.

3. **Pipeline context auto-loader:** `buildSystemPrompt()` extended to pre-load at session start the full set of state files the VS Code surface has access to:
   - `pipeline-state.json` — current feature, phase, health, story statuses
   - `workspace/state.json` — checkpoint block and resume instruction
   - `context.yml` — toolchain settings: `instrumentation.enabled`, `skills_upstream`, `audit.e2e_tests`, MCP config (credential refs, not values — `secretRef` pattern is already safe to surface)
   - Artefact file listing under the active feature slug (filenames only, not contents — model requests specific files via the tool loop)
   - Conditionally: `fleet-state.json` if present (for platform maintainers running cross-squad operations); `artefact-coverage-exemptions.json` if present (for operators checking coverage gate status)
   - `workspace/learnings.md` summary (first 50 lines — captures recent delivery signals without full context cost)

   This is a pure addition to `buildSystemPrompt()` — approximately 40–50 lines, no new routes or adapters. Files that do not exist are silently skipped (not an error — operator may not have all workspace primitives present).

These three capabilities may be delivered in one feature or split into three consecutive stories if the scope warrants it. That decision is deferred to `/definition`.

## Out of Scope

- **VS Code extension UX / keybindings** — the web UI is a browser surface; it does not replicate VS Code panel layout, keyboard shortcuts, or extension-specific visual affordances. Parity means functional capability, not visual identity.
- **Custom model routing layer** — the web UI delegates model selection to whatever model is wired via `setModelAdapter()`. This feature does not add model-routing logic, cost-tier selection, or provider-switching UI. That is a separate pipeline concern.
- **Mobile or native application** — the web UI is a browser-hosted Node.js/Express app. This feature delivers no mobile-native wrapper, offline capability, or platform-native packaging.
- **Write-tool execution (artefact writes by the server)** — the tool execution loop in this scope is read-only. The model describes what to write in its prose response; the operator copies it to disk (or a future feature automates that step). Write execution introduces file mutation risk and is deferred.
- **Multi-model concurrent sessions** — running two different models simultaneously in one skill session is out of scope. Single-session, single-model execution is the baseline.

## Assumptions and Risks

**Assumptions:**
- The `<TOOL:.../>` marker format is distinguishable from normal prose. The proposed concrete format is: `<TOOL:read_file path="relative/path"/>` and `<TOOL:list_dir path="relative/path"/>` — angle-bracket XML-like syntax with a namespaced verb and a single `path` attribute. This format must be injected into the **WEB UI PROTOCOL** section of `buildSystemPrompt()` as an explicit instruction to the model ("when you need to read a file, emit exactly `<TOOL:read_file path="..."/>`"). This is a **system prompt engineering task** as much as an implementation task. Prompt reliability (does the model emit the marker consistently, or does it paraphrase?) must be validated early in implementation — before the tool loop server logic is built — using a lightweight prompt test against the target model. If the model does not emit the marker reliably with instruction alone, alternative approaches (structured output, function calling if the model API supports it) must be evaluated at `/definition`.
- Path-traversal guarding (resolve + `startsWith(repoRoot)`) is sufficient to prevent arbitrary file reads. Validated by: existing pattern in ougl.5/ougl.6 (ADR-023) — same guard, already tested.
- The skills in scope that require file reads (`/workflow`, `/improve`, `/coverage-map`, `/record-signal`) are satisfied by `read_file` and `list_dir` alone. `/trace` is a higher-risk case: trace validation runs `scripts/validate-trace.sh` and reads git log output (for hash verification). File reads alone may satisfy the "references real artefact content" success indicator, but full trace parity (hash chain verification, git provenance) requires script execution. This distinction must be resolved at `/definition` before test plans are written — the success indicator may need splitting into (a) artefact-read parity (MVP) and (b) script-execution parity (post-MVP or separate story). **This is an open scope question, not a footnote.**
- `buildSystemPrompt()` token budget can absorb the pipeline context addition without hitting model context limits. Risk: for operators with large feature sets or deep `workspace/learnings.md`, the pre-loaded context may approach token limits. Mitigated by: (a) artefact listing is filenames only — not file contents; (b) `workspace/learnings.md` is capped at first 50 lines; (c) `fleet-state.json` and `artefact-coverage-exemptions.json` are conditional — only loaded if present and only if session type warrants it. A token budget check is an explicit implementation task.
- `context.yml` contains `secretRef` names (not credential values) — loading it into the system prompt is safe under the existing MCP credential pattern (ADR-009). No credential values are ever in `context.yml`; only reference names. This assumption must be validated at implementation by inspecting the full `context.yml` schema.

**Risks:**
- If the `<TOOL:.../>` emission format is inconsistently applied by the model, the tool loop silently fails — the session continues but the file is never read. Risk level: medium. Mitigation: server-side detection and fallback notification in the turn output.
- The slash command router opens all 44 skills to freeform invocation. Two distinct risk layers:
  - **Chain-prerequisite risk** (low): skills that expect a prior artefact chain (e.g. `/definition` expects an approved discovery) will produce incomplete output if the chain is absent. This is operator responsibility; the skill's own entry condition language handles it.
  - **Surface-capability risk** (medium — higher in enterprise deployment): some skills in the library assume an environment with full file system access, git operations, or VS Code-specific tooling (e.g. `/trace` running `validate-trace.sh`, `/improve` running the eval suite, `/branch-setup` running `git worktree`). Opening these via the router without communicating surface limitations may produce confusing or misleading output for operators who do not know which skills are fully capable in the web UI. **Mitigation required at `/definition`:** evaluate whether a capability annotation on skills (e.g. a `requires: [git, shell]` field in a skill manifest or the SKILL.md header) is in scope for this feature, or whether a simpler approach (a static "works fully in web UI" indicator in the router UI) is sufficient. Do not defer this to post-launch.

## Directional Success Indicators

- A platform operator runs `/workflow` from the web UI and receives an accurate pipeline health report — including which artefacts exist, what's missing, and what to run next — without switching to VS Code.
- A platform operator runs `/trace` from the web UI on a completed feature and receives a trace report that references real artefact content (file reads confirmed). Note: full hash-chain verification parity (script execution) is a separate indicator — see Assumptions for scope split.
- The web UI can be used as the sole interface for a complete outer loop run (discovery → benefit-metric → definition → review → test-plan → DoR) on a new feature, with no VS Code required.
- Dogfood signal: at least one delivery cycle of the platform itself (a Phase 5 story) is completed end-to-end using the web UI.

## Constraints

- **Zero new external npm dependencies** — the tool execution loop and slash command router must be implemented using Node.js built-ins only (`fs`, `path`, `child_process` if needed for script execution). The governance test suite asserts this constraint.
- **No modification to `.github/skills/` or `artefacts/`** — this feature adds server-side capability; it does not change any skill's `SKILL.md` or any existing artefact.
- **Path-traversal guard is mandatory** (NFR-sec-pathtraversal, ADR-023) — any route handler writing or reading files at a path derived from request data must validate with `path.resolve` + `startsWith(repoRoot)`.
- **All new routes must use `req.session.accessToken`** (not `req.session.token`) per existing coding standard.
- **Injectable adapter rule (D37)** — any new adapter must have a stub that throws (not silently returns empty), an explicit AC for production wiring, and the wiring as a named separate task in the implementation plan.
- **No modification to artefact-coverage-exemptions.json** without explicit operator approval — new source files must pass the artefact coverage gate.
- **Browser compatibility baseline**: modern Chromium (Chrome 120+, Edge 120+). No IE11 or legacy Safari support required.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Platform Owner — 2026-05-09

---

**Next step:** Human review and approval → /benefit-metric
