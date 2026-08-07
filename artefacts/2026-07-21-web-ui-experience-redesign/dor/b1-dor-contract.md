**Contract Proposal — Remove dead nav links and add the missing Org board and Home List/Board toggle**

**What will be built:** Edit `NAV_ITEMS` in `html-shell.js` to remove Features/Actions/Status, add an Org board entry, and add a List/Board toggle sub-component under Home.

**What will NOT be built:** Any change to `/org/kanban` or `/dashboard?view=board`'s own rendering (already shipped by `kbc-s1`).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting NAV_ITEMS no longer contains the 3 dead ids | unit |
| AC2 | Playwright E2E test on the toggle | E2E |
| AC3 | Unit test asserting Org board entry exists | unit |
| AC4 | Integration test resolving every href against server.js's route table | integration |

**Assumptions:** None beyond what's already confirmed working (`/org/kanban`, `/dashboard?view=board` both live and tested by `kbc-s1`).

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js`
Services: None
APIs: None new
