## Contract Proposal — Self-improving harness hero card

**What will be built:**
A static hero card: headline, one supporting sentence, and a real count of `workspace/learnings.md` entries pulled at implementation/build time (not hardcoded), and copy explicitly naming the human-review gate.

**What will NOT be built:**
Live-updating count after launch; improvement-agent-specific diff-count metrics (no reliable current count exists for these).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert displayed count matches a freshly-counted value from `workspace/learnings.md`, not a hardcoded literal | Unit |
| AC2 | Assert copy absent "live"/"right now"/"updating as you read this" | Unit |
| AC3 | Assert copy contains "human review" or "gated by" | Unit |
| AC4 | Playwright viewport test at 320px/1280px | E2E |

**Assumptions:**
"Pulled at implementation time" means the count is computed once at build/authoring time (matching the "no CMS" static-content convention), not on every request.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`, `tests/check-lphf-s4-*.js` (new), `tests/e2e/lphf-s4-*.spec.js` (new).
