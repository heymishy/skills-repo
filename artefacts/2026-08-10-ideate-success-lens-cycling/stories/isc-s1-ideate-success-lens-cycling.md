## Story: Make the default mock-gateway /ideate scenario actually cycle through lenses, assumptions, conditions, and completion

**Epic reference:** None — short-track (test-infrastructure fix, found via a live Chrome-driven staging review)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator validating /ideate end-to-end on staging without spending real LLM tokens**,
I want **the default mock-gateway scenario to actually progress through multiple lenses, populate the assumptions and conditions panels, and let the session complete**,
So that **a mock-driven /ideate journey demonstrates the real feature instead of getting stuck on Lens A forever with no way to reach Discovery**.

## Benefit Linkage

**Metric moved:** Direct test-infrastructure gap (short-track, no formal benefit-metric artefact) — found via a live Chrome-driven staging review requested by the operator, who reported mocked data only shows the opportunity map with no way to switch lenses or reach discovery. Live-reproduced on `wuce-staging.fly.dev`: two real turns returned byte-identical content, the CONDITIONS/ASSUMPTIONS panels stayed empty, and there was no way to progress past Idea.

**How:** `mgtc-s1` (mock-gateway turn-index cycling) already shipped and is correctly wired end-to-end, but `tests/e2e/fixtures/llm-gateway/ideate.success.json` — the **default** scenario every real `/ideate` journey uses — was never migrated to `mgtc-s1`'s `responses` array format, so `turnIndex` had nothing to select between. `mds-s1` (already merged) does not fix this either: it added a separate `diagram-showcase` scenario a normal journey never selects, still as a single flat response, with no assumption/condition markers and no artefact-completion turn for `/ideate`.

## Architecture Constraints

- **`ideate.success.json` migrates to the `responses` array format** `mgtc-s1` already supports — no code change to `mock-llm-gateway.js` or `skill-turn-executor.js` is needed; both already read `turnIndex` correctly.
- **5 meaningful entries** (Lens A, Lens B, Lens C, Lens D, final artefact-completion), each authored per `skills/ideate/SKILL.md`'s own protocol: `---CANVAS-JSON:---` per lens (types per the skill's own type-per-lens table), `---ASSUMPTION-JSON:---` / `---CONDITION-JSON:---` markers where the skill's protocol calls for them, and a final `---ARTEFACT-START---`/`---ARTEFACT-END---` block conforming to `templates/ideation.md` so `session.done`/`lensComplete` can fire.
- **Real turns land only on even `turnIndex` values** (`history.length` grows by exactly 2 per real turn — one user entry, one assistant entry — and `icv-s1` already disabled the hidden auto-continue turn for `/ideate` specifically). Odd-index array slots are unreachable padding, filled with a duplicate of the preceding meaningful entry so every slot stays a validly-shaped fixture entry.
- **`design.success.json`, `definition.success.json`, `definition.failure.json` are untouched** — this story is `/ideate`-scoped only.
- **`mds-s1`'s own `diagram-showcase` fixtures are untouched** — separate scenario, separate purpose (diagram-type breadth, not lens-cycling), still valid.

## Dependencies

- **Upstream:** `mgtc-s1` (merged) — this story is the first fixture to actually adopt the `responses` array format it shipped.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given `getMockResponse('ideate', model, 'success', 0)`, When the response is inspected, Then it contains a `cluster-tree` CANVAS-JSON marker titled "Opportunity map" (Lens A) and at least one `---ASSUMPTION-JSON:---` marker.

**AC2:** Given `getMockResponse('ideate', model, 'success', 2)`, When the response is inspected, Then its content differs from turn 0's, and it contains at least one `---ASSUMPTION-JSON:---` marker and one `---CONDITION-JSON:---` marker (Lens B).

**AC3:** Given `getMockResponse('ideate', model, 'success', 4)` and `getMockResponse('ideate', model, 'success', 6)`, When the responses are inspected, Then each differs from every prior turn's content (Lens C, Lens D).

**AC4:** Given `getMockResponse('ideate', model, 'success', 8)` (or any `turnIndex >= 8`), When the response is inspected, Then it contains a valid `---ARTEFACT-START---`/`---ARTEFACT-END---` block conforming to `templates/ideation.md`'s section structure.

**AC5:** Given `getMockResponse('ideate', model, 'success', <any turnIndex beyond 8>)`, When called repeatedly, Then it always returns the same final (turn-8) entry — the scripted sequence clamps rather than throwing or returning undefined.

**AC6:** Given the existing `check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-mds-s1-diagram-showcase-fixtures.js`, and `check-bri-s3.1-mock-llm-gateway.js` test files, When run after this story's fixture change, Then all pass — updated only where they directly read the fixture's raw top-level shape (`fixture.response` → `fixture.responses[0].response`), with zero behavioural regression.

## Out of Scope

- **Wiring the canvas panel's A/B/C/D/E "pip" indicators to be clickable/interactive** — investigated during this story's live Chrome review; confirmed they are decorative progress indicators only (`block._lens` is read once in `skills.js` for pip-highlighting but never actually assigned anywhere in the codebase — a separate, pre-existing, unrelated gap, not part of this story's reported symptoms).
- **The canvas-block-duplication rendering behaviour** (repeated identical blocks not deduped) observed during the live review — a separate client-side rendering concern, not a mock-fixture-content gap; not touched here.
- **`design.success.json` / `definition.success.json` lens/turn cycling** — not reported as broken; out of scope unless a future review finds the same gap there.

## NFRs

- **Correctness:** Every new marker must be genuinely parseable by the existing, unmodified `parseCanvasBlock`/`extractCanvasBlocksFromTurns`/assumption/condition parsers — no new parsing logic introduced or needed.
- **Test isolation:** `design.success.json`, `definition.success.json`, `definition.failure.json`, and every `mds-s1` `diagram-showcase` fixture must remain byte-identical — verified by the existing checksum test (now scoped to exclude `ideate.success.json`, the one file this story deliberately changes).

## Complexity Rating

**Rating:** 1 — well-understood, fixture-content-only change plus two existing tests' raw-shape read sites updated to match; no new production code.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
