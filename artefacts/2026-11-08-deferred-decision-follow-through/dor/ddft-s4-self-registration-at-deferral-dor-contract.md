## Contract Proposal — Self-registration at the moment of deferral

**What will be built:**
Three independent patches, each its own governed-file PR per CLAUDE.md's Platform change policy: (1) `skills/discovery/SKILL.md`'s `## State update — mandatory final step` section (line ~519) gets a sub-step: if the discovery artefact's Out of Scope section names something deferred, write a `deferred-item` record (`source: "discovery-out-of-scope"`) via `scripts/lib/incident-store.js`. (2) `skills/decisions/SKILL.md`'s equivalent section (line ~264) gets the same sub-step triggered by a logged `RISK-ACCEPT` entry (`source: "risk-accept"`). (3) `skills/definition-of-done/SKILL.md`'s Step 6 ("Metric signal") / State-update section (line ~274) gets the same sub-step triggered when a metric's signal is recorded as `not-yet-measured` (`source: "unmeasured-benefit-metric"`), carrying the metric name and operator-supplied evidence note as `revisitCondition`. None of the three skills' existing conversational flow, question ordering, or operator-facing prompts change — this is purely additive within each existing final-step section.

**What will NOT be built:**
Any change to the three skills' existing conversational flow, question ordering, or operator-facing prompts. Retroactive registration of any past deferral from before this story ships — new deferrals going forward only.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on the discovery hook's trigger condition; integration test running a real `/discovery` State-update with an Out-of-Scope entry and asserting a record was actually created, not just that instruction text was added (`product/constraints.md` #13) | unit + integration |
| AC2 | Unit test on the decisions hook's trigger condition; integration test running a real `/decisions` State-update after a logged `RISK-ACCEPT` and asserting a record was created | unit + integration |
| AC3 | Unit test on the definition-of-done hook's trigger condition (Step 6's `not-yet-measured` signal, NOT `/benefit-metric`); integration test running a real `/definition-of-done` Step 6 with a still-unmeasured metric and asserting a record was created with the metric name and evidence note as `revisitCondition` | unit + integration |
| AC4 | Integration test confirming all three hooks write via `ddft-s1`'s single `scripts/lib/incident-store.js`/`workspace/incidents.json` mechanism — no skill invents its own storage path | integration |
| AC5 | Process check: each of the three hooks' own test suite is run and asserted to pass independently of the other two — a passing test for one hook is never assumed to imply the other two also work. Documented as an Untestable-by-nature gap (🔴) in the verification script with a manual scenario, since this is a test-independence guarantee about the test suite's own structure, not a runtime behaviour | manual (process guarantee) |

**Assumptions:**
`ddft-s1`'s schema and `scripts/lib/incident-store.js` ship first (confirmed dependency). The three hook points (`skills/discovery/SKILL.md:519`, `skills/decisions/SKILL.md:264`, `skills/definition-of-done/SKILL.md:274`) remain stable at those approximate line numbers through this story's implementation — if another change lands first and shifts them, the implementer re-locates the `## State update — mandatory final step` section by heading text, not by hardcoded line number. Per the benefit-metric's own graduated minimum validation signal, at least 1 of the 3 hooks correctly self-registering in its next real run is the accepted rollout floor if full 3-skill coverage doesn't land in a single implementation pass — this does not reduce the AC set below, all 5 ACs remain required for DoR sign-off.

**Estimated touch points:**
Files: `skills/discovery/SKILL.md`, `skills/decisions/SKILL.md`, `skills/definition-of-done/SKILL.md`, `scripts/lib/incident-store.js` (read/called, not modified).
Services: none.
APIs: none.
