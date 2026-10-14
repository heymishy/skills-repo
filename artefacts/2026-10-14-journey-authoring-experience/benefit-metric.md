## Benefit Metric: Journey Authoring Experience — Guided Creation, Smarter Defaults, Templates

**Discovery reference:** artefacts/2026-10-14-journey-authoring-experience/discovery.md
**Date defined:** 2026-10-14
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner (single-operator repo; matches the parent `2026-10-11-journey-cx-redesign` feature's own established convention)

**Product context read:** `product/mission.md` — the outer loop practitioner (PO/SME/discovery lead) is a primary persona, matching this feature's own target user exactly. `product/roadmap.md` — this extends the same web-UI journey-mapping capability the parent `journey-cx-redesign` epic just closed out at the display/mechanics layer; this feature is the next layer up (the authoring experience), consistent with current strategic priority, not a new direction.

**Meta-benefit check:** No. This is a straightforward product feature (guided creation, a deterministic suggestion mechanism, a starting template) — discovery.md shows no signal of also testing a tooling/process/capability hypothesis. Tier 2 (meta metrics) does not apply.

**Tier 3 (compliance/risk) check:** No. `context.yml` sets `meta.regulated: false`; discovery.md names no compliance framework or regulatory obligation. Tier 3 does not apply.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time-to-first-complete stage

| Field | Value |
|-------|-------|
| **What we measure** | Elapsed time from clicking "+ Add stage" to that stage having its name AND at least the `description`/`customer_actions`/`emotion` fields saved (a "usably complete" stage, not just a name) — not a proxy like total session time |
| **Baseline** | Not yet established. Today's flow requires discovering the separate Edit-stage affordance after naming a stage, so the true baseline likely includes real discovery/switching cost, not just typing time. Will measure current state (pre-this-feature) in the first week of this feature's own `/verify-completion` pass, before any guided-creation change ships, so there is a genuine before/after comparison |
| **Target** | ≥40% reduction from the measured pre-feature baseline |
| **Minimum validation signal** | Any measured reduction at all (>0%) — proves the guided flow genuinely removes friction, even if not yet at the full target |
| **Measurement method** | A session-timing instrument on the stage-creation-to-first-complete-save sequence (new, built as part of this feature — not yet instrumented today). Checked by the Platform Owner after a defined post-release usage window |
| **Feedback loop** | If even the minimum signal isn't met, guided creation isn't actually removing the friction it was designed to remove — revisit the UX before investing in the template/suggestion layers further, since they build on the same entry point |

### Metric 2: Fields populated without manual prompting

| Field | Value |
|-------|-------|
| **What we measure** | % of NEW stages (created after this feature ships) that have ≥3 of the 7 editable fields (`description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`) populated at the time of the stage's own first save — i.e. populated via the guided flow and/or a suggestion, not requiring the operator to separately reopen the edit panel later |
| **Baseline** | `[UNKNOWN BASELINE]`. Never measured — the parent feature's own discovery.md names this same gap for the `emotion` field specifically and left it unresolved. **Action before release:** run the real DB query against existing stages now, to establish a genuine pre-feature baseline, not an assumed one |
| **Target** | ≥40% of new stages reach ≥3 populated fields at first save, within 4 weeks of release |
| **Minimum validation signal** | ≥15% — meaningfully above whatever the pre-feature baseline turns out to be, proving the guided flow/suggestions are doing real work, not just a rounding artefact |
| **Measurement method** | Direct database query against `customer_journey_stages`, run weekly post-release by the Platform Owner or engineering |
| **Feedback loop** | If even the minimum signal isn't met, the deterministic discovery-scan suggestion mechanism likely has limited real coverage (per discovery.md's own named risk — most new journeys may not yet be linked to a feature with its own discovery artefact to scan) — this is the trigger to bring forward the AI-generation fast-follow rather than waiting for the deterministic mechanism to prove itself over a longer window |

### Metric 3: Operator CX judgment of the authoring flow itself (not the finished map)

| Field | Value |
|-------|-------|
| **What we measure** | The operator's own direct, qualitative judgment on whether building a journey map from scratch feels guided/supported rather than "clunky" — distinct from the parent feature's own M1, which judges the FINISHED, already-populated map against the 3 reference examples. This metric is specifically about the pre-first-save experience |
| **Baseline** | The operator's own direct framing this session ("I thought we did more than a few tidy-ups... what I want is the bigger UX and CX upgrade") is the baseline signal — a stated, not-yet-closed gap, not numerically anchored |
| **Target** | Operator judges the guided-creation flow as no longer "clunky" — same judgment-scale convention as the parent feature's own M1 |
| **Minimum validation signal** | Operator judges it as a real improvement over today's two-step, undiscoverable flow, even if not yet fully "not clunky" |
| **Measurement method** | Direct operator review/demo once shipped. Single qualitative judgment call by Hamish King (Platform Owner) |
| **Feedback loop** | If even the minimum signal isn't met, guided creation alone didn't close the gap — this is the trigger to revisit the bigger, deliberately-deferred inline-in-grid redesign as its own future discovery, per this feature's own `decisions.md` revisit trigger |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| M1 — Time-to-first-complete stage | Not yet assigned — populated at `/definition` | Not yet covered |
| M2 — Fields populated without manual prompting | Not yet assigned — populated at `/definition` | Not yet covered |
| M3 — Operator CX judgment of the authoring flow | Not yet assigned — populated at `/definition` | Not yet covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, defined at `/definition`
- Implementation approach — that is `/definition` and `/design`
- Sprint targets or velocity — these metrics are outcome-based, not output-based
