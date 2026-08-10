## Definition of Ready: mds-s1 — Add a richer mock-gateway scenario covering every diagram type a skill session can legitimately emit

**Story:** artefacts/2026-08-10-mock-diagram-showcase-fixtures/stories/mds-s1-diagram-showcase-mock-scenario.md
**Review artefact:** artefacts/2026-08-10-mock-diagram-showcase-fixtures/review/mds-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-mock-diagram-showcase-fixtures/test-plans/mds-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- New: `tests/e2e/fixtures/llm-gateway/ideate.diagram-showcase.json`
- New: `tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json`
- New: `tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json`
- New test file: `tests/check-mds-s1-diagram-showcase-fixtures.js`

**Files explicitly out of scope (must not be touched):**
- `tests/e2e/fixtures/llm-gateway/ideate.success.json`, `ideate.failure.json`, `design.success.json`, `definition.success.json`, `definition.failure.json` — must remain byte-identical (AC4).
- `src/web-ui/modules/mock-llm-gateway.js` — `getMockResponse`/`inventoryFixtures`/`_loadFixtureFile` already support arbitrary `scenarioName` values with zero code changes; nothing here needs modification.
- `src/web-ui/routes/skills.js`, `src/web-ui/routes/journey.js` — the rendering/extraction path is already correct (`drh-s1`); this story adds test data only.

### Architecture Constraints

No new architectural decision — reuses the existing `scenarioName` mechanism exactly as `success`/`failure` already do. No ADR required.

### Human oversight

**Low** — purely additive fixture data plus tests; zero production code changes, zero risk to existing behaviour beyond the explicit AC4 non-regression check.

### Coding Agent Instructions

1. Create `tests/e2e/fixtures/llm-gateway/ideate.diagram-showcase.json`:
   ```json
   {
     "stage": "ideate",
     "scenarioName": "diagram-showcase",
     "model": "mock",
     "response": "Let's map out the opportunity space, then look at how competitors compare, then summarise what we've found.\n\n**Lens A -- Opportunity map**\n\n---CANVAS-JSON: {\"type\":\"cluster-tree\",\"title\":\"Opportunity map\",\"content\":{\"clusters\":[\"Speed problem: manual QA takes 3 days per release\",\"Visibility problem: no single dashboard for release health\",\"Trust problem: stakeholders don't see test coverage until launch day\"]}}---\n\n**Lens B -- Competitor feature comparison**\n\n---CANVAS-JSON: {\"type\":\"table\",\"title\":\"Competitor feature comparison\",\"content\":{\"headers\":[\"Feature\",\"Us\",\"Competitor A\",\"Competitor B\"],\"rows\":[[\"Automated QA gate\",\"No\",\"Yes\",\"No\"],[\"Release dashboard\",\"No\",\"No\",\"Yes\"],[\"Coverage visibility\",\"No\",\"Partial\",\"Yes\"]]}}---\n\n**Lens C -- Summary**\n\n---CANVAS-JSON: {\"type\":\"text\",\"title\":\"Market scan summary\",\"content\":{\"paragraphs\":[\"No competitor offers all three capabilities together -- automated QA gating, a release dashboard, and coverage visibility.\",\"This is a real, validated gap: two of three competitors surveyed have at most one of these three capabilities.\"]}}---\n\nLet me know if any of these resonate, or if there's a different angle you'd like to explore next.",
     "usage": { "input_tokens": 420, "output_tokens": 310 }
   }
   ```
