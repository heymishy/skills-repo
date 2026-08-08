## Contract Proposal — Cryptographic instruction-set verification hero card

**What will be built:**
A static hero card: headline, one supporting sentence, and an illustrative hash value paired with its corresponding instruction-set file name (a real value from this repo's own trace history, or clearly labelled illustrative).

**What will NOT be built:**
An interactive hash-verification tool; a cryptography education section.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert headline, sentence, and hash+filename pairing present | Unit |
| AC2 | Assert copy contains "recomputable" or "independently verifiable", absent "trust us" | Unit |
| AC3 | Playwright viewport test at 320px/1280px | E2E |

**Assumptions:**
The illustrative hash value's sourcing (real trace history vs. clearly-marked illustrative) is left to the coding agent, constrained by the story's Architecture Constraints note that it must not look like a fabricated placeholder.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`, `tests/check-lphf-s3-*.js` (new), `tests/e2e/lphf-s3-*.spec.js` (new).
