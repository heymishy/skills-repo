# Discovery: Impact/Effort Matrix Workshop Tool

**Status:** Draft — pending operator approval
**Feature slug:** 2026-06-04-impact-effort-matrix-workshop
**Discovery date:** 2026-06-04

---

## Problem statement

Workshop facilitation using impact/effort 2×2 matrices is entirely manual today. Facilitators must reconstruct outcomes long after the session ends, participants cannot confirm their specific input was captured, and the context of *why* an idea landed where it did — the debate, the challenges, the reasoning — is permanently lost. When workshop outputs reach the outer loop of a delivery pipeline, they arrive as flat labels and positions with no reasoning, forcing redundant clarifying questions and slowing discovery runs. The tool that should produce richer context is creating a gap instead.

---

## Who it affects

**Facilitator (primary persona)**
Runs the workshop. Currently spends significant time post-session reconstructing what was discussed, where cards moved, and why particular items were positioned as they were. Bears the full burden of capturing context that participants believed they contributed to live. Pain point: write-up is long, imprecise, and happens when recall is weakest.

**Product lead / SME / participant (primary persona)**
Attends workshops and contributes debate and reasoning. Currently has no way to verify that their specific input — challenges to positioning, effort rating rationale — was captured. Pain point: uncertainty about whether their contribution was valued or recorded.

---

## Why now

The skills platform outer loop (discovery → definition → definition-of-ready) is now directly consuming workshop outputs. Flat, context-free positioning exports are producing discovery artefacts with many open assumptions and gaps, requiring clarifying questions that extend and slow pipeline runs. Feeding richer, transcript-linked context into the outer loop is the next quality lever — and the outer loop infrastructure exists to consume it now.

---

## MVP scope

A single-author web application providing four capabilities:

1. **2×2 grid canvas** — create cards with names and labels, drag to position on impact (Y-axis) and effort (X-axis)
2. **Transcript import** — upload a manually exported transcript file from the workshop recording (text, SRT, or VTT format)
3. **Auto-segmentation** — AI-assisted identification of which transcript segments (with timestamps) relate to which card on the grid
4. **Markdown export** — exports card names, axis positions, and linked transcript segments as a structured markdown document consumable directly by the outer loop

Single-author only. No account system, no server-side persistence, and no API integrations required for MVP.

---

## Out of scope

1. **Real-time collaboration and multi-author editing** — explicitly deferred; a single facilitator drives the MVP session
2. **Platform integrations** — no Zoom, Miro, Jira, Confluence, or outer loop API integration; export is manual copy of markdown
3. **Server-side persistence and session history** — no project history, no user accounts, no saved sessions beyond the browser; browser-local state is acceptable for MVP
4. **Custom axis frameworks** — impact vs effort is the fixed axis pair; other 2×2 frameworks (e.g. value vs risk, desirability vs feasibility) are deferred

---

## Assumptions and risks

[ASSUMPTION] Transcript files can be imported in a standard text format (plain text, SRT, or VTT) that works without custom adapters across Zoom, Teams, and Loom exports — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Auto-segmentation accuracy is sufficient for MVP trust without a manual review or correction step per card — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Plain markdown export (card name + axis position + transcript timestamp range + excerpt) is sufficient for outer loop consumption without a structured schema or API contract — unconfirmed, requires /clarify before scope is locked.

**Confirmed constraint:** If workshops stop occurring as a result of this tool — i.e. it replaces facilitated sessions rather than enhancing them — the initiative has failed. Workshop continuity is a success condition, not a stretch goal.

**Key risks:**
- Auto-segmentation quality is the single highest risk: if timestamp attribution is consistently wrong, facilitator trust breaks on first use and the core value proposition fails
- Transcript format variability across recording platforms may require format-specific parsing not scoped for MVP
- The AI capability required for reliable auto-segmentation may exceed the technical complexity appropriate for a single MVP delivery cycle — a spike on this assumption is strongly recommended before definition

---

## Success indicators

**Facilitator write-up time**
Baseline: significant manual effort after each workshop — specific duration not currently tracked; operator-estimated as materially long. Target: near-zero (facilitator can export from tool immediately after session with no manual reconstruction). Measured via: facilitator self-report after the first 3 workshops using the tool.

**Clarifying questions in outer loop discovery runs**
Baseline: [UNKNOWN BASELINE — clarifying question count per discovery run not currently tracked]. Target: measurable reduction in clarifying questions generated during discovery when input is sourced from this tool vs manual write-up. Measured via: discovery session transcript comparison across before/after workshop pairs.

**Discovery run speed**
Baseline: [UNKNOWN BASELINE — outer loop discovery run duration not currently tracked]. Target: faster discovery runs when input is sourced from this tool. Measured via: session timing comparison across before/after pairs.

**Workshop health signal (failure condition)**
Baseline: workshops currently occurring at some frequency (not quantified). Target: workshop frequency maintained or increased after 3-month adoption window. Measured via: facilitator confirmation that workshops have not been replaced by the tool.

---

## Constraints

- Single-author for MVP — no multi-user session infrastructure in scope
- No real-time collaboration (network architecture deferred)
- No server-side persistence required for MVP — browser-local state acceptable
- No external platform integrations in scope (Zoom, Teams, Jira, outer loop API)

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Transcript files can be imported in a standard text format (plain text, SRT, or VTT) that works without custom adapters across Zoom, Teams, and Loom exports — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Auto-segmentation accuracy is sufficient for MVP trust without a manual review or correction step per card — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Plain markdown export (card name + axis position + transcript timestamp range + excerpt) is sufficient for outer loop consumption without a structured schema or API contract — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification. A spike on auto-segmentation feasibility is also recommended before committing to definition.

---

## Attribution

**Contributors:**
- [YOUR NAME] — [YOUR ROLE] — 2026-06-04

**Reviewers:**
- Pending

**Approved By:**
- Pending