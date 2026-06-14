# Benefit Metric: /ideate Web UX — Increment 2 (Conditions Sidebar)

**Discovery reference:** `artefacts/2026-06-15-ideate-web-ux-inc2/discovery.md`
**Parent feature:** `artefacts/2026-05-21-ideate-web-ux/` (Increment 1)
**Date defined:** 2026-06-15
**Metric owner:** Hamish King — Platform operator / tech lead

---

## Tier 1: Product Metrics (User Value)

### M1: Condition capture rate

| Field | Value |
|-------|-------|
| **What we measure** | % of `conditionItem` SSE events emitted by the server that produce a visible card in `#condition-items` within 500ms of emission, as measured by the automated test suite |
| **Baseline** | 0% — no conditions panel exists today; conditions are invisible during /ideate sessions |
| **Target** | 100% — every emitted conditionItem event renders a card |
| **Minimum validation signal** | ≥95% in CI (same threshold as Increment 1 M1 for assumptionCard) |
| **Measurement method** | Automated test: synthetic conditionItem SSE event → card presence assertion in `check-inc2.1-conditions-panel.js`. Measured on every PR. |
| **Feedback loop** | <95%: story not shippable. Fix before merge. |

### M2: Discovery constraint fill rate (directional)

| Field | Value |
|-------|-------|
| **What we measure** | Whether conditions identified in the panel are directly usable in the /discovery "Architecture Constraints" and "Dependencies" sections without re-reading the ideation transcript |
| **Baseline** | 0% — no structured condition stream; constraints extracted manually from prose |
| **Target** | ≥1 condition panel output directly referenced in the immediately following /discovery artefact for first 3 sessions using Increment 2 |
| **Minimum validation signal** | ≥1 of first 3 sessions shows a condition panel output referenced in the downstream /discovery artefact |
| **Measurement method** | Operator self-report after each session: did you reference a condition card in the /discovery constraints section? Logged in `workspace/experiments/` or operator notes. |
| **Feedback loop** | 0/3: conditions panel is not useful enough to replace transcript re-reading — investigate card content quality and SKILL.md emission instruction. |

---

## Tier 2: Platform / Infrastructure Metrics

### MM1: T3M1 gate enforcement signal (CDG metric close)

| Field | Value |
|-------|-------|
| **What we measure** | Whether the web UI gate-confirm path (`handlePostGateConfirm`) writes a chain-hash trace entry during the inc2.1 story delivery |
| **Baseline** | 0 gate-confirm trace entries in workspace/traces/ (as of 2026-06-15) |
| **Target** | ≥1 entry in `workspace/traces/2026-06-15-ideate-web-ux-inc2.trace.jsonl` after inc2.1 gate-confirm |
| **Minimum validation signal** | 1 trace entry with valid chainHash, featureSlug, storyId fields |
| **Measurement method** | Review trace file after inc2.1 gate-confirm. Record T3M1 signal in CDG pipeline-state.json. |
| **Feedback loop** | 0 entries after gate-confirm: diagnose `setWriteTrace` wiring in server.js. |

---

## Metric Ownership and Review Schedule

| Metric | Owner | Review at |
|--------|-------|-----------|
| M1 — Condition render pipeline | GitHub Copilot (CI) | Every PR |
| M2 — Discovery fill rate | Hamish King | After first 3 live sessions |
| MM1 — T3M1 close | Hamish King | After inc2.1 gate-confirm |
