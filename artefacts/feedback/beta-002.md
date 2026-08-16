# Beta Feedback: 2026-08-15/16 (second batch, same beta user)

**Source:** Real beta user (Abhijeet Singh, account `abhijeet-qsofte`), screenshot + 2 chat messages, timestamped 15/8.
**Related:** `artefacts/feedback/beta-001.md` (first batch, same beta user, same product — validated 2026-08-16).
**Status:** Validated against `skills-framework.fly.dev` on 2026-08-16 (Chrome, authenticated as heymishy via GitHub OAuth).
**Note on environment:** This feedback's screenshot is from `skills-framework.fly.dev`, a different Fly.io deployment than `wuce-staging.fly.dev` (beta-001's environment) — different database (0 learnings captured vs. 152), different account. Same underlying product/codebase ("Skills Platform — Governed Software Delivery" branding, identical `html-shell.js`-rendered nav on both). Confirmed genuinely distinct deployments, not a caching artefact.

---

## Signal 7: Org Kanban board — "can't progress anywhere from this screen"

**Reported:** Screenshot of `/dashboard?view=board` (the org-wide Kanban board, aggregating all products' stories by pipeline stage: discovery, benefit-metric, definition, review, test-plan, definition-of-ready, implementation...). Every column shows `0` and `—`. Message: "Looks like can't progress anywhere from this screen."

**Severity:** High (new-user onboarding dead end — this is plausibly the first non-trivial screen a brand-new account lands on).

**Validation:** Confirmed live. Navigated to the identical URL (`/dashboard?view=board`) as `heymishy` — my own account has real data in the `discovery` column (2 cards), so I could not reproduce the fully-empty state directly, but this reveals the actual root cause more precisely than the screenshot alone could: **this Kanban board view has no "create new" affordance anywhere on it, in any state** — not just when empty. There is no persistent "New feature"/"New product" button, no empty-state prompt, nothing. Compare to the individual product page (`/products/[id]`), which DOES have a clear, prominent "New feature" button plus a "Modules" creation form even when the product has zero features.

**Operator's own read, confirmed correct:** the beta user's board is empty because their account is genuinely new with nothing in flight yet — not a bug in what's being displayed. The bug is the absence of any guidance or action when that legitimate empty state is what a user sees. A new user has no way to know from this screen that they need to go create a Product first (via the sidebar's "+" next to PRODUCTS, or the Products list page) before anything will ever appear here.

**Fix shape (not yet scoped into a story):** Add an empty-state treatment to the org Kanban board — when every column is empty (or the org has zero products), show a prompt with a clear next action (e.g. "No features yet across your organisation — create a product to get started" + a button linking to product creation), matching the pattern the product page already uses. Scope question for `/definition`: should this trigger on "zero products" specifically, or "zero cards in any column" (an org with products but nothing yet through discovery)? Recommend the latter — matches the literal screenshot.

---

## Signal 8: "Submit your issue type of module for self triage"

**Reported:** "Worth building, submit your issue type of module for self triage."

**Severity:** Not a bug — a feature suggestion.

**Read:** The beta user is suggesting the product itself should have a built-in feedback/issue submission flow, letting users self-report and self-triage problems from inside the app — rather than the current path (messaging Hamish directly in chat, who then triages it manually, which is exactly the process this artefact and beta-001 are a product of). This is a legitimate, somewhat meta product idea: an in-app "Report an issue" or "Submit feedback" module.

**Not validated against the live product** — this is a request for something that doesn't exist yet, not a claim about existing behaviour. No Chrome check applicable.

**Recommendation:** This is a `/discovery`-shaped idea (new capability, not a bounded bug fix) — worth a real discovery pass if pursued, not a short-track fix. Do not start building without scoping first: worth asking whether this belongs in wuce/Skills itself (an in-product feedback widget) or is better served by directing beta users to an existing external channel (e.g. a GitHub issue template) — the two have very different build costs and the second may already satisfy 80% of the value at near-zero cost.

---

## Cross-reference to beta-001

Signal 7 is a distinct root cause from beta-001's signals #3/#4 (nav icon affordance) and #1/#6 (billing portal 500) — different page, different mechanism (missing empty-state CTA vs. broken redirect vs. icon-shape mismatch). Not the same underlying bug wearing different words, unlike #1/#6 or #3/#4 in beta-001.

---

## Updated fix-target count across both batches

1. Billing portal 500 error (beta-001 #1/#6) — **in progress**, dispatched to a background agent (`bpe-s1`).
2. Nav icon affordance (beta-001 #3/#4) — **in progress**, dispatched to a background agent (`nia-s1`).
3. Mobile compatibility (beta-001 #2) — not yet investigated, needs a dedicated pass.
4. Settings improvement (beta-001 #5) — blocked on a follow-up question to the beta user.
5. Org Kanban board empty-state CTA (beta-002 #7) — **new**, not yet scoped into a story. Short-track candidate — bounded, well-understood once the discovery-vs-zero-products scope question above is answered.
6. In-app feedback/issue submission module (beta-002 #8) — **new**, feature idea, needs a real `/discovery` pass if pursued, not short-track.