2. Create `tests/e2e/fixtures/llm-gateway/design.diagram-showcase.json`:
   ```json
   {
     "stage": "design",
     "scenarioName": "diagram-showcase",
     "model": "mock",
     "response": "Here's the proposed architecture and data model for this feature.\n\n---CANVAS-JSON: {\"type\":\"system-architecture\",\"title\":\"System Architecture\",\"content\":{\"mermaid\":\"flowchart TD\\n    WEBUI[Web UI]\\n    RELEASESVC[Release Gate Service]\\n    POSTGRES[(Postgres)]\\n    CISVC[CI Pipeline]\\n    WEBUI --> RELEASESVC\\n    CISVC --> RELEASESVC\\n    RELEASESVC --> POSTGRES\"}}}---\n\nAnd the data model this story needs:\n\n---CANVAS-JSON: {\"type\":\"data-model\",\"title\":\"Data model\",\"content\":{\"mermaid\":\"erDiagram\\n    RELEASE_GATE {\\n        uuid id PK\\n        text feature_slug FK\\n        text status\\n        timestamptz evaluated_at\\n    }\\n    COVERAGE_SNAPSHOT {\\n        uuid id PK\\n        uuid release_gate_id FK\\n        integer passing\\n        integer total\\n    }\\n    RELEASE_GATE ||--o{ COVERAGE_SNAPSHOT : \\\"has\\\"\"}}}---\n\nLet me know if this matches your expectations before I proceed.",
     "usage": { "input_tokens": 380, "output_tokens": 260 }
   }
   ```
   Note: escape the mermaid content's own internal quotes/newlines exactly as valid JSON (the coding agent should validate with `JSON.parse` before committing, not hand-verify escaping visually).
3. Create `tests/e2e/fixtures/llm-gateway/definition.diagram-showcase.json`:
   ```json
   {
     "stage": "definition",
     "scenarioName": "diagram-showcase",
     "model": "mock",
     "response": "Proceeding with the full definition.\n\n---CANVAS-JSON: {\"type\":\"program-design\",\"title\":\"Program Design\",\"content\":{\"mermaid\":\"flowchart LR\\n    ROUTE[routes/release-gate.js]\\n    SVC[modules/release-gate-evaluator.js]\\n    STORE[adapters/release-gate-store.js]\\n    ROUTE --> SVC\\n    SVC --> STORE\"}}}---\n\n---CANVAS-JSON: {\"type\":\"data-model\",\"title\":\"Data model\",\"content\":{\"mermaid\":\"erDiagram\\n    RELEASE_GATE {\\n        uuid id PK\\n        text feature_slug FK\\n        text status\\n    }\\n    COVERAGE_SNAPSHOT {\\n        uuid id PK\\n        uuid release_gate_id FK\\n    }\\n    RELEASE_GATE ||--o{ COVERAGE_SNAPSHOT : \\\"has\\\"\"}}}---\n\n---ARTEFACT-START---\n# Definition: Release Gate\n\n**Status:** Approved (mock fixture -- mds-s1)\n\n# Epic 1: Release Gating\n\n## Stories in this epic\n- rg.1\n\n# Story rg.1 -- Evaluate release gate on CI completion\nComplexity: 1\n\nAC1: Fixture-driven definition completes deterministically.\n---ARTEFACT-END---\n---SLUG---\n2026-08-10-release-gate-mock-fixture",
     "usage": { "input_tokens": 410, "output_tokens": 290 }
   }
   ```
4. Write `tests/check-mds-s1-diagram-showcase-fixtures.js` with the 6 tests per the test plan (3 unit marker-count tests, the AC4 checksum test, the AC5 inventory test, and the 3 AC6 integration tests via `handleGetJourneyStageView`) — reuse `check-drh-s1-resume-history-diagram-rendering.js`'s journey-fixture helper pattern (`makeCompletedJourneyFixture`, `journeyRoutes.setGetTurnsForStage`) for the AC6 tests.
5. Run the new test file plus `check-drh-s1-resume-history-diagram-rendering.js`, `check-a3-ideate-artefact-disk-match.js`, `check-bri-s3.1-mock-llm-gateway.js` unmodified — zero regression, and specifically confirm `check-a3-ideate-artefact-disk-match.js`'s exact-one-marker assertion still passes untouched.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — fixture data + server-side rendering checks only, no new layout)

**PROCEED: Yes**
