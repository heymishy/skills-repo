**Contract Proposal — Restructure account-level nav items and add a dangling-link regression test**

**What will be built:** Move Settings/Admin credits into a distinct bottom-of-sidebar section in `html-shell.js`; add a new structural test asserting every `NAV_ITEMS` href resolves to a registered route.

**What will NOT be built:** The Settings page's own content (Epic C).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on non-admin sidebar rendering | unit |
| AC2 | Unit + integration test on admin sidebar + live role check | unit / integration |
| AC3 | Unit test — the new structural test itself | unit |
| AC4 | Unit test — running the new test against a pre-fix fixture, confirming it fails | unit |

**Assumptions:** None.

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js`
Services: None
APIs: None new
