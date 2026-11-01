# Decision Log: fixture-hardening-fast-follows

**Feature:** Fixture Hardening Fast-Follows
**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Last updated:** 2026-11-01

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

**2026-11-01 | ASSUMPTION | /clarify**
**Decision:** The `deploy-group` CI concurrency-cancellation fix does not need Fly.io infrastructure changes — confirmed to be a pure GitHub Actions workflow-level concern.
**Alternatives considered:** Treat it as unconfirmed and defer the investigation to the story itself.
**Rationale:** Directly checked `.github/workflows/e2e.yml` and `staging-deploy.yml` — `concurrency: deploy-group` is set natively in the workflow YAML, no `fly.toml`/Fly.io involvement. Also confirmed the eviction mechanism (a concurrency group holds only one *waiting* request; a newer one evicts the older one outright) is a genuine GitHub Actions platform limitation with no native fair-queue option — ruling out a simple reconfiguration fix and confirming the real fix options are exactly the two already named at discovery: an automatic rerun-on-cancellation wrapper (in scope for the fast-follow story) or per-PR ephemeral environments (explicitly out of scope).
**Made by:** Copilot (/clarify, direct investigation)
**Revisit trigger:** None — this is resolved, not a carried-forward risk.

---

**2026-11-01 | ASSUMPTION | /clarify**
**Decision:** The NFR-budget sweep story (`rb-s3`/`cat-s4`/`cat-s1`) is sized with explicit room for per-file investigation tasks — not assumed to be a simple, fixed-task threshold widen.
**Alternatives considered:** Assume a threshold widen is sufficient for all 3 files and size the story as fixed-task-only, escalating only if a file turns out to need more.
**Rationale:** `tfhc-s9` already falsified the "predictable in advance" version of this exact judgment once this same session — its own concurrency-cap tuning took two full rounds of empirical discovery, and one fragile file (`check-cat-s1-core-trace-builder.js`) only surfaced on a *second* full-suite run at an already-fixed concurrency value, not the first. No real distribution of contended-run times exists yet for any of the 3 named files, only single data points, so a widen-only approach can't yet be confirmed safe without risking a threshold that never fails (not a real NFR, per this feature's own Constraints section). Sizing the story with investigation-task headroom avoids repeating `tfhc-s9`'s own mid-implementation scope-surprise pattern.
**Made by:** Copilot (/clarify, operator-confirmed via "what do you suggest" → Option A)
**Revisit trigger:** If the actual investigation finds all 3 files genuinely only need a threshold widen, this sizing decision was more conservative than strictly necessary — note for retrospective, not a defect.

---
