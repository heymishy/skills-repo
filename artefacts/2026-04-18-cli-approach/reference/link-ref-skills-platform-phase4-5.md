# Link: heymishy Phase 4 / Phase 5 strategic horizon reference

**This file is a pointer, not the document itself.** The source is in this repo (merged from upstream/master 2026-04-18):

- **Repo-relative path:** `artefacts/2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`
- **Relative path from this reference folder:** `../../2026-04-18-skills-platform-phase4-revised/ref-skills-platform-phase4-5.md`

**Provenance:** Authored upstream by heymishy, dated 2026-04-17. Document type: discovery reference material — strategic horizon. Status (on the upstream side): Draft for outer-loop review.

**Why a pointer in this folder:** The phase4-5 document lives in a different feature's artefact folder (`2026-04-18-skills-platform-phase4-revised/`). Discovery's auto-detect only reads `artefacts/[current-feature-slug]/reference/`, so without this pointer the document would not be surfaced to skills running on the cli-approach feature. This file is the bridge.

---

## Why it matters for this discovery

This document is the **direct origin of the "matrix of five enforcement mechanisms" framing** that heymishy applied to PR #155 (see `reference/pr-comments-155.md`). Reading it before `/clarify` is high-leverage — it gives the operator-side context for heymishy's pushback and resolves several of the open questions in 013 §16.

Specifically, it:

1. **Defines the three-axis terminology** heymishy is now using to disambiguate previously-collapsed concepts:
   - **Interaction surface** — where the human operator works (VS Code, Claude Code, terminal, Teams, Confluence, web UI).
   - **Agent execution substrate** — where the model runs (Copilot Agent mode, Claude Code in terminal, API call, Azure AI Foundry).
   - **Enforcement mechanism** — how the platform structurally constrains the agent's pipeline access (file-based self-discipline / CLI prompt injection / MCP tool boundary / orchestration framework / structured output schema).
   
   012/013 conflate at least the second and third axes. This document separates them cleanly.

2. **Explicitly cites craigfo's CLI as one example enforcement mechanism** — *"CLI prompt injection (craigfo PR #98)"* — alongside file-based self-discipline (current Phase 3), MCP tool boundary, orchestration framework graph transitions, and structured output schema validation. This is the source of the "matrix of five" framing in PR #155's review.

3. **Names Phase 4 as narrowly scoped to two architectural survival problems** — distribution/update channel, and structural enforcement — with a third surfaced from the operating model (second-line organisational independence for RBNZ BS11). Everything previously roadmapped as Phase 4 (operational domain standards, agent identity, policy lifecycle, cross-team autoresearch) moves to Phase 5.

4. **Frames the "Phase 3 solution" and "craigfo CLI solution" as combinations across the three axes**, not competing platform shapes. This is the underlying logic of the *(a) reference implementation for Spike B2 / (b) the governance package itself* question heymishy posed on PR #155.

## Discovery / clarify implications

- The (a)/(b) decision is more meaningful once you have read this document. (a) is "the CLI is one of five candidate enforcement mechanisms; spike B2 evaluates it." (b) is "the CLI is the platform's enforcement choice, replacing file-based self-discipline." This document strongly suggests heymishy is operating in the (a) frame.
- The matrix-of-five framing is heymishy's; it is published reference material on their side. 013 §15 ("What the CLI approach is not") should be updated to acknowledge it explicitly.
- Several of 013 §16's open questions — particularly §16.5 (non-git-native surfaces), §16.6 (CLI vs assurance gate), §16.7 (CLI mandatory vs one-of-several) — collapse cleanly once the three-axis terminology is adopted.

## When to follow the link

- **Before `/clarify` runs** on this discovery — required reading for the operator session.
- **Before any reply to PR #155 substantively engaging the matrix-of-five framing** — the language should align with heymishy's published terminology.
- **For any future revision of 013** — the three-axis terminology supersedes 012/013's two-axis (CLI vs MCP) framing.
