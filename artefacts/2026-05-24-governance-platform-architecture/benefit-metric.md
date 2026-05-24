# Benefit Metric: Governance Platform Architecture — Close Structural Gaps

**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Date defined:** 2026-05-24
**Metric owner:** Hamis (Platform maintainer)
**Reviewers:** Hamis

---

## Product context

**Mission success outcomes this maps to:**
- Outcome 4: "Trust the governance output — a risk or compliance stakeholder reviewing the assurance trace can answer, without engineering assistance: what instruction set governed this action, which standards applied, which model produced the output, was the output validated, and was any regression detected."
- Outcome 5: "Improve the harness without breaking it — the improvement loop surfaces proposed SKILL.md diffs with failure evidence, rationale, and an anti-overfitting check."

Closing G2 (CI not calling shared enforcement package) and G3 (H-checks not wired to CI) directly strengthens Outcome 4: today the assurance gate passes if four files exist regardless of artefact quality. Closing the architecture documentation gaps (G1, G4) strengthens Outcome 5 by reducing the re-discovery bug cycle evidenced by asd.1, trw.1, and wuce.18.

**Roadmap alignment:** Horizon 1 — platform reliability and ADR-013 compliance completion. Phase 4 delivered the shared governance package; this feature closes the gaps that Phase 4 left open (ADR-013 partial compliance, untested CI inline JS, undocumented principles).

---

## Tier Classification

**⚠️ META-BENEFIT FLAG: Yes**

This is a platform internal reliability and compliance initiative, not a user-facing capability delivery. All metrics are Tier 2 (platform meta / process improvement) or Tier 3 (compliance obligations). There are no Tier 1 end-user product metrics — the users of this feature are platform operators, second-line risk functions, and future story authors.

---

## Tier 2: Meta Metrics (Platform Reliability and Process Improvement)

### M1: Architecture documentation coverage

| Field | Value |
|-------|-------|
| **Hypothesis** | Undocumented design principles cause re-discovery bugs. Documenting them explicitly reduces recurrence across new story authors and future agents. |
| **What we measure** | Number of enforcement-path design principles (P01-P15 from discovery) that have no canonical `standards/governance/` document referencing them |
| **Baseline** | 15 (all 15 principles identified in discovery have no standards file; only copilot-instructions.md contains some as inline rules) |
| **Target** | 0 — trace-contract.md (SC-01) and test-output-format.md (SC-04) written; all 15 principles have at least one canonical reference in `standards/governance/` or an ADR entry |
| **Minimum signal** | SC-01 and SC-04 complete and linked from CONTRIBUTING.md; the three highest-risk principles (P02 path traversal, P06 disk canonicity, P08 chain-hash) have explicit standards entries |
| **Measurement method** | Platform maintainer: manual count of principles with no standards reference at SC-01 / SC-04 DoD. Thereafter: any new principle added to copilot-instructions.md without a corresponding standards file is a gap. |

### M2: CI H-gate enforcement coverage

| Field | Value |
|-------|-------|
| **Hypothesis** | H1-H9 DoR gate checks are only evaluated at web UI gate-confirm time (journey.js). A DoR artefact mutated between gate-confirm and merge is not caught by CI. Wiring CLI validate to CI closes this gap and makes governance claims about DoR quality verifiable in CI. |
| **What we measure** | Count of H-gate checks (H1-H9, 9 total) re-evaluated by CI on every PR push |
| **Baseline** | 0 of 9 — CI assurance gate currently evaluates 4 structural file-existence checks; H1-H9 are never called from the CI path |
| **Target** | 9 of 9 — all H-checks re-evaluated on every PR push to master (SC-03 complete) |
| **Minimum signal** | 3+ H-checks wired and passing on 10 consecutive PRs with no false-positive rejections; gate produces a named-check verdict for each wired H-check rather than a single boolean |
| **Measurement method** | CI run results: platform maintainer counts wired H-check assertions at SC-03 DoD; ongoing via CI pass/fail on each PR |
| **Feedback loop** | If SC-03 produces false-positive rejections on more than 1 in 20 PRs, the DoR path resolution logic (A3) requires re-design before the full 9-check wiring is completed |

### M3: Architecture blind-spot recurrence rate

| Field | Value |
|-------|-------|
| **Hypothesis** | The asd.1 (4 bugs), trw.1, and wuce.18 bugs all share the pattern: a principle was known in the code but not written down as an explicit constraint. Extracting inline workflow JS to tested modules (SC-07) closes the most persistent recurrence category. After Wave 1 and Wave 2 stories complete, no new bugs of the same pattern categories should appear. |
| **What we measure** | Count of post-merge bugs attributable to a pattern already documented in `workspace/learnings.md` (adding a new entry to an existing pattern category) |
| **Baseline** | 3 distinct bug pattern categories documented: (1) inline-JS blind spot (4 bugs), (2) path-resolution-without-guard, (3) DoR-contract-contradiction |
| **Target** | 0 new entries in any of the three documented categories for 6 consecutive months after all Wave 1 and Wave 2 stories complete |
| **Minimum signal** | No new inline-JS pattern bug (category 1, the most prolific) for 3 consecutive feature deliveries after SC-07 merges |
| **Measurement method** | Platform maintainer at each `/improve` session: check learnings.md for new entries with matching pattern category |

