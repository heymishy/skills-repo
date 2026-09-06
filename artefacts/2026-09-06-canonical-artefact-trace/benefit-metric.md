## Benefit Metric: Canonical Artefact Trace

**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Date defined:** 2026-09-06
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner (solo project; same self-confirmation convention already used for this feature's own DoR-equivalent decisions this session)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a platform reliability fix with direct, measurable user (operator) impact, not a tooling/process validation exercise.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Registered-vs-disk divergence rate

| Field | Value |
|-------|-------|
| **What we measure** | The percentage of features in this repo where `pipeline-state.json`'s registered epic/story structure diverges from what's actually on disk under `artefacts/` (any of: zero registration, partial missing registration, orphaned epic-doc mismatch, or orphaned registration with no matching file) — measured by the same audit script used to establish the baseline this session. |
| **Baseline** | ~90 of 260 features (~35%), measured 2026-09-06 via direct audit. |
| **Target** | 0% net-new divergence for any feature touched by the canonical builder going forward. (Backfilling the existing ~90 is explicitly out of scope per discovery — this metric tracks new divergence, not the existing backlog.) |
| **Minimum validation signal** | The canonical builder ships and correctly renders `2026-04-19-skills-platform-phase4` (the specific 205-file, zero-registration case that motivated this feature) without introducing any new divergence itself. |
| **Measurement method** | Re-run the audit script post-ship; Hamish King reviews the delta. |
| **Feedback loop** | If new divergence is found post-ship, it's a canonical-builder bug (fix once, in the builder) — logged as a follow-up story, not a reason to roll back the feature. |

### Metric 2: Bugs of this class per session

| Field | Value |
|-------|-------|
| **What we measure** | Whether a future fix touching "what artefacts exist for a feature" logic modifies exactly one file (the canonical builder) or more than one (a sign a new independent derivation crept back in, violating ADR-028). |
| **Baseline** | 5 separately-fixed instances in one session (`bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`, `phase4`), each touching a different file. |
| **Target** | 0 future instances touching more than one file for this class of fix. |
| **Minimum validation signal** | The next real bug report in this area (if any) is fixed by editing only the canonical builder. |
| **Measurement method** | Manual review of the diff for any future fix in this area — Hamish King, at the time such a fix is made. |
| **Feedback loop** | If a future fix touches multiple files again, that's a signal ADR-028 isn't being followed or the builder's abstraction is wrong — triggers a re-scoping conversation, not silent acceptance. |

### Metric 3: Unregistered documents visible without a bug report

| Field | Value |
|-------|-------|
| **What we measure** | Whether an operator browsing a feature with incomplete `pipeline-state.json` registration sees an explicit visual flag on the affected document(s), versus the document silently vanishing into a generic bucket or degraded flat listing. |
| **Baseline** | 0% — every one of the 5 bugs this session required a human to notice and report a specific broken page; the platform itself never surfaced the gap. |
| **Target** | 100% of unregistered documents are visually flagged on their own feature's page. |
| **Minimum validation signal** | `phase4` and at least 5 of the other 49 zero-registration features (sampled) correctly show the unregistered flag post-ship. |
| **Measurement method** | Manual spot-check via Chrome against real production, by Hamish King, post-deploy. |
| **Feedback loop** | If flagging is inconsistent or missing on the sample, that's a shipped-but-incomplete implementation — blocks DoD until fixed, not deferred. |

---

## Metric Coverage Matrix

<!-- Populated by /definition once stories are written. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Registered-vs-disk divergence rate | cat-s1, cat-s2, cat-s3, cat-s4 | Covered |
| Bugs of this class per session | cat-s1, cat-s2, cat-s5, cat-s6 | Covered |
| Unregistered documents visible without a bug report | cat-s3, cat-s4 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach — the canonical builder's exact shape is a `/design` decision, not fixed here
- Sprint targets or velocity — these metrics are outcome-based
