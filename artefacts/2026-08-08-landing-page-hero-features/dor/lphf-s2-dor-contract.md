## Contract Proposal — Scope-contract enforcement hero card

**What will be built:**
A static hero card in `src/web-ui/templates/landing.html`: headline, one supporting sentence, and a concrete visual example (e.g. a small before/after illustration of a locked file-touchpoint list checked against a merged diff). Pure HTML/CSS content, no new JS behaviour.

**What will NOT be built:**
Any interactive or live demonstration of the scope-contract mechanism (that's `lphf-s1`'s job); any link to the real assurance-gate source code.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert headline, sentence, and example elements present | Unit |
| AC2 | Assert copy contains the concrete mechanism terms, absent generic marketing phrases | Unit |
| AC3 | Playwright viewport test at 320px/1280px, assert no horizontal overflow | E2E |

**Assumptions:**
None beyond what's stated in the story.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`, `tests/check-lphf-s2-*.js` (new), `tests/e2e/lphf-s2-*.spec.js` (new). Services: none. APIs: none.
