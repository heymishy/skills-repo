## Test Plan: Resolve journey.js's local artefact writes to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.4.md
**Epic reference:** artefacts/2026-07-14-product-repo-config/epics/epic-2-full-config-and-bootstrap.md
**Test plan author:** Copilot
**Date:** 2026-07-14

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Artefact write goes to the product's repo via Contents API, not disk | — | 1 test | — | — | — | 🟢 |
| AC2 | Postgres backup write unchanged | — | 1 test | — | — | — | 🟢 |
| AC3 | No repo configured → rejected before session starts | — | 1 test | — | — | — | 🟢 |
| AC4 | Each write is its own commit (granularity — see note below) | — | 1 test | — | — | — | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| AC4's "one commit per write" is ambiguous about write granularity (per `/review` finding 1-M1, run 1) | AC4 | Untestable-by-nature (as literally worded) | "Each write" could mean per-keystroke-autosave or per-session — different implementations would both satisfy the literal wording | This test plan adopts a specific interpretation (one commit per completed, named artefact file — e.g. `discovery.md`, a story file — not per intermediate autosave) as the working assumption. **This should be confirmed via `/decisions` RISK-ACCEPT or the story's AC4 tightened to state this explicitly before `/definition-of-ready`** — flagged here, not silently decided unilaterally. |

---

## Test Data Strategy

**Source:** Synthetic — mocked Contents/Git Data API; mocked `journey-store-pg.js` pool for the Postgres backup assertion.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A skill-run fixture that produces artefact content (e.g. a discovery.md string) | Synthetic | None | |
| AC2 | Mocked `journey-store-pg.js` `saveArtefact` call, asserted alongside the git write | Synthetic | None | |
| AC3 | Product fixture with null repo columns | Synthetic | None | |
| AC4 | A multi-stage skill-run fixture producing 2+ named artefact files across one session | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

⚠️ **TEST DATA GAP (informational):** AC4's exact commit-granularity target depends on the interpretation resolution noted in Coverage gaps above.

---

## Unit Tests

None.

---

## Integration Tests

### Artefact write goes through the Contents/Git Data API, not fs.writeFileSync

- **Verifies:** AC1
- **Components involved:** `journey.js`'s artefact-write call sites, mocked Contents/Git Data API, product fixture with connected repo
- **Precondition:** A skill run reaches the point of writing `discovery.md`
- **Action:** Trigger the write
- **Expected result:** The mocked Contents/Git Data API records a commit containing the artefact content; no `fs.writeFileSync` call occurs for this path (spy on `fs.writeFileSync`, assert zero calls for the artefact path — the rest of `journey.js`'s non-artefact filesystem usage, if any, is out of scope for this assertion)

### Postgres backup write still happens alongside the git write

- **Verifies:** AC2
- **Components involved:** `journey.js`, mocked `journey-store-pg.js`'s `saveArtefact`
- **Precondition:** Same as AC1
- **Action:** Trigger the write
- **Expected result:** Both the mocked Contents API call AND the mocked `saveArtefact` call are recorded — the Postgres backup is unchanged by this story, not replaced

### No repo configured blocks the skill session before it starts, not partway through

- **Verifies:** AC3
- **Components involved:** Skill-session initiation logic, product fixture with null repo columns
- **Precondition:** Product has no repo configured
- **Action:** Attempt to start an outer-loop skill session for that product
- **Expected result:** Session initiation is rejected immediately with a "no repo configured" error — no partial session state is created, no artefact-write attempt occurs at all

### Each named artefact file produces its own commit (per the adopted interpretation)

- **Verifies:** AC4 (working interpretation — see Coverage gaps)
- **Components involved:** `journey.js`, mocked Contents/Git Data API
- **Precondition:** A skill-run fixture writes `discovery.md`, then later in the same session writes a story file
- **Action:** Trigger both writes
- **Expected result:** Two separate commits are recorded (not batched into one), and — per the adopted interpretation — no additional commits occur for intermediate autosave-style updates within writing a single file, if the implementation has such a concept

---

## NFR Tests

### Fail-closed on missing repo config, before session start

- **NFR addressed:** Security
- **Measurement method:** Same as AC3's integration test, asserted in isolation — zero session state created, zero API calls
- **Pass threshold:** Zero session/API artifacts
- **Tool:** Hand-rolled assertion

### Write latency change is observed, not silently ignored

- **NFR addressed:** Performance
- **Measurement method:** Time the mocked Contents API round-trip vs. a baseline `fs.writeFileSync` call, log the delta (informational — no hard threshold set per the story's own NFR section, which explicitly defers a numeric target until a real baseline exists)
- **Pass threshold:** N/A — informational only, per story NFRs
- **Tool:** Hand-rolled timing comparison, logged not asserted

---

## Out of Scope for This Test Plan

- Rewriting `journey.js`'s read-side logic — write-side only, per the story's own Out of Scope.
- Migrating already-in-flight sessions.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC4's commit granularity is an adopted interpretation, not yet confirmed by the operator | Ambiguity flagged at `/review` (1-M1, run 1) | Resolve via `/decisions` RISK-ACCEPT or tighten the story's AC4 wording before `/definition-of-ready` |
