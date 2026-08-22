# Benefit Metric Template

## Benefit Metric: Viewer role has no actual write-blocking enforcement

**Discovery reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/discovery.md` (Approved by Hamish King, 2026-08-22)
**Date defined:** 2026-08-22
**Metric owner:** Hamish King (operator / product owner — solo-operator repo, no separate non-engineering role exists)
**Reviewers:** Hamish King

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a correctness/security fix closing a gap between an already-shipped role option's implied contract and its actual behaviour, not a pilot or tooling-capability test. No meta-metrics defined.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Viewer role actually enforces read-only access

| Field | Value |
|-------|-------|
| **What we measure** | Whether a session belonging to a person assigned the `viewer` role is blocked (denied, not silently permitted) from executing each write action in the MVP-scope enumerated set (candidates from discovery: creating/editing products, creating/editing features, running skill sessions, team-management changes, credits/billing actions — the exact final set is resolved at `/definition`). |
| **Baseline** | 0% of any write action is currently blocked for `viewer` role — confirmed via full codebase search during discovery: no middleware or route anywhere checks for `'viewer'`; only `requireAdmin` gates anything, and it does not distinguish `viewer` from `engineer`/`product`. |
| **Target** | 100% of the enumerated write-action set returns a real denial (403 / redirect-with-error, not a silent 200) for a `viewer`-role session, each covered by an automated test. |
| **Minimum validation signal** | At minimum, the one write action already promised by `bri-s3.3`'s original AC3 ("a viewer-role team member attempts any write action... denied") is enforced and covered by a real (non-placeholder) test — this alone closes the specific broken promise that surfaced this gap, even if the full enumerated set isn't complete in the same story. |
| **Measurement method** | Automated E2E/unit test suite, run in CI on every PR touching the gated write routes. The story's own test-plan (`/test-plan`) encodes the exact assertions. Measured by whoever implements the story; confirmed fresh at `/definition-of-done` against merged code, per this repo's own DoD convention. |
| **Feedback loop** | If the minimum validation signal is not met at DoD, the story is not marked complete — a `decisions.md` entry records why, and the gap stays open (tracked, not silently deferred) rather than merging on partial credit. |

---

## Tier 3: Compliance and Risk-Reduction Metrics

**Applies:** Yes — this is an access-control gap, and this repo's own injected security standard ("Access control: Deny by default", already cited in the related `jatg-s1` fix) treats unenforced role boundaries as a risk-reduction obligation even without an external regulatory driver.

### Tier 3 Metric: Enumerated `viewer`-role write actions blocked

| Field | Value |
|-------|-------|
| **Obligation source** | Internal security standard — "Access control: Deny by default" (self-imposed, not an external regulation; no compliance framework named in discovery or `product/constraints.md`). |
| **Metric** | Count of write routes in the enumerated set that remain accessible to a `viewer`-role person when they should be blocked. |
| **Target** | 0 (binary — every enumerated route blocked). |
| **Validated by** | Engineering (implementing agent) + operator (Hamish King) sign-off at DoD, matching the pattern used for `jatg-s1`'s own access-control fix. |
| **Sign-off required at DoR** | Yes — given security relevance, matching the explicit (not defaulted) W4-style risk acknowledgment already used for `jatg-s1`. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1: Viewer role enforces read-only access | vrne-s1, vrne-s2, vrne-s3, vrne-s4 | Covered |
| Tier 3: Enumerated viewer-role write actions blocked | vrne-s1, vrne-s2, vrne-s3, vrne-s4 | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- The exact final enumerated write-action set — discovery listed candidates; `/definition` resolves the specific list as part of scoping the story
- Implementation approach (shared gate function, per-route checks, etc.) — that is `/definition` and the implementation plan
- Sprint targets or velocity — these metrics are outcome-based, not output-based