---

## Tier 3: Compliance and Risk-Reduction Metrics

### M4: ADR-013 compliance — shared package as single gate authority (addresses G2 + G6)

| Field | Value |
|-------|-------|
| **Obligation source** | ADR-013 (`.github/architecture-guardrails.md`): "No surface adapter reimplements governance logic independently. All surface adapters call the shared governance package for resolveSkill, verifyHash, evaluateGate, advanceState, and writeTrace." |
| **Metric** | Whether `run-assurance-gate.js` delegates to `governance-package.evaluateGate` for all gate type evaluation (binary: compliant / non-compliant) |
| **Baseline** | Non-compliant — `run-assurance-gate.js` has an independent `checkResults` function not routed through `governance-package`. `evaluateGate` is defined in the shared package with support for 4 gate types but is not called from the CI path. |
| **Target** | Compliant — `evaluateGate` called from `run-assurance-gate.js` for all gate types including the new `structural` gate type (SC-02) |
| **Validated by** | Platform maintainer code review at SC-02 DoD; a test asserting `governance-package` is imported by `run-assurance-gate.js` and `evaluateGate` is invoked for at least one gate check |
| **Sign-off required at DoR** | Yes — SC-02 touches two high-churn files; DoR must include an explicit review of the evaluateGate interface before implementation begins |

### M5: Path traversal attack surface in CI comment path (addresses G7)

| Field | Value |
|-------|-------|
| **Obligation source** | OWASP A01 path traversal guard (`copilot-instructions.md` "Path traversal guard for disk writes (ougl)"): "Any route handler that writes a file to disk at a path derived from request data MUST validate the resolved path before writing." Extended to any `readFileSync` call where path derives from external data (manifest JSON). |
| **Metric** | Count of manifest-supplied file paths reaching `fs.readFileSync` without `path.resolve(p).startsWith(repoRoot + path.sep)` validation in the CI audit comment path |
| **Baseline** | 1 confirmed — `assurance-gate.yml` line 260: `fs.readFileSync(sourcePath)` where `sourcePath` comes from `manifest.json` content with no path traversal guard. The walk-fallback path is safe (constrained to `artefacts/${slug}/`) but manifest-loaded paths are not. |
| **Target** | 0 |
| **Minimum signal** | SC-07 complete (JS extracted to module) + SC-06 guard in place + a test asserting that a traversal path (`../../../etc/passwd`) returns a warning without reading the file and without throwing an unhandled exception |
| **Validated by** | Security review (platform maintainer) at SC-06 DoD; grep check pattern `readFileSync(sourcePath)` returns zero results without a preceding `startsWith` assertion |
| **Sign-off required at DoR** | Yes |

---

## Metric Coverage Matrix

| Metric | Story candidates that move it | Coverage status |
|--------|-------------------------------|-----------------|
| M1: Architecture documentation coverage | SC-01, SC-04 | Covered (Wave 1) |
| M2: CI H-gate enforcement coverage | SC-03 | Covered (Wave 2) |
| M3: Architecture blind-spot recurrence rate | SC-07, SC-01, SC-04 | Covered (Wave 1 + Wave 2) |
| M4: ADR-013 compliance — shared gate authority | SC-02 | Covered (Wave 3) |
| M5: Path traversal attack surface — CI comment | SC-07, SC-06 | Covered (Wave 2) |

Note: SC-05 (`skills init`) moves G5 (feature initialisation gap) which closes a usability gap. It is not assigned a standalone metric — the benefit is captured by M3 (reduces the class of workarounds that produce deviations from expected patterns) and M1 (the `skills init` pattern should be documented in the trace contract as part of feature lifecycle).

---

## Priority signal

M2 (CI H-gate coverage, G3) and M4 (ADR-013 compliance, G2) are the highest governance value metrics. Together they represent the same structural gap: the assurance gate passes if four files exist, regardless of artefact quality. SC-02 and SC-03 are the stories that close this. Both are Wave 3 and Wave 2 respectively, gated behind prerequisites. Their priority relative to Wave 1 stories is clear: Wave 1 stories (SC-01, SC-04, SC-05) should be dispatched first as they unblock SC-03 and SC-02, but their own value does not exceed M2/M4.

M5 (path traversal, G7) is a confirmed security finding. SC-06 + SC-07 close it. These are Wave 2 and should follow SC-01/SC-04.

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
