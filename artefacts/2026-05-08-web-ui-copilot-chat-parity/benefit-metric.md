# Benefit Metric: Web UI Copilot Chat Parity

**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Date defined:** 2026-05-09
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** [Non-engineering reviewer TBD before /definition-of-ready]

---

## Tier Classification

**⚠️ META-BENEFIT FLAG: Yes**

This feature delivers product value (web UI parity with VS Code delivery surface) AND validates a tooling capability hypothesis (can the current model reliably emit structured `<TOOL:.../>` markers when instructed?). Both tiers are active. A Phase 5 delivery cycle via the web UI validates product metrics; the prompt validation test (first implementation task) validates MM1.

The two tiers can succeed or fail independently:
- Tier 1 (M1–M3) measures whether the web UI is a viable primary delivery surface
- Tier 2 (MM1–MM2) measures whether the chosen tool marker approach is sound

If MM1 falls below the minimum signal threshold (< 60% emission rate), the implementation approach for Gap 1 must be revised before M1 or M2 can be measured at all.

---

## Measurement Prerequisites

**Model selection dependency (M1, M2, MM1):** The tool execution loop (Gap 1) depends on the model emitting `<TOOL:read_file path="..."/>` and `<TOOL:list_dir path="..."/>` markers in response to WEB UI PROTOCOL instruction. Emission reliability varies significantly between models. On the platform's default deployment (Sonnet 4.6), the MM1 baseline will be established during implementation. For enterprise deployments not yet on the platform's default model (e.g. operators using GPT-4o via Azure OpenAI without the GitHub App), M1 and M2 are **not meaningfully measurable** until the GitHub App request — which resolves model selection at the application level — is actioned. Enterprise baseline measurement for M1/M2 is explicitly deferred until that prerequisite is met.

**Gap 2 (slash command router) and Gap 3 (pipeline context auto-loader) are model-independent.** M3's outer loop completeness signal can be partially measured from those gaps alone, regardless of M1/M2 status.

---

## Tier 1: Product Metrics (User Value)

### M1: `/workflow` pipeline health accuracy from web UI

| Field | Value |
|-------|-------|
| **What we measure** | When an operator invokes `/workflow` on a feature with existing artefacts, the web UI response correctly identifies current pipeline stage, lists present and missing artefacts, and names the correct next action — **confirmed by server-side tool execution log** showing at least one `read_file` or `list_dir` marker was detected and executed |
| **Baseline** | 0% — no tool execution loop exists today. All `/workflow` responses in the web UI are model-generated without file access; the response looks plausible but has not read any artefacts |
| **Target** | ≥ 80% of `/workflow` invocations produce an artefact-grounded report (tool execution confirmed in server log) across the first 10 live operator sessions post-deployment |
| **Minimum validation signal** | ≥ 60% tool-execution rate in the first 5 live sessions. Below this threshold, the WEB UI PROTOCOL instruction must be revised before further measurement |
| **Measurement method** | Platform maintainer (Hamish King) reviews server-side tool execution log after each outer loop session. Log entry per `read_file` / `list_dir` execution records: invoked skill, path read, turn number. Measured per session for first 10 sessions. |
| **Feedback loop** | If tool-execution rate < 60% after 5 sessions: halt and evaluate alternative tool formats (structured output, function calling if API supports it). If 60–80%: improve WEB UI PROTOCOL instruction and re-measure. If MM1 baseline (established in implementation) is < 60% for the target model, M1 measurement does not proceed until MM1 is resolved. |

**Model dependency note:** M1 is model-dependent. Enterprise deployments using a model other than Sonnet 4.6 must not use M1 results from the platform's own deployment as a proxy — emission reliability differs. Enterprise M1 measurement is deferred until the GitHub App request resolves model selection at the application level.

---

### M2: `/trace` artefact-read parity from web UI (MVP: file-read parity)

| Field | Value |
|-------|-------|
| **What we measure** | A `/trace` invocation on a completed feature results in a report that references actual artefact file content — **confirmed by server-side tool execution log** showing ≥ 5 `read_file` executions per run. At least one direct reference to real artefact content (story slug, AC text, or test plan filename matching the real artefact) must appear in the response. |
| **Baseline** | 0% — no file reads today. All `/trace` output in the web UI is model-generated; the report may contain plausible but entirely fabricated artefact references |
| **Target** | ≥ 5 confirmed `read_file` executions per `/trace` run; response contains ≥ 1 direct reference to real artefact content. Achieved consistently across 5 measured runs. |
| **Minimum validation signal** | ≥ 3 `read_file` executions per run across 3 consecutive runs |
| **Measurement method** | Server-side tool execution log, reviewed post-session. Same cadence as M1. Cross-check: compare one artefact filename or AC snippet from the `/trace` response against the actual artefact file on disk. |
| **Feedback loop** | If reads < 3 per run after 5 sessions: tighten SKILL.md tool emission guidance or improve context injection for the `/trace` skill. If reads ≥ 3 but < 5: acceptable short-term — plan improvement pass before Phase 5 WS5 (improvement agent, which depends on this capability). |

**Scope boundary:** Full hash-chain verification parity (running `scripts/validate-trace.sh`, reading git provenance) is a **separate post-MVP indicator** — not included in this metric. M2 measures file-read parity only. See discovery Assumptions section for the scope split rationale.

**Model dependency note:** Same constraint as M1. Enterprise M2 measurement deferred until GitHub App prerequisite resolved.

