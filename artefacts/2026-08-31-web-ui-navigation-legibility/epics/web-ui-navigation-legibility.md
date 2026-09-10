## Epic: Operators can always tell where they are, what exists, and how to get there — regardless of which channel produced it

**Discovery reference:** artefacts/2026-08-31-web-ui-navigation-legibility/discovery.md
**Benefit-metric reference:** artefacts/2026-08-31-web-ui-navigation-legibility/benefit-metric.md
**Slicing strategy:** Vertical slice — each story is an independent, complete, independently demo-able fix. No shared technical foundation is being built up across them; each reuses an already-established pattern in this codebase and stands alone.

## Goal

An operator returning to a long-running web-UI session can identify their current stage and next action within seconds, without scrolling. The action to move to the next stage is always reachable, never lost in chat history. And any feature or story — whether it was started via the web UI or via Claude Code CLI, whether or not it belongs to a product — is discoverable within one click from the primary `/dashboard` landing page after login, not hidden behind a specific sidebar link the operator has to already know about.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    subgraph wnl-s1[wnl-s1: Context panel]\n        SKILLS1[routes/skills.js\\nbuildContextManifestHtml]\n    end\n    subgraph wnl-s2[wnl-s2: Next-stage action]\n        SKILLS2[routes/skills.js\\njourney gate render ~L4569]\n        SHELL[utils/html-shell.js\\n.sw-imp-banner sticky pattern]\n    end\n    subgraph wnl-s3[wnl-s3: Dashboard discoverability]\n        PRODUCTS[routes/products.js\\nhandleGetDashboard]\n        NAVSUM[routes/products.js\\ngetProductsNavSummary]\n        MERGE[routes/journey.js\\n_mergeStateFeaturesIntoJourneyList]\n    end\n    PRODUCTS --> NAVSUM\n    PRODUCTS -->|reuses, does not re-derive -- ADR-028| MERGE\n    SKILLS2 -.->|reuses existing sticky pattern| SHELL"}}---

## Out of Scope

- The feature summary page redesign — no specific defect named yet; deserves its own scoping pass once concrete issues are identified.
- A per-feature artefact browser — already built and shipped independently (`fadm-s1`/`dmcb-s1`/`dmcb-s2`), not part of this epic.
- Inline editing of artefacts — this epic is navigation/discoverability only, not an editing surface.
- Any redesign of the chat/streaming interaction model itself.
- Pagination or virtualization of the `/journey` feature list itself (currently 270+ items, ~27,000px tall) — a real, separate problem; this epic does not shorten or restructure that list, only ensures the operator can reach the right entry point in it quickly.
- Any change to how products are created, connected to a repo, or managed — this epic only affects how *no-product* work is surfaced alongside them.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|--------------------------|
| M1 — Time-to-orientation after returning to a long-running session | Not yet established | Under 3 seconds, 0 scroll actions | Collapsed context indicator removes the always-expanded file list; persistent next-stage action removes the need to scroll to find "what's next" |
| M2 — Next-stage-action findability | 1 confirmed incident (2026-08-31) | 0 incidents across 4 weeks post-ship | Persistent next-stage action stays reachable regardless of scroll position or session length |
| M3 — Cross-channel feature discoverability from the dashboard | 2 confirmed incidents in one session (2026-09-10) | 0 incidents across 4 weeks post-ship | Dashboard landing page gains a working, one-click entry point to no-product/CLI-authored work, reusing the existing `_mergeStateFeaturesIntoJourneyList` mechanism |
| Web UI Session Start Share (linked, owned by `cross-channel-feature-continuity`) | Owned elsewhere | >50% web UI starts within 4 weeks | This epic removes friction that would otherwise push operators back to the CLI mid-session, or prevent them starting/continuing via the web UI at all |

## Stories in This Epic

- [ ] Collapsed context indicator replacing the always-expanded "Ref docs" list — story slug: `wnl-s1`
- [ ] Persistent next-stage action, reachable regardless of scroll position — story slug: `wnl-s2`
- [ ] No-product/CLI-authored features discoverable from the dashboard landing page — story slug: `wnl-s3`

## Human Oversight Level

**Oversight:** Low
**Rationale:** All three stories are small, low-risk UI/navigation changes reusing already-established, already-live patterns in this codebase (sticky positioning, the existing `_mergeStateFeaturesIntoJourneyList` mechanism, existing collapse/expand conventions). No security, compliance, or data-model surface. This is live in-beta production infrastructure, so changes must remain additive and non-disruptive — but that is a scope constraint on each story's ACs, not a reason to raise oversight level, consistent with how similarly-scoped web-UI stories have been handled elsewhere in this repo (e.g. `jasb-s1`, Low oversight).

## Complexity Rating

**Rating:** 2 — each individual story is well understood (rating 1 in isolation), but the epic as a whole carries some known unknowns: the exact visual/interaction design for the collapse toggle and sticky button are not fully pre-specified (no dedicated design/UX role on this team, per discovery Constraints), and `wnl-3`'s reuse of `_mergeStateFeaturesIntoJourneyList` needs to be verified against the current shape of `products.js`/`journey.js`, which has changed substantially in the two weeks since this discovery was first written.

## Scope Stability

**Stability:** Stable — all three items were re-verified against current code on 2026-09-10 (see discovery's own Amendment log) immediately before this decomposition; no open design questions remain that would change story boundaries.
