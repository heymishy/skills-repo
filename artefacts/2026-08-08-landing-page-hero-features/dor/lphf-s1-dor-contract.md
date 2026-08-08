## Contract Proposal — Golden trace demo

**What will be built:**
A new hero section in `src/web-ui/templates/landing.html` rendering 4 sequential frames (prompt → discovery.md snippet → DoR snippet → shipped feature). Frame content for both candidates (`interactive-kanban-boards`/`s3.1` and `code-shape-diagrams`/`csd-s2`) is authored as literal content, gated behind a single, simple build-time selector (e.g. a constant at the top of `templates/landing.html` or a small sibling content file interpolated once when `routes/public.js` reads the template at module init) — not a runtime env-var toggle requiring redeployment logic, and not a CMS. Keyboard-navigable markup (proper DOM order, no positive `tabindex`).

**What will NOT be built:**
Any live query against `pipeline-state.json` or GitHub; any visitor-facing "type your own idea" interactive flow; a general-purpose, reusable content-management capability that outlives this one decision (per D2 in `decisions.md`).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert exactly 4 frame elements present, in order | Unit |
| AC2 | Assert rendered content changes when the selector constant changes, for both candidates | Unit (x2) |
| AC3 | Pre-merge diff inspection confirming the losing candidate's content is absent | Manual |
| AC4 | Assert frame text is a substring/derivative of the real corresponding artefact file content | Unit |

**Assumptions:**
- The build-time selector mechanism (a single constant, not an interactive toggle) satisfies AC2's "flip a config value" requirement — the coding agent has latitude on exact implementation (a JS constant vs. a small data file) as long as it is not a live, redeployment-requiring, or CMS-like mechanism.
- `routes/public.js` reads `templates/landing.html` once at module init (`fs.readFileSync`) — any content-selection logic must resolve before or during that read, not per-request.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`, possibly a new small sibling content file (e.g. `src/web-ui/templates/golden-trace-content.js`) if literal inline editing proves unwieldy — coding agent's choice, `tests/check-lphf-s1-*.js` (new). Services: none. APIs: none.
