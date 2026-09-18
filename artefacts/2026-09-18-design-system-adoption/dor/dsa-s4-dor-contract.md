# Contract Proposal: Restyle the Skill-Session Chat Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s4.md
**Date:** 2026-09-18
**Status:** Approved (Contract Review passed, no mismatches)

---

**What will be built:**
Restyle `src/web-ui/routes/skills.js`'s `_renderChatPage` function and `src/web-ui/views/chat-view.js`'s `renderChat` function to match `DESIGN.md`'s "Skill session" layout pattern — resizable two-pane layout, Focused/Chat segmented-control toggle, right pane varying by skill type. Token values applied throughout, reusing `dsa-s1`'s already-updated `html-shell.js` custom properties.

**What will NOT be built:**
Any functional/behavioral change to chat, journey-gate, sub-step affordances, or diagram mechanisms — pure-append/token-substitution discipline applies, matching the exact discipline `ep2-s3` already established and verified successful on this same file.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock, all skill-type variants) | Playwright: structural assertions across generic/`ideate`/`definition` sessions | E2E |
| AC4 (no regression) | Playwright: re-run 15 pre-existing specs (13 locally-runnable + 2 `@real-staging` named as residual risk) | E2E |

**Assumptions:**
`_renderChatPage`/`renderChat` are the real target functions (confirmed directly via this session's own `ep2-s3` work). `dsa-s1`'s token rename lands first.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js`, `src/web-ui/views/chat-view.js`. Services: none. APIs: none.
