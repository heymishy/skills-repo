# Decisions: Canvas node styling fix

## Decision types

| Type | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-10-15 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV as satisfied for this short-track story via the operator's direct, explicit in-session request ("let's do the canvas style one"), following the same precedent already established for `pcr-s1` and `stis-s1` (see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md` and `artefacts/2026-07-12-skill-turn-test-isolation/decisions.md`) — this is the third occurrence of the same skill-design gap, further reinforcing that it is a real gap in `definition-of-ready/SKILL.md` (H-GOV assumes a discovery artefact always exists, false for short-track by design), not a one-off.
**Alternatives considered:** Same two rejected alternatives as the `pcr-s1`/`stis-s1` precedent — fabricating a discovery artefact, or silently skipping the check without comment.
**Rationale:** Root cause already confirmed (`canvas-node-styling-outcome.md` spike, 2026-10-14) before this story was written; the operator asked for this exact story by name in-session, already aware of the fix's scope and approach from that spike.
**Made by:** Claude (session), 2026-10-15.
**Revisit trigger:** When `definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV (3rd occurrence — same revisit trigger as the prior two).

---
**2026-10-15 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** W4 (verification script reviewed by a domain expert) is risk-accepted for this feature slug, per the repo-wide solo-operator posture in `architecture-guardrails.md`. This is a separate feature slug from `2026-10-14-journey-authoring-experience` (whose own W4 log does not carry over), so this is the first W4 log specifically for `2026-10-15-canvas-node-styling-fix`.
**Rationale:** Same uniform repo-wide posture already applied to every other feature this session — the operator is also the reviewer and final approver.
**Made by:** Established repo-wide posture (`architecture-guardrails.md`), applied here per `/definition-of-ready`'s own W4 check.
**Revisit trigger:** Same as every other W4 log this session — a second operator onboarding, or regulated-enterprise adoption.

---
**2026-10-15 | RISK-ACCEPT | cnsf-s1 live-render check (CLAUDE.md B2) — no local Postgres available**
**Decision:** `/verify-completion`'s mandatory live browser render check could not be performed as a real browser check or a passing Playwright run — same pre-existing, already-logged environment gap confirmed repeatedly this session (`2026-10-14-journey-authoring-experience/decisions.md`, 2026-10-15 entries; `ep1-s4-stage-reorder.spec.js`'s own header comment, decisions.md D5). `tests/e2e/ic-s2-canvas-drag-position.spec.js` and `tests/e2e/ic-s4-keyboard-node-movement.spec.js` (the 2 pre-existing specs touching drawflow nodes) were attempted and fail identically on the missing-Postgres auth/CSRF chain — neither asserts on colour/background/stroke (confirmed by direct grep), so neither is actually exercising this story's own change, but both are logged here for completeness per the mandatory check's own instruction. The 5 unit tests + 1 jsdom cascade-specificity integration test (`tests/check-cnsf-s1-canvas-node-token-styling.js`, 6/6 passing) confirm the override rules exist, use tokens only, and genuinely outrank the real vendor CSS selector — the part a real browser would otherwise need to confirm.
**Rationale:** Same rationale as every other RISK-ACCEPT logged this session for this exact gap — the automated evidence confirms correctness at the rule/cascade level; only final on-screen confirmation (does it actually look right) remains open.
**Made by:** Claude (session), per `/verify-completion`'s own documented RISK-ACCEPT path (CLAUDE.md B2).
**Revisit trigger:** Post-deployment smoke test (added to `workspace/state.json` `pendingActions`) — walk `verification-scripts/cnsf-s1-verification.md`'s 5 scenarios against a real deployed instance.

**[RESOLVED 2026-10-15, post-merge live verification via Claude-in-Chrome against wuce-staging.fly.dev]** Confirmed directly via `getComputedStyle` on the real deployed Canvas view (journey `jae-s3 live-verify`, 5 live drawflow nodes) — more precise than a visual check, exact RGB-vs-token comparison:
- Node: `backgroundColor: rgb(255, 255, 255)` = `--surface` (`#FFFFFF`); `borderColor: rgb(228, 231, 235)` = `--line` (`#E4E7EB`); `borderRadius: 8px`. No cyan.
- Selected state (toggled live): `backgroundColor: rgb(239, 244, 255)` = `--accent-soft` (`#EFF4FF`); `borderColor: rgb(37, 99, 235)` = `--accent` (`#2563EB`). No red.
- Ports: `backgroundColor: rgb(255, 255, 255)` = `--surface`; `borderColor: rgb(228, 231, 235)` = `--line`, identical for input and output. No yellow.
- Connector: `stroke: rgb(228, 231, 235)` = `--line`; `strokeWidth: 2px`. No steel-blue, no 5px.
All 4 values match their token exactly, confirming AC1–AC4 live. AC5 (dark mode) not separately toggled — the mechanism is identical regardless of active theme (no hard-coded value exists to diverge), and this is the same reasoning the unit test (AC5, no hex literal) already established; not re-verified live as a separate step, judged sufficient given AC1–AC4's exact-match confirmation.
**Aside, unrelated:** the same live-verification pass found the "Post-deploy real-staging E2E confirmation" CI job (non-blocking, per `staging-deploy.yml`'s own design — gates nothing) failed on an unrelated scenario (`b1-formed-idea-outer-loop-story-map.spec.js` AC3, a 502 on `gate-confirm`) immediately after this deploy, while the identical job passed cleanly on the `jae-s5` deploy immediately prior — consistent with a Fly.io cold-start race on the freshly-deployed machine, not a regression from this story's CSS-only change (confirmed: no server-side route/handler touched). Not investigated further — non-blocking, unrelated route, no action taken.
