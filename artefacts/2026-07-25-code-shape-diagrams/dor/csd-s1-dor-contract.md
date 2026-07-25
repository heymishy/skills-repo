## Contract Proposal — Prove the canvas diagram mechanism with a real data-model example

**What will be built:** A new `diagram` content-block case in the `/ideate` canvas's block-type dispatch (`src/web-ui/`), wired to a mermaid rendering call with `securityLevel` locked down; one hand-authored 5+-entity fixture used to prove legibility.

**What will NOT be built:** Any skill-side generation logic (fixture content is hand-authored, not agent-produced); any diagram type other than Data Model.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Render fixture payload, assert rendered element present, not raw text | Unit |
| AC2 | Playwright screenshot assertion on the 5+-entity fixture | E2E |
| AC3 | Re-run existing canvas fixtures unmodified, confirm no regression | Integration |
| AC4 | Source inspection confirming same dispatch pattern as existing block types | Unit |

**Assumptions:** Mermaid can be added as a new client-side dependency — the zero-new-npm-dependency constraint has already been explicitly relaxed for this feature (see discovery.md, decisions.md).

**Estimated touch points:**
Files: `src/web-ui/routes/*.js` (or wherever canvas rendering currently lives), `src/web-ui/public/*` (client-side mermaid initialisation)
Services: None
APIs: None
