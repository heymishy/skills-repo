# Contract Proposal: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**What will be built:**
`products.js`'s "New feature" button (currently a single-click form at line ~610) replaced with a small confirm form/modal presenting the same two radio options `/journey`'s own form already has (`startSkill=ideate` / `startSkill=discovery`). `handlePostProductFeature` extended to branch on the submitted `startSkill` exactly as `handlePostJourney` already does — registering the session under the chosen skill and redirecting accordingly — while preserving its existing `productId`-setting behaviour.

**What will NOT be built:**
Any redesign of `/journey`'s own existing choice form. Any change to `/ideate` or `/discovery`'s own downstream behaviour once entered.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | E2E: click New feature, confirm choice UI appears before creation | E2E |
| AC2 | Integration: POST with startSkill=ideate, confirm ideate session + productId | Integration |
| AC3 | Integration: POST with startSkill=discovery, confirm discovery session + productId | Integration |
| AC4 | Integration: confirm new feature appears in product's own list after rough-idea path | Integration |
| AC5 | Integration: existing /journey tests re-run unmodified | Integration |

**Assumptions:**
Either duplicating the `startSkill` branch in `handlePostProductFeature` or extending `handlePostJourney` to accept an optional `productId` are both acceptable implementation paths — the coding agent chooses based on which produces less duplication, documented in `decisions.md`.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, possibly `src/web-ui/routes/journey.js` (if `handlePostJourney` is extended instead of duplicated).
Services: journey store.
APIs: `POST /products/:id/features` (extended request shape — new `startSkill` field).
