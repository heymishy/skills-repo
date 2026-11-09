## Epic: An incident goes from first signal to a confirmed fix, with context attached the whole way

**Discovery reference:** artefacts/2026-11-08-incident-triage-and-respond/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-incident-triage-and-respond/benefit-metric.md
**Slicing strategy:** User journey

Chosen because the four stories map directly onto the chronological path an incident actually takes: it happens and gets recorded (story 1), it gets triaged against prior incidents (story 2), it becomes visible to a human (story 3), and once fixed, the loop closes with a real confirmation (story 4). This is a workflow-heavy feature where sequence of interactions matters, which is exactly what user-journey slicing is for.

## Goal

When this epic is complete, a production incident (today: an ad-hoc, unstructured note in `workspace/state.json` like `productionErrorInvestigation`) instead creates a structured, durable record; that record is automatically scored against prior incidents' short structured summary/tags fields and gets a draft triage summary; the record and its triage are visible in the product detail page's consolidated features view; and once a fix for it reaches DoD via the existing short-track pipeline, the record is updated with a real confirmation — automated where initiative 2's detection exists, manual otherwise — closing a loop that today doesn't exist at all.

## Architecture constraints scan (Step 1.5)

`.github/architecture-guardrails.md` exists and was read. Relevant constraints:

- **`product/constraints.md` #9** (design-system compliance): only story 3 touches `src/web-ui/` — `hasDesignSystemTrack: true` required at DoR for that story only, not stories 1, 2, or 4.
- **`product/constraints.md` #11** (no persistent agent runtime): stories 1, 2, and 4 are triggered/bounded (created on demand, run as part of a CI job or short-track pipeline step) — never a standing watcher.
- **`product/constraints.md` #13** (structural governance preferred over instructional): story 1/2/4's test plans must assert a record or summary was actually created (e.g. a test asserting an incident record exists with a populated triage field), not just trust an instruction that it happened.
- **ADR-011 / Artefact-first**: the new `scripts/lib/incident-store.js` module requires this chain — satisfied by this epic.
- Verified directly in code before writing stories: `src/modules/drift-comparator.js`'s `_jaccard(aArr, bArr)` (lines 254–262) is a plain set-based Jaccard over two arrays, case-sensitive, no normalization — confirmed proven only against short column-name arrays (`_columnNames`), never prose, matching the discovery's own corrected design. **New finding beyond the discovery's own check**: `_jaccard` itself is NOT exported from `drift-comparator.js` (`module.exports` at line 518 lists only `DUPLICATE_SIMILARITY_THRESHOLD` "for focused unit testing only") — story 2 cannot literally import it as-is. Resolving this (export it, or extract it to a shared location) is now an explicit story 2 AC, not an assumed-free reuse.
- `workspace/` files are non-governed per CLAUDE.md — can be committed directly to master, consistent with how `capture-log.md` and `state.json` are already handled. The new incident store (`workspace/incidents.json`) follows the same convention.
- For story 3's web UI rendering to work, the incident store must be fetchable from a connected repo via GitHub's Contents API — the same `fetchRepoPath` primitive (`src/web-ui/adapters/artefact-fetcher.js`) initiative 1's story 3 (`urpv-s3`) already established for `decisions.md`. `workspace/incidents.json` being git-tracked and committed (not gitignored) is what makes this possible — an explicit design requirement, not incidental.

No guardrail here is a blocker before decomposing.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    STORE[scripts/lib/incident-store.js]\n    FILE[workspace/incidents.json]\n    DC[src/modules/drift-comparator.js\\n_jaccard, newly exported]\n    TRIAGE[itar-s2: triage drafting]\n    FETCH[artefact-fetcher.js\\nfetchRepoPath]\n    PV[products.js\\n_renderConsolidatedFeaturesSection]\n    STP[short-track pipeline\\n/test-plan..coding agent..DoD]\n    STORE --> FILE\n    TRIAGE --> STORE\n    TRIAGE --> DC\n    FETCH --> FILE\n    FETCH --> PV\n    STORE -->|itar-s4: handoff| STP\n    STP -->|itar-s4: post-fix confirm| STORE"}}---

## Out of Scope

- **Fix implementation itself** — uses the existing short-track pipeline unchanged.
- **Automated alert generation** — initiative 2's job; this epic consumes alerts once they exist, or manual reports until then.
- **The rest of initiative 1's visibility surface beyond incident records** — story 3 builds the first slice only.
- **Long-term/delayed re-measurement of whether a fix held** — initiative 5's post-DoD follow-through territory.
- **Automated incident classification, severity scoring, or auto-escalation** — story 2 drafts for human review only.
- **Matching against raw free-text `decisions.md` prose** — confirmed in discovery and re-confirmed above: no stopword/tokenization tooling exists in this repo; structured-field matching only.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Incident record mechanism | 0 structured records exist — only one ad-hoc note (`productionErrorInvestigation`) | Every new investigation creates a structured record, zero new ad-hoc notes | Story 1 |
| Triage drafting | 0% get an auto-drafted summary today | 100% of new records get a drafted attempt | Story 2 |
| Web UI rendering existence | 0 incident records visible anywhere | Render ≥1 real record end-to-end | Story 3 |
| Handoff + post-fix confirmation | 0% of fixes get post-deploy confirmation today | 100% of incidents reaching a merged fix get a confirmation status | Story 4 |

## Stories in This Epic

- [ ] Incident record mechanism — itar-s1
- [ ] Triage drafting via structured-field Jaccard matching — itar-s2
- [ ] Web UI rendering — first slice of initiative 1's visibility surface — itar-s3
- [ ] Handoff to short-track pipeline + post-fix confirmation — itar-s4

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches production-incident handling and a shared web-ui surface (story 3) — not regulated, but a mistake in triage-matching or confirmation logic could mislead a real incident response, warranting human PR review before merge.

## Complexity Rating

**Rating:** 2
**Rationale:** Most mechanisms (Jaccard primitive, GitHub-contents fetch, short-track pipeline) already exist — this is substantially new wiring around proven primitives, not new infrastructure. Rated 2 rather than 1 because story 2's export/extraction of `_jaccard` and story 4's dual automated/manual confirmation path both carry real, bounded design decisions.

## Scope Stability

**Stability:** Stable
**Rationale:** Every assumption behind this MVP (matching feasibility, post-fix confirmation fallback, story 3's ownership) was verified with real code or resolved by explicit decision during /clarify, and the one remaining citation gap (benefit-metric.md's stale `kanban-view.js` reference) was caught and corrected during this /definition session.
