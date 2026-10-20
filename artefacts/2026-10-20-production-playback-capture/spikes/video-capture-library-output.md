# Spike Output: video-capture-library

**Spike:** video-capture-library
**Parent feature:** 2026-10-20-production-playback-capture
**Discovery artefact:** `artefacts/2026-10-20-production-playback-capture/discovery.md` (in progress, not yet saved)
**Outcome:** REDESIGN
**Output date:** 2026-10-20

---

## Uncertainty addressed

Can an existing (off-the-shelf or low-maintenance) video-processing library both (a) reliably detect and blur/redact PII and financial data in a screen-recorded browser session, and (b) provide demo-quality presentation features (zoom/focus on a region, highlights, annotations/callouts) — well enough to replace the current fragile, hand-rolled DOM-injection approach and to make production video capture safe to build as a follow-on story?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1. Video-player-side annotation libraries (Popcorn.js, Frametrail, ravplayer, Fabric.js overlay) | Render zoom/highlight/annotation at playback time in a custom player | Purpose-built for annotation; some actively maintained | Annotations aren't baked into the `.webm` file itself — requires a custom player, incompatible with `/playback`'s existing plain `<video controls>` viewer | ✗ Ruled out |
| 2a. `ffmpeg` `crop`/`scale` (zoom) on the already-recorded file, using the Playwright-bundled binary as-is | Zero new dependency — confirmed present in the bundled `ffmpeg`'s own `-filters` output | Burns the zoom directly into the output file; works with the existing plain `<video>` viewer | `zoompan` has a known jitter/shake bug on animated pans (use a static crop/scale cut instead) | ✓ Recommended — confirmed working today |
| 2b. `ffmpeg` `drawbox`/`drawtext` (annotations/highlights), requiring a **full** `ffmpeg` install | Burns annotations directly into the output file, same integration shape as 2a | LGPL-licensed (fine for internal CI use, not redistribution); well-trodden install path | **Confirmed absent from the Playwright-bundled binary** (`--disable-everything`, only `pad`/`crop`/`scale` enabled) — this is a real, explicit new CI/local dependency, not free; a reported `ffmpeg`-on-Ubuntu-24.04 install-compatibility issue needs verifying against this repo's own `ubuntu-latest` CI before relying on it | ✓ Recommended, but as its own explicit dependency decision, logged in `/decisions` — not bundled into the "zero new dependency" zoom finding |
| 2c. `ffmpeg` `.webm`→`.gif` conversion (operator's item 11, "video + GIF export") | Standard one-line `ffmpeg` conversion | Free once `ffmpeg` (either variant) is already in play | None found | ✓ Recommended as a side-benefit, not a reason to adopt anything on its own |
| 3. Hosted redaction service (e.g. PiiBlur) | Purpose-built for exactly this: face/plate/screen/document blur with a REST API | Handles the actual redaction problem directly | Hosted/managed service — violates `product/constraints.md` #11 (no persistent agent runtime / hosted service dependency); also a real secret-handling surface for production data | ✗ Ruled out |
| 4. Local OCR (tesseract.js) + local PII pattern-match (OpenRedaction / redact-pii) + `ffmpeg` blur execution | Fully local/offline, no hosted service; all three pieces are genuine, independently real libraries | Technically buildable without violating any constraint | Composed pipeline, not a single adopted library; OCR has a reported false-positive/false-negative rate on noisy images — a false negative is a real data-exposure risk, not a cosmetic miss | ✓ Recommended, but conditional on a mandatory human-verification gate before any production video is saved/shared — not safe to fully automate-and-trust unattended |
| 5. HTML/DOM capture — clone front-end markup into a pixel-accurate, interactive replica (Arcade/Storylane/Supademo-style) | Operator-surfaced from a 20-feature commercial demo-platform survey; produces an editable, backend-independent demo | Interactive, reusable, doesn't need a live backend to replay | Trades away authenticity: a sponsor's acceptance decision needs proof the *real* deployed system did something, not a cleaned-up replica — wrong fit for an evidence pipeline specifically | ✗ Ruled out (operator-confirmed) |
| 6. Full commercial SaaS demo platform (Arcade, Storylane, Supademo, etc.) for the whole presentation layer | Operator-surfaced; mature, polished zoom/annotation (items 5, 6) out of the box, likely higher quality than a hand-rolled pipeline | Solves the demo-presentation quality gap directly, no build effort | Does not touch the feature's actual blocking problem (production auth); piping captured screens through a third-party SaaS's own cloud infrastructure reintroduces the exact hosted-service risk already ruled out for option 3 (PiiBlur), per `product/constraints.md` #11; remaining ~17 features (lead-capture, CRM, branching, AI voiceover, etc.) assume a sales/marketing persona this feature doesn't have | ✗ Ruled out — quality gap on zoom/annotation is real but does not outweigh the data-governance constraint already closed once in this same spike |

---

## Recommendation

Ship zoom first: adopt `ffmpeg` static `crop`/`scale` post-processing (Option 2a) for demo-presentation immediately — confirmed working today with the Playwright-bundled binary, zero new dependency, directly replaces the fragile DOM-injection approach found during `journey-cx-redesign`'s own editorial review, benefits staging capture right away. Annotations/highlight boxes (Option 2b) need a full `ffmpeg` install — a small, real, explicit new CI dependency (LGPL, well-trodden, needs a direct Ubuntu-24.04-compatibility check against this repo's own CI) — treat as a closely-following second story, not bundled into the "free" zoom finding. For redaction (Option 4), the technical path is real and buildable, but its reliability has not been proven in this spike (no prototype was built, per the brief's own scope boundary) — it should be built and measured as its own follow-on story with an explicit, non-negotiable human-verification step before any production video capture is trusted, rather than treated as "solved" by this spike. A full commercial SaaS demo platform (Option 6) was compared directly and ruled out: it would likely out-polish the DIY zoom/annotation result, but it doesn't solve the feature's actual blocking problem (production auth) and reintroduces the same hosted-service risk already ruled out for PiiBlur. Production video capture itself stays Out of Scope for the current MVP, but the blocker is now narrower and more honest: not "no library exists," but "the pipeline exists and must be built and proven reliable, with a human gate, before it is trusted with real customer data." Separately, a broader ~17-item commercial interactive-demo-platform feature set (sandbox environments, AI voiceover, branching flows, personalization-at-scale, lead-capture gating, CRM integrations, AI demo agents, demo hubs, etc.) was surfaced during this spike but explicitly ruled out of this feature's own scope — it addresses a different persona (sales prospect / marketing viewer) and a different problem (sales enablement) than DoD-evidence capture for sponsor acceptance. If pursued, it should be its own, separately-scoped feature with its own `/discovery`, not folded into this one.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| No persistent agent runtime / hosted service dependency | `product/constraints.md` #11 | Rules out PiiBlur and any cloud-API-based redaction; both recommended options (ffmpeg, local OCR+pattern-match) run entirely within existing CI/CD infra |
| Credentials are structural, never in the agent's environment | `product/constraints.md` #12 | Unaffected by this spike's own findings — no credential-handling changes proposed here |
| No new npm dependencies (parent epic's own original Constraints section) | `artefacts/2026-10-19-real-playback-capture-automation/discovery.md` | The zoom recommendation (`crop`/`scale`) adds zero new npm dependencies (already bundled via Playwright). Two things sit outside this norm, both logged explicitly rather than assumed: (1) annotations need a **full `ffmpeg` install** — not an npm package, but still a new external dependency (system binary, LGPL); (2) the redaction pipeline (tesseract.js + OpenRedaction/redact-pii) are genuine new npm dependencies and would require relaxing this norm specifically for those two libraries — a `/decisions` call for each, not assumed by this spike |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Unchanged |
| Target users | No | Unchanged |
| MVP scope | Yes | A new, separate near-term item becomes addable (ffmpeg-based presentation fix for staging capture, independent of this feature) |
| Out of scope | Yes | Video-capture-against-production reframed from "blocked on finding a library" to "blocked on building and proving a human-gated redaction pipeline reliable" |
| Assumptions | Yes | The assumption that a single dedicated package would answer both dimensions did not hold |
| Known risks | Yes | New named risk: OCR-based redaction false-negative rate is unproven; must be explicitly accepted (with a human-verification gate) or the production-video follow-on stays deferred |
| Success criteria | No | Unchanged |
| Technical constraints | No | Both relevant constraints (#11, #12) held throughout; no violation found |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing; resume the paused `/discovery` conversation with this finding folded in.

---

## Remaining unknowns

- Whether this repo's own CI (`ubuntu-latest`) actually hits the reported `ffmpeg`-on-Ubuntu-24.04 install-compatibility issue — flagged as a real risk, not yet verified against this specific CI.
- Real-world accuracy of the tesseract.js + pattern-match pipeline against actual production-shaped UI content (forms, tables, currency) — no prototype was built in this spike, by design (out of scope per the brief).
- Whether a static crop/scale "jump zoom" (no animated pan, avoiding the `zoompan` jitter bug) looks acceptable for demo purposes, or whether the visual quality gap against a mature SaaS tool's own smooth zoom matters enough in practice to revisit — a subjective call, cheap to just try directly.

---

## Decision log reference

Logged at `artefacts/2026-10-20-production-playback-capture/decisions.md` (the first decision for this feature).
