# Decisions: keyboard-navigation E2E spec repair (wkrp-s1)

## D1. Update the spec to the nav that exists, not the nav to the spec (2026-11-21)

**Context:** `wuce18-keyboard-nav.spec.ts` waits for a "Run a Skill" nav link that pan-s1 removed from `NAV_ITEMS` on purpose (the `/skills` route remains; only the nav entry went). The sidebar's main section now holds Org board, Pod Manager, Signals and Journeys.
**Decision:** the spec's label list becomes those four labels; its mechanism and its second test are unchanged.
**Rationale:** the removal was a recorded product decision (pan-s1, `artefacts/2026-07-30-product-aware-navigation/decisions.md`), so the spec is the stale party. Listing the real links keeps the spec's purpose, that each main-section nav link is reachable by keyboard focus, and it fails if one is removed or renamed.
**Alternatives rejected:** restoring the nav row (reverses pan-s1); dropping the label list and testing "any nav link" (would no longer notice a missing link); deleting the spec (loses keyboard-reachability coverage of the nav).
**Operator go-ahead (2026-11-21, "OK"):** proceed to `wuce18` as the next spec after `bmau-s1`.
