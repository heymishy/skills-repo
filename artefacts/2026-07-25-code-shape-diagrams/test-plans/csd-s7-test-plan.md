## Test Plan: As-built System Architecture diagram generation via static service-call detection

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s7-as-built-system-architecture-diagram.md
**Epic reference:** artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md
**Test plan author:** Copilot
**Date:** 2026-07-26

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Detects allowlisted `require()` calls, resolves to service names | 3 tests | — | — | — | — | 🟢 |
| AC2 | Renders as mermaid flowchart matching `parseFlowchartMermaid()`'s expected shape | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Zero services found produces empty-edges flowchart, not an error | 1 test | — | — | — | — | 🟢 |
| AC4 | Written as versioned artefact file, reusing csd-s5's convention | — | 1 test | — | — | — | 🟢 |
| AC5 | Real end-to-end compatibility with `drift-comparator.js`'s `compareSystemArchitecture()`, no comparator changes | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 5 ACs are fully coverable by unit/integration tests — this is static file analysis with no browser/CSS-layout dependency, unlike csd-s1/csd-s2's rendering-side ACs.

---

## Test Data Strategy

**Source:** Real files in this repo (`src/web-ui/server.js` and other real files with real `require()` calls to allowlisted packages) plus hand-authored synthetic fixtures for the zero-services edge case (AC3) and a case with 2+ distinct services to prove multi-edge detection.
**PCI/sensitivity in scope:** No — the generator only extracts package names and requiring file paths, never surrounding code content (see NFR-Security below).
**Availability:** Available now — this repo's own `server.js` already contains real `require('stripe')`, `require('pg')`, plus `stripe-client.js`/`posthog-server.js`/`journey-store-pg.js` as consuming modules.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real file with 2+ allowlisted requires | `src/web-ui/server.js` (real, already contains `require('stripe')`, `require('pg')`, `require('./adapters/session-redis')`-style patterns) | None | Cross-check output against an independent regex scan of the same real file, same pattern as csd-s5's `callGraphExtractionReflectsRealMergedCodeStructure` test |
| AC2 | Parseable mermaid flowchart output | Generator's own output, fed back into `drift-comparator.js`'s real `parseFlowchartMermaid()` | None | |
| AC3 | A fixture file/directory with zero allowlisted requires | Hand-authored fixture under `tests/fixtures/csd-s7/` | None | |
| AC4 | A test feature slug's artefact folder | Same pattern as csd-s5's `TEST_FEATURE_DIR`, cleaned up after the test run | None | |
| AC5 | An as-designed System Architecture mermaid fixture (from csd-s3's documented marker shape) | Hand-authored, matching `skills/design/SKILL.md`'s "Canvas markers — System Architecture diagram" worked example shape | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### allowlistedRequiresDetectedAndResolvedToServiceNames (AC1)

- **Verifies:** AC1
- **Precondition:** A real file (`src/web-ui/server.js`) with known real `require('stripe')` and `require('pg')` calls
- **Action:** Run the detector against this real file
- **Expected result:** Both requires are detected and resolved to their service labels ("Stripe", "Postgres") — cross-checked against an independent regex scan of the same real file's actual text, not a hardcoded expectation
- **Edge case:** No

### nonAllowlistedRequiresIgnored (AC1)

- **Verifies:** AC1
- **Precondition:** A file with both an allowlisted require (`pg`) and non-allowlisted internal requires (e.g. `./modules/foo`)
- **Action:** Run the detector
- **Expected result:** Only the allowlisted require produces an edge; internal/relative requires are correctly ignored (that's Program Design's job, not this story's)
- **Edge case:** Yes — proves the allowlist boundary is respected, not just that detection works at all

### samePackageRequiredFromMultipleFilesProducesOneServiceNodeNotDuplicates (AC1, edge case)

- **Verifies:** AC1
- **Precondition:** Two different files both `require('pg')`
- **Action:** Run the detector across both files
- **Expected result:** A single "Postgres" service node exists in the output, with edges from both requiring files — not two duplicate service nodes
- **Edge case:** Yes

---

## Integration Tests

### generatedFlowchartParsesCorrectlyViaDriftComparatorsRealParser (AC2, AC5)

- **Verifies:** AC2, AC5
- **Components involved:** The new as-built System Architecture generator, `src/modules/drift-comparator.js`'s real (unmodified) `parseFlowchartMermaid()` and `compareSystemArchitecture()`
- **Precondition:** A real as-designed System Architecture mermaid fixture (matching csd-s3's documented marker shape) and this story's generated as-built output for a real file set
- **Action:** Feed both into `compareSystemArchitecture()` unmodified
- **Expected result:** The comparison runs end-to-end and returns a valid `{status, label, differences}` signal — proving genuine shape compatibility with zero changes to `drift-comparator.js`, not just that both diagrams look plausible in isolation

### asBuiltSystemArchitectureWrittenAsVersionedArtefactFile (AC4)

- **Verifies:** AC4
- **Components involved:** The new generator, `src/modules/migration-schema-parser.js`'s existing `writeAsBuiltDiagramArtefact()` (reused directly, not reimplemented)
- **Precondition:** A test feature slug with no prior diagram files
- **Action:** Generate and save an as-built System Architecture diagram, then generate a second one
- **Expected result:** Each call adds a new versioned file (`as-built-system-architecture-<timestamp>.json`) under `artefacts/<featureSlug>/diagrams/` — never overwrites, following csd-s5's exact convention

---

## NFR Tests

### zeroServicesFoundProducesValidEmptyFlowchartNotAnError (AC3, functional but grouped with NFR-adjacent robustness)

- **NFR addressed:** Reliability/robustness (no numeric NFR target — this is a functional edge case, included here since it's the story's one "does it fail gracefully" behaviour, matching csd-s5 AC4's spirit even though this story doesn't have a malformed-input failure mode of its own)
- **Measurement method:** Run the generator against a fixture directory with zero allowlisted requires; assert it returns a valid (if edge-less) flowchart structure, not a thrown error
- **Pass threshold:** No exception thrown; output is a syntactically valid `flowchart TD` mermaid string with zero edges
- **Tool:** Node `assert`-based test

### noCredentialOrSecretContentInGeneratedDiagram (NFR-Security)

- **NFR addressed:** Security
- **Measurement method:** Generate a diagram from `src/web-ui/server.js` (which contains real `process.env.STRIPE_SECRET_KEY`-style references nearby the require calls) and assert the generated mermaid output contains only service names and file paths — never environment variable names, key-like strings, or surrounding code content
- **Pass threshold:** Zero matches for credential-shaped patterns (`SECRET`, `_KEY`, `token=`, etc.) anywhere in the generated diagram output
- **Tool:** Node `assert`-based test, pattern-matching the generated string

### staticScanCompletesWithinNormalSessionTimeBudget (NFR-Performance)

- **NFR addressed:** Performance
- **Measurement method:** Run the detector across this repo's full real `src/` tree and measure elapsed time
- **Pass threshold:** Completes in under 5000ms (same budget as csd-s5's equivalent NFR test)
- **Tool:** Node `assert`-based test with `Date.now()` timing

### generationEventsAreLogged (NFR-Audit)

- **NFR addressed:** Audit
- **Measurement method:** Inject a test logger (same injectable-logger seam as csd-s5's `setLogger()`) and assert a success/failure event is recorded with feature slug, diagram type, and service count / error
- **Pass threshold:** Event recorded with all required fields on both success and failure paths
- **Tool:** Node `assert`-based test

---

## Out of Scope for This Test Plan

- Transitive D37-adapter-wiring resolution (tracing from route handler through adapter to eventual external require) — out of scope per the story itself; not tested since it's not built.
- Live network call verification — this is static analysis only; no test exercises an actual network call to Stripe/Postgres/etc.
- Extending the allowlist itself — the allowlist is fixed for this story; a future story extending it would need its own tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 5 ACs are fully automatable — no CSS-layout-dependent or external-dependency gaps exist for this story, unlike the epic's rendering-side stories | N/A |
