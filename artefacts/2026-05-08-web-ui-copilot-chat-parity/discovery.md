# Discovery: Web UI Copilot Chat Parity

**Status:** Draft — awaiting approval
**Created:** 2026-05-08
**Approved by:** [Name + date — filled in after human review]
**Author:** Hamish King (platform owner) + GitHub Copilot

---

## Problem Statement

The skills platform web UI (delivered by ougl/owle/wsm features, now structurally complete) cannot execute the full pipeline skill set. Three runtime gaps prevent it from being used as a primary delivery surface:

1. **No tool execution loop** — skills like `/workflow`, `/trace`, `/improve`, and `/record-signal` require the model to read files, run governance scripts, and inspect artefacts mid-session. The current architecture has no mechanism for the model to emit a file-read request and receive the result. Every skill that reads pipeline state, artefact files, or test output produces shallow or fabricated output in the web UI.

2. **No slash command router** — the web UI exposes skills only through a hard-coded journey stage sequence (`discovery → benefit-metric → definition → review → test-plan → definition-of-ready`). An operator who wants to run `/estimate`, `/decisions`, `/improve`, `/coverage-map`, `/record-signal`, or any of the 30+ skills outside the linear sequence cannot do so. VS Code Copilot Chat allows free invocation of any skill at any point.

3. **No pipeline context at session start** — `buildSystemPrompt()` pre-loads the active skill's `SKILL.md` and product context files but not: the current feature slug, the current pipeline phase, the list of artefacts already produced, or `workspace/state.json` checkpoint. The model begins every session unaware of where the operator is in the pipeline — it cannot give the same "here is where we are and what's next" orientation that VS Code Copilot Chat provides.

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

3. **Pipeline context auto-loader:** `buildSystemPrompt()` extended to pre-load at session start: `pipeline-state.json` (current feature, phase, health summary), `workspace/state.json` (checkpoint and resume instruction), and a listing of artefact files under the active feature slug. This is a pure addition — approximately 30 lines to the prompt assembly function, no new routes or adapters.

These three capabilities may be delivered in one feature or split into three consecutive stories if the scope warrants it. That decision is deferred to `/definition`.

## Out of Scope

- **VS Code extension UX / keybindings** — the web UI is a browser surface; it does not replicate VS Code panel layout, keyboard shortcuts, or extension-specific visual affordances. Parity means functional capability, not visual identity.
- **Custom model routing layer** — the web UI delegates model selection to whatever model is wired via `setModelAdapter()`. This feature does not add model-routing logic, cost-tier selection, or provider-switching UI. That is a separate pipeline concern.
- **Mobile or native application** — the web UI is a browser-hosted Node.js/Express app. This feature delivers no mobile-native wrapper, offline capability, or platform-native packaging.
- **Write-tool execution (artefact writes by the server)** — the tool execution loop in this scope is read-only. The model describes what to write in its prose response; the operator copies it to disk (or a future feature automates that step). Write execution introduces file mutation risk and is deferred.
- **Multi-model concurrent sessions** — running two different models simultaneously in one skill session is out of scope. Single-session, single-model execution is the baseline.

## Assumptions and Risks

**Assumptions:**
- The `<TOOL:.../>` marker format is distinguishable from normal prose and skill output with sufficient reliability to avoid false positives. Validated by: choosing a non-ambiguous marker format and testing against the full SKILL.md library.
- Path-traversal guarding (resolve + `startsWith(repoRoot)`) is sufficient to prevent arbitrary file reads. Validated by: existing pattern in ougl.5/ougl.6 (ADR-023) — same guard, already tested.
- The skills in scope that require file reads (`/workflow`, `/trace`, `/improve`, `/coverage-map`, `/record-signal`) are satisfied by `read_file` and `list_dir` alone — no shell execution required for MVP. Risk: `/trace` and `npm test` emit from scripts. May require a `run_script` tool for full `/trace` parity — flagged as a post-MVP extension point.
- `buildSystemPrompt()` token budget can absorb the pipeline context addition without hitting model context limits. Risk: for large features with many artefacts, the listing may be large. Mitigated by: listing filenames only (not contents) until the model requests a specific file via the tool loop.

**Risks:**
- If the `<TOOL:.../>` emission format is inconsistently applied by the model, the tool loop silently fails — the session continues but the file is never read. Risk level: medium. Mitigation: server-side detection and fallback notification in the turn output.
- The slash command router opens all 44 skills to freeform invocation. Skills that expect a prior artefact chain (e.g. `/definition` expects an approved discovery) will produce outputs that fail downstream gates if the chain is absent. Risk level: low — this is operator responsibility, not a regression risk. Mitigation: the skill's own entry condition checks handle this.

## Directional Success Indicators

- A platform operator runs `/workflow` from the web UI and receives an accurate pipeline health report — including which artefacts exist, what's missing, and what to run next — without switching to VS Code.
- A platform operator runs `/trace` from the web UI on a completed feature and receives a trace report that references real artefact content (not fabricated output).
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

[Name — Role — Date]

---

**Next step:** Human review and approval → /benefit-metric
