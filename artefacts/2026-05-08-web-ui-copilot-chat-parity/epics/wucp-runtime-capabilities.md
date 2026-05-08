## Epic: Web UI Runtime Capabilities

**Discovery reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/discovery.md
**Benefit-metric reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/benefit-metric.md
**Slicing strategy:** Risk-first

Rationale: The highest-uncertainty item (MM1 baseline — does the model reliably emit `<TOOL:.../>` markers?) gates the highest-risk story (Gap 1 tool execution loop). Model-independent work (Gap 2 slash command router, Gap 3 context auto-loader) has no dependency on the spike result and proceeds in parallel. Gap 1 follows only after MM1 emission rate is confirmed ≥ 60%.

**Spike-gate scope:** wucp.0 blocks **only wucp.3**. If the spike returns MM1 < 60% (Outcome C), wucp.3 is suspended pending prompt redesign — but wucp.1 (Gap 3, context auto-loader), wucp.2 (Gap 2, slash command router), and wucp.4 (session start wizard) are all unaffected and proceed to /review and /test-plan immediately. A failed spike does not block the epic — it blocks one story. DoR sign-off and dispatch for wucp.1, wucp.2, and wucp.4 must not wait for wucp.0 to resolve.

## Goal

A platform operator can run any pipeline skill from the web UI and receive artefact-grounded output — including skills that read pipeline state, check artefact presence, and inspect workspace context — without switching to VS Code. The web UI becomes a viable primary delivery surface for the full outer loop cycle.

## Out of Scope

- Hash-chain trace verification parity (running `scripts/validate-trace.sh`, reading git provenance) — file-read parity is the MVP bar for this epic; script execution is a separate post-MVP story
- Write-tool execution (artefact writes by the server) — tool loop in this epic is read-only; model prose output is the write path
- Model routing, provider switching, or cost-tier selection — the web UI delegates to whatever model is wired via `setModelAdapter()`
- VS Code panel layout, keybindings, or visual identity parity — functional capability parity only
- Multi-model concurrent sessions

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — /workflow health accuracy | 0% (no tool reads) | ≥ 80% tool-execution confirmed across 10 sessions | wucp.3 adds the tool loop that makes M1 measurable |
| M2 — /trace file-read parity | 0% (no tool reads) | ≥ 5 reads/run, real content referenced across 5 runs | wucp.3 enables file reads that M2 requires |
| M3 — Outer loop completeness | Not achievable | Full cycle via web UI sole interface | wucp.1 + wucp.2 unlock the model-independent phases; wucp.3 completes the capability |
| MM1 — Tool marker emission rate | Unknown | ≥ 80% across 20 scenarios | wucp.0 establishes and documents the baseline |
| MM2 — Unassisted replication | Not achievable | M3 cycle fully unassisted | All four stories required |

## Stories in This Epic

- [ ] wucp.0 — MM1 prompt validation spike (gates wucp.3)
- [ ] wucp.1 — Pipeline context auto-loader (Gap 3)
- [ ] wucp.2 — Slash command router (Gap 2)
- [ ] wucp.3 — Tool execution loop (Gap 1) — blocked on wucp.0 MM1 ≥ 60%
- [ ] wucp.4 — Session start wizard (project/repo selection) — scope addition; enables wucp.1 full value

## Human Oversight Level

**Medium** — coding agent should pause for human review at PR. Rationale: wucp.3 adds a server-side file execution loop with path-traversal implications; human review of the security implementation is warranted before merge. wucp.0 is a spike with no production code change — human review of the result (not a PR merge) is the gate. wucp.1 and wucp.2 are Medium (system prompt engineering changes affect all sessions).
