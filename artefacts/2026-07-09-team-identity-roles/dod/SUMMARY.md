# Definition of Done Summary: team-identity-roles (epic tir-e1)

**Date:** 2026-07-13
**Assessed by:** Copilot
**Epic status:** complete (all 8 stories `dodStatus: complete`)

---

## Story outcomes

| Story | PR | Outcome | releaseReady | health |
|-------|----|---------| ------------- |--------|
| tir-s1 — person/team schema | #463 | COMPLETE WITH DEVIATIONS | true | green |
| tir-s2 — cross-provider linking | #464 | COMPLETE | true | green |
| tir-s3 — admin adds teammate | #466 | COMPLETE WITH DEVIATIONS | true | green |
| tir-s4 — role-gated credits panel | #465 | COMPLETE WITH DEVIATIONS | true | green |
| tir-s5 — GitHub org bulk-add | #469 | COMPLETE WITH DEVIATIONS | true | green |
| tir-s6 — schema scale validation | #468 | COMPLETE WITH DEVIATIONS | **false** | **amber** |
| tir-s7 — login resolution fix (fix-forward) | #467 | COMPLETE | true | green |
| tir-s8 — bulk-add fetch fix (fix-forward) | #470 | COMPLETE | true | green |

**"Deviations" recorded for tir-s1, tir-s3, tir-s4, tir-s5 are all historical-record notes about the two fix-forward bugs (tir-s7, tir-s8) — all fully resolved by merged PRs, not open items.** Only **tir-s6** carries a genuinely open item: its `DATABASE_URL`-gated performance tests have not yet been executed against a real Postgres instance.

---

## Metric signals

| Metric | Signal | Contributing stories |
|--------|--------|----------------------|
| Metric 1 — Per-person role assignment exists | on-track | tir-s1, tir-s3, tir-s5, tir-s7, tir-s8 |
| Metric 2 — Cross-provider identity collision resolved | on-track | tir-s2 |
| Metric 3 — Feature gated by per-person role | on-track | tir-s4 |
| Metric 4 — Schema holds up at ~100 members/tenant | **not-yet-measured** | tir-s6 |
| Metric 5 — Zero regression for existing solo tenants | on-track | tir-s1, tir-s4 |

---

## One open action

**Run tir-s6's test file against a real `DATABASE_URL`-backed Postgres instance** (e.g. a Neon staging branch, matching the `bri-s2.2` precedent) to produce real evidence for AC1 (index scan), AC2 (under 50ms), and AC4 (batch-insert timing). Until this happens, Metric 4 remains `not-yet-measured` and tir-s6's `releaseReady` stays `false`. This is the only outstanding item across the whole epic.

---

## Two bugs caught and fixed within the same session

1. **tir-s7** — tir-s1's shipped login-role resolution ignored which person was logging in (`team_memberships WHERE tenant_id = $1 LIMIT 1`, no `person_id` filter). Found by tir-s4's coding agent reading the actual merged code; fixed and merged same session.
2. **tir-s8** — tir-s5's shipped bulk-add reused the wrong GitHub API (`GET /user/orgs` instead of `GET /orgs/{org}/members`), making it a complete no-op in production despite its own tests passing (mocked with an unrealistic shape). Self-flagged by tir-s5's own coding agent, confirmed by direct code inspection, fixed and merged same session.

Both are recorded as **/improve candidates**: the pattern that caught them — a downstream story's coding agent reading upstream code as ground truth rather than trusting its passing tests — is worth promoting from an ad hoc session instruction into a standing convention.

---

## Full regression evidence

`node scripts/run-all-tests.js` re-run fresh against final master state (post tir-s8 merge, dependencies freshly installed): 321 files run, 69 failed — matching the documented pre-existing baseline (`tests/known-baseline-failures.json`, 73 entries, 5 now passing, 1 crossing the documented Windows/Linux CI split). Zero new regressions attributable to this epic.

---

**Next step:** Resolve tir-s6's open `DATABASE_URL` action, then this feature is fully ready for `/release`.
