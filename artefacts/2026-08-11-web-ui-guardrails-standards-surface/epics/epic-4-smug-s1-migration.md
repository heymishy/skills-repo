## Epic: `smug-s1`'s DB-backed Standards tab is fully retired, replaced by the repo-backed view

**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

Once Epics 1-3 are live and proven, the old `standards.js` promote/opt-out routes, the Standards tab's old rendering, and the underlying `standards`/`standard_product_optouts` DB tables are removed — leaving exactly one guardrails/standards concept in the codebase (the repo-backed one), not two disconnected ones. This is deliberately the LAST epic in the walking skeleton, run only once the replacement has been live and confirmed working — per `decisions.md`'s ARCH entry #4 rationale.

## Out of Scope

- **Any change to the new repo-backed view/write/promotion mechanism** — Epics 1-3's own scope; this epic only removes the old mechanism.
- **A data-migration script copying existing DB `standards` rows into any repo** — explicitly not needed; the DB table's `content` was already confirmed (during discovery) to have no link to real governed repo content, so there is nothing meaningful to migrate forward. Any tenant who wants their old DB-backed standards content to exist as real repo content must re-add it via Epic 2's new add/edit flow.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Guardrail/standard visibility in the web UI | 0% | 100% of active products render a populated, correctly-delineated view | Removes the old, disconnected view so there is exactly one place to look — completes the "no two disconnected standards concepts" goal from `decisions.md`'s ARCH entry #4 |

## Stories in This Epic

- [ ] Remove `smug-s1`'s promote/opt-out routes and Standards tab rendering — story-slug: `wugs-s11`
- [ ] Remove the `standards`/`standard_product_optouts` DB tables and their references — story-slug: `wugs-s12`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Deletion of existing production code/data — real risk of breaking something not fully accounted for, but a well-understood, bounded removal (not experimental new logic).

## Complexity Rating

**Rating:** 2 — the removal itself is mechanical, but requires careful cross-checking (e.g. `handleDeleteProduct`'s existing `DELETE FROM standards`/`standard_product_optouts` cleanup lines, found during this feature's own discovery investigation, must be removed too — not just the routes).

## Scope Stability

**Stability:** Stable — deliberately sequenced last, only started once Epics 1-3 are confirmed live.