---

### M3: Web UI outer loop completeness (dogfood signal)

| Field | Value |
|-------|-------|
| **What we measure** | Whether a complete outer loop cycle — discovery → benefit-metric → definition → review → test-plan → definition-of-ready — can be run using the web UI as the sole interface, with no switch to VS Code required at any stage |
| **Baseline** | Not achievable today. VS Code is required for any file-reading skill (`/workflow`, `/trace`, `/improve`, `/record-signal`). Stages after definition are not possible via web UI without the tool execution loop. |
| **Target** | One complete cycle documented and signed off by platform maintainer, completed before Phase 5 WS0 (non-technical channel) work begins. The cycle must be for a real feature, not a synthetic test — ideally the next Phase 5 story after this one. |
| **Minimum validation signal** | At least discovery + benefit-metric + definition completed without switching to VS Code (partial cycle — confirms Gap 2 and Gap 3 value even if Gap 1 is still maturing) |
| **Measurement method** | Platform maintainer self-report at end of each outer loop session. Artefact commit log confirms source: if artefacts are committed without corresponding VS Code file edits in the same time window, the web UI session is the primary authoring surface. |
| **Feedback loop** | If dogfood cycle is not complete before Phase 5 WS0 start date, Phase 5 WS0 non-technical channel dependency must be revisited — either the tool loop is functionally ready for WS0, or WS0 must include a fallback path. Do not silently assume parity exists at WS0 start. |

---

## Tier 2: Meta Metrics (Tooling Capability Validation)

### MM1: Tool marker emission reliability

| Field | Value |
|-------|-------|
| **Hypothesis** | The model (Sonnet 4.6), when given a concrete `<TOOL:read_file path="..."/>` instruction in the WEB UI PROTOCOL section of `buildSystemPrompt()`, will emit well-formed tool markers consistently enough (≥ 80% of prompted file-read scenarios) to support a reliable server-side detection and execution loop |
| **What we measure** | % of prompted file-read scenarios — where the model has a reason to read a file and has been instructed to emit a marker — that result in a correctly-formed `<TOOL:read_file path="..."/>` or `<TOOL:list_dir path="..."/>` marker in the model response |
| **Baseline** | Unknown. Establishing the baseline is the **first implementation task** — a lightweight prompt validation test (20 prompted scenarios against Sonnet 4.6) must be run before any server loop code is written. Results saved to `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/prompt-validation-results.md`. |
| **Target** | ≥ 80% emission rate across 20 prompted scenarios with Sonnet 4.6 |
| **Minimum signal** | ≥ 60% emission rate. Below this threshold, the marker-based approach must be evaluated against alternatives (structured output, function calling) before implementation proceeds. |
| **Measurement method** | Platform maintainer runs prompt validation test before building server loop. 20 scenarios: mix of `/workflow`, `/trace`, `/improve`, `/record-signal` prompts with explicit file-read intent. Each scenario scored: marker present and well-formed (1), marker malformed or absent (0). Score = (pass count / 20) × 100%. |

**Gate:** MM1 baseline must be established and reported ≥ 60% before Gap 1 server loop implementation begins. This is a hard gate — not a recommendation.

---

### MM2: Unassisted outer loop replication rate

| Field | Value |
|-------|-------|
| **Hypothesis** | The web UI, once at parity with VS Code for tool execution and context loading, can support an operator running a complete outer loop cycle without platform team assistance or VS Code fallback |
| **What we measure** | Whether the M3 dogfood cycle was completed by the platform maintainer without (a) VS Code fallback at any stage, (b) assistance from a second person, or (c) manual file reads to supplement model output |
| **Baseline** | Not achievable today — VS Code required |
| **Target** | M3 cycle completed fully unassisted. Any VS Code fallback or second-person assist invalidates the signal for that cycle (the cycle still counts toward M3 minimum signal, but MM2 is not satisfied). |
| **Minimum signal** | ≥ 80% of outer loop phases (≥ 5 of 6) completed without VS Code fallback or second-person assist |
| **Measurement method** | Self-reported by platform maintainer at end of dogfood cycle. Confirmed by absence of VS Code file edits during the web UI session window (check VS Code recent files timestamp vs commit timestamp). |

---

## Metric Coverage Matrix

*Populated by /definition — 2026-05-09.*

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — `/workflow` accuracy | wucp.3 (tool execution loop — creates measurement log) | Covered |
| M2 — `/trace` file-read parity | wucp.3 (tool execution loop — enables file reads M2 requires) | Covered |
| M3 — Outer loop completeness | wucp.1 (context auto-loader — removes session-start friction); wucp.2 (slash command router — enables non-journey skills); wucp.3 (tool loop — completes file-read requirement for mid-session skills); wucp.4 (session start wizard — correct feature context selection, required for M3 dogfood cycle validity) | Covered |
| MM1 — Tool marker emission rate | wucp.0 (MM1 spike — directly measures and documents baseline; gates wucp.3) | Covered |
| MM2 — Unassisted replication | wucp.1 + wucp.2 + wucp.3 (all three gaps closed together enable unassisted replication); wucp.4 (session start wizard — eliminates manual slug entry, reducing friction in unassisted cycle) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach or task plan — that is /implementation-plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based
- Hash-chain trace verification parity (M2 scope boundary — see above)
- Enterprise model selection resolution — that is the GitHub App request, a separate dependency
