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

**2026-11-01 | SCOPE | /test-plan (fhff-s3)**
**Decision:** `fhff-s3`'s AC4 now explicitly requires creating a dedicated regression-fixture/mutation-test pair for `check-skills-fixture-usage.js` (a hand-rolled case + a compliant case), not just preserving existing coverage for all 3 scripts.
**Alternatives considered:** Leave AC4 as originally written (preserve existing regression fixtures only) and log the `check-skills-fixture-usage.js` coverage gap as a separate, future finding.
**Rationale:** Direct search during `/test-plan` writing confirmed `check-skills-fixture-usage.js` has no dedicated regression-fixture/mutation-test pair today — unlike `check-journey-fixture-usage.js` (`tsir-s3`) and `check-journeys-fixture-usage.js` (`tfhc-s7`), both of which do. Since this story is already building the shared factory that all 3 scripts will call through, adding the missing coverage for the one sibling that lacks it is directly in scope (not an unrelated expansion) and makes AC4/AC5's own "the refactor is safe" claim actually true across all 3 shapes, not 2 of 3. Deferring it would mean shipping a DRY refactor with real, known-asymmetric safety coverage.
**Made by:** Copilot (/test-plan, direct search)
**Revisit trigger:** None — this is a direct strengthening, not a trade-off requiring future reconsideration.

---

**2026-11-01 | RISK-ACCEPT | /definition-of-ready (fhff-s1, fhff-s2, fhff-s3)**
**Decision:** Proceed with DoR sign-off for all 3 stories despite W4 (verification script reviewed by a domain expert) being unmet.
**Alternatives considered:** Block sign-off until a human reviews all 3 verification scripts.
**Rationale:** Same rationale as every prior story in the parent `fixture-divergence-closure` epic — solo-operator capacity; the verification scripts remain available for post-merge smoke testing per the skill's own "three moments" design even if pre-code sign-off is skipped here.
**Made by:** Copilot (DoR warning check)
**Revisit trigger:** If any script's described behaviour turns out to be wrong once implemented, that is itself evidence this warning should have been resolved pre-code — note for retrospective, not an immediate action.

---
