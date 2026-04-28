## Epic: Seamless onboarding, lockfile integrity, and brownfield routing

**Discovery reference:** `artefacts/2026-04-24-platform-onboarding-distribution/discovery.md`
**Benefit-metric reference:** `artefacts/2026-04-24-platform-onboarding-distribution/benefit-metric.md`
**Slicing strategy:** User journey (within this epic) — stories follow the consumer's chronological onboarding path: lockfile schema established → install/fetch → /start greenfield orientation → /start brownfield routing. Each story is independently deliverable; the lockfile schema and pin/verify are the foundation; /start builds on the installed state.

## Goal

When this epic is complete, a new consumer who clones the repository and runs `/start` receives a guided, actionable orientation within a single conversational turn and under two minutes — with no documentation reading required beyond that point. Consumers can run `pin` to record their skill version hashes and `verify` to detect drift. A consumer with an existing codebase (brownfield) receives a routed entry path (A, B, or C) rather than a generic "start from scratch" prompt. The platform maintainer receives zero orientation support questions after `/start`.

## Out of Scope

- `upgrade` command with lockfile-diff visibility (WS0.2 — subsequent story after the lockfile model is established in this epic).
- ADO-specific or non-git consumer distribution mechanisms (WS0.4 — separate workstream; `fetch` in p11.5 is scoped to git-native upstream only).
- Teams bot surface (WS0.7 — subsequent feature, gated on this epic's and Epic 1's completion).
- Fleet-level or multi-repository lockfile management.
- A fourth or fifth brownfield entry pattern — if no pattern matches, `/start` falls back to `/workflow` and does not attempt to invent a route.
- WS4.2/WS4.3 hash verification integration — the lockfile schema and `pin`/`verify` commands defined here are the entry condition for WS4, but WS4.3 integration is a Phase 5 workstream story.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Time-to-first-skill-run | Not yet measured; expected >15 minutes on current ONBOARDING.md flow | Under 2 minutes from repo open to first `/start` output | `/start` SKILL.md replaces the documentation-first pattern with a single-turn concierge |
| M2 — Support contacts per onboarding | >0 per onboarding | 0 orientation contacts | `/start` routes consumer directly to their next action; no platform team contact needed |
| M4 — Lockfile pin/verify round-trip | 0% — pin/verify are stubs | Deterministic pass/fail in ≤5 seconds | `pin` and `verify` are implemented against the lockfile schema |
| MM1 — `/start` concierge hypothesis | Not yet validated | 2/3 onboardings proceed without re-reading ONBOARDING.md | `/start` is implemented; hypothesis becomes testable |
| MM3 — Brownfield routing hypothesis | Not yet validated | Correct routing on 2/2 observed sessions | `/start` brownfield detection and Entry A/B/C routing is implemented |

## Stories in This Epic

- [ ] p11.4 — Define lockfile schema and implement `pin` and `verify` in `cli-adapter.js`
- [ ] p11.5 — Implement `init` and `fetch` in `cli-adapter.js`
- [ ] p11.6 — Create `/start` SKILL.md (greenfield context orientation)
- [ ] p11.7 — Extend `/start` with brownfield context detection and Entry A/B/C routing

## Human Oversight Level

**Oversight:** Medium
**Rationale:** p11.4 and p11.5 touch `src/enforcement/cli-adapter.js` — the enforcement layer. The lockfile schema is a forward-compatibility constraint affecting WS4. p11.6 and p11.7 create a new SKILL.md that will be read by all future consumers; the content must be reviewed before dispatch. ADR-011 applies to the new `/start` SKILL.md.

## Complexity Rating

**Rating:** 2
**Reason:** The lockfile schema design (WS4 forward compatibility) and the brownfield context detection signals introduce known unknowns. The `/start` concierge sub-2-minute constraint is a design discipline constraint that requires care. p11.4 is complexity 2; p11.5, p11.6 are complexity 1; p11.7 is complexity 2.

## Scope Stability

**Stability:** Stable for p11.4 and p11.5. Unstable for p11.7 until brownfield detection signals are confirmed (first consumer observation may require adjustment).
