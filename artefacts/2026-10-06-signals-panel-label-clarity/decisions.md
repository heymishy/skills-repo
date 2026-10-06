# Decisions: Signals panel label clarity fix

## Short-track exemption (2026-10-06)

**Context:** The operator, while investigating a different reported issue ("hundreds of parse-error signals" on the real production `/signals` panel), identified the real root cause of the misreading as the panel's own redundant/unexplained source+type label rendering — "maybe it's the labels then... labels that mean nothing." Confirmed via direct code read (`signals-panel-view.js`, `signals-aggregator.js`) and a live authenticated check against `https://skills-framework.fly.dev/signals`.
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`), per CLAUDE.md's own short-track path for "bugs, small fixes, bounded refactors" — this is a small, well-understood view-layer rendering change (collapse two label divs to one when redundant, combine onto one line when not), not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent (`dswf-s1`, `wswda-s1`, `spdr-s1`/`spdr-s2`, all 2026-10-06) for exactly this class of situation — a real, narrowly-scoped defect found mid-session, fixed immediately via the governed short-track path rather than skipped or deferred without process.
**Made by:** Hamish King (operator decision, "Short-track fix now"), recorded by Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK), 2026-10-06.

## Scope decision: collapse redundant labels, do not build a label-mapping dictionary (2026-10-06)

**Context:** Two fixes were possible: (a) collapse/combine the existing raw source/type values when they are redundant or meaningless as two separate lines; or (b) build a human-readable label-mapping dictionary translating every internal source/type code (`parse-error`, `pipeline-state`, `feature-status`, `dod-follow-up`, etc.) into friendlier display text.
**Decision:** Option (a) only.
**Rationale:** Option (b) is open-ended — every new source/type added to `signals-aggregator.js` in the future would need a matching dictionary entry, and an unmapped new value would either need a fallback (reintroducing the raw-code problem) or become a silent gap. The actual defect demonstrated this session was redundancy/noise (identical text shown twice, or two unexplained codes competing visually with the real signal text below them) — not that the vocabulary itself was wrong. Collapsing fixes the demonstrated defect without opening a new, larger maintenance surface.
**Made by:** Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK), 2026-10-06.

## Retraction: filter-compose "bug" was a false positive (2026-10-06)

**Context:** Earlier in this same investigation, a Claude-in-Chrome ref-based click on a filter-toggle link appeared not to navigate, and a screenshot was misread as showing an "active" filtered state (actually just the `parse-error` cards' permanent orange-left-border styling, which also happens to always sort to the top of the signal list). This was reported to the operator as a real bug ("filter buttons don't compose") and the operator initially agreed to bundle a fix for it into this story.
**Decision:** Retracted before scoping this story. Re-tested via direct `window.location.href` checks (bypassing the browser-automation tool's own click/URL-reporting, which lagged the real DOM): `Hide feature-status` then `Hide note` correctly composed to `?hideType=feature-status%2Cnote`. No code change needed; this story's scope is the label-redundancy fix only.
**Made by:** Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK), 2026-10-06. See also `workspace/capture-log.md`'s own retraction entry, same date.

## RISK-ACCEPT: 2 pre-existing, unrelated full-suite failures found during Task 1's regression run (2026-10-06)

**Context:** `npm test`'s full-suite run for `splc-s1` (`.worktrees/splc-s1`, branched from `origin/master`) found 2 failing files, both confirmed pre-existing and unrelated by re-running the identical commands against the unmodified main checkout:
1. `tests/check-p3.5-validate-trace.js` — `ps1-real-repo-discovery-approved-has-no-known-false-positives` / `ps1-exits-0-on-valid-repo-with-ci-flag` fail because `2026-10-05-customer-journey-as-first-class`'s `discovery.md` genuinely still says `Status: Draft` — the exact same pre-existing condition already RISK-ACCEPTed in `dswf-s1`'s own `decisions.md` (2026-10-06).
2. `tests/check-workspace-state.js` — `cycle.discovery` block is missing from `workspace/state.json`, a pre-existing schema gap confirmed present on master before this story's own branch point; `splc-s1` does not touch `workspace/state.json`.
**Decision:** Acknowledge both as pre-existing/unrelated and proceed with `splc-s1`'s own verification and PR without attempting to fix either — both are out of this story's scope (a view-layer label-rendering fix).
**Rationale:** Consistent with this session's own established RISK-ACCEPT pattern for pre-existing, unrelated baseline failures (`dswf-s1`, `wswda-s1`, `sptu-s1`/`sptu-s3`/`sptu-s4`'s own branch-setup/regression entries).
**Made by:** Claude Sonnet 5 (session_01J4KGY2CbjT8BupyvLZcpFK), found during the full-suite regression run, 2026-10-06.
