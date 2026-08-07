**Contract Proposal — Settings page shell with Profile tab**

**What will be built:** A new `/settings` route rendering the shared shell with a tab container (Profile/Billing/Credits) and the Profile tab's content, reusing `handleGetLinkSettings`'s existing logic wrapped in the shell instead of its current bare HTML.

**What will NOT be built:** Billing/Credits tab content (C2/C3). Unlinking a provider.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test confirming shell markup present | unit |
| AC2 | Unit + integration test on Profile tab content | unit / integration |
| AC3 | Integration test on Link Google flow | integration |
| AC4 | Unit test on both-linked state | unit |

**Assumptions:** `handleStartGoogleLink`/`handleStartGithubLink`'s existing CSRF-state logic (`tir-s2`) is reused unmodified.

**Estimated touch points:**
Files: `src/web-ui/server.js` (new route registration), `src/web-ui/routes/account-linking.js` (wrap in shell), a new `src/web-ui/routes/settings.js`
Services: None new
APIs: None new — reuses existing account-linking routes
