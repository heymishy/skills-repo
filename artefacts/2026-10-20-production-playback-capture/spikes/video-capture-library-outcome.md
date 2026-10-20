# Spike Outcome: video-capture-library

**Opened:** 2026-10-20 | **Scope:** Standard (expanded beyond the original 6-step budget at the operator's own explicit direction during investigation — each expansion was a live operator decision, not a unilateral scope increase) | **Steps taken:** 9
**Done condition met:** Yes — viable candidates found for both dimensions, each assessed on reliability, maintenance/license, and integration shape
**Artefact path:** `artefacts/2026-10-20-production-playback-capture/spikes/video-capture-library-outcome.md`

---

## Outcome: REDESIGN

### What was found

**Demo-presentation dimension (zoom/focus, highlights, annotations):**
- No library burns zoom/highlight/annotation directly into a standalone output video file the way this use case needs. The closest matches (Popcorn.js, Frametrail, ravplayer, Fabric.js-canvas-overlay guides) are all **video-player-side** interactive annotation tools — they render overlays at *playback* time in a custom player, not baked into the `.webm` bytes themselves. `/playback`'s own viewer uses a plain `<video controls>` element (`src/web-ui/routes/playback.js`), so a player-dependent annotation tool would not work there without building a custom player too — out of proportion to the actual need.
- `ffmpeg` is bundled with Playwright (confirmed present at `ms-playwright/ffmpeg-1011/ffmpeg-win64.exe` this session) — but **directly inspecting its own `-filters` output and build configuration found it is a minimal custom build**: `--disable-everything --enable-filter=pad --enable-filter=crop --enable-filter=scale` only. No `drawtext`, no `drawbox`, no `overlay`, no `boxblur`. This corrects an earlier "zero new dependency" assumption in this same investigation — confirmed wrong by direct inspection, not left as a hedge.
- **Zoom (static `crop`+`scale`): confirmed working today**, zero new dependency, using the Playwright-bundled binary as-is.
- **Text annotations / highlight boxes (`drawtext`/`drawbox`): require installing a full, separate `ffmpeg`** — a real, explicit new CI/local dependency decision, not something already available. Investigated this option directly (operator's own direction) rather than treating it as a blocker:
  - **License:** `drawtext` lives in `libavfilter`, LGPL-licensed in a standard non-`--enable-gpl` build — compatible with internal CI use (we are not redistributing `ffmpeg` to end users, only using it inside our own pipeline).
  - **CI impact:** this repo's own CI already runs on `ubuntu-latest` (confirmed in `.github/workflows/e2e.yml`). Installing a full `ffmpeg` is well-trodden (`apt-get install -y ffmpeg`, or the dedicated `FedericoCarboni/setup-ffmpeg` action) but not risk-free — found a specific, real report of an `ffmpeg` install compatibility issue on GitHub's newer Ubuntu 24.04 runner image (which `ubuntu-latest` now points to). Whether this repo's own CI is actually affected needs a direct verification step, not an assumption either way.
- Caveat found: `ffmpeg`'s `zoompan` filter has a known, reported jitter/shake bug when panning (an open ffmpeg trac ticket, not hearsay). A **static** crop/scale (cut to a fixed region, no animated pan) avoids this entirely; a smooth animated pan is a real reliability risk and should not be relied on without further testing.
- **Bonus, confirmed free once `ffmpeg` is in play either way:** a `.webm`→`.gif` conversion (item 11 from the operator's own commercial-tool feature list, "video + GIF export from the same capture") is a standard one-line `ffmpeg` conversion, not a separate feature to build or buy.

**Redaction dimension (PII / financial data):**
- No single library does "detect PII in a video frame and blur it." The two real building blocks found are: (1) **tesseract.js** — a genuine, Node-capable, fully local/offline OCR library (no hosted service, respects the "no persistent agent runtime" constraint) that returns word-level bounding boxes from an image/frame; and (2) **OpenRedaction** or **redact-pii** — local, regex-based PII *text* pattern matchers (email, SSN, card numbers, etc.) with no required runtime dependency.
- Composing these (OCR a frame → pattern-match the extracted text against known PII shapes → blur the matched word's own bounding box via `ffmpeg`) is a real, locally-runnable pipeline — not a hosted service, not a new managed dependency beyond two small libraries plus the already-present `ffmpeg`.
- Real reliability concern, not a hypothetical one: one practitioner report found Tesseract.js produces meaningful false positives on images with non-text visual noise, and accuracy degrades further on frames with camera/screen-capture artefacts. For redaction specifically, a **false negative** (sensitive text missed, not blurred) is a real data-exposure incident, not a cosmetic miss — this is a materially different risk bar than demo-presentation polish.

**Operator-supplied context (mid-investigation addition):** The operator surfaced a consolidated 20-feature list from commercial interactive-demo platforms (Arcade, Storylane, Supademo, Navattic, Walnut, Reprise, HowdyGo, Demostack), organised across four axes: capture fidelity, production polish, reach/format, and measurement/intelligence. Of these, only two map onto this spike's own already-scoped question — auto-zoom/pan (covered by the `ffmpeg` finding above) and auto-generated step annotations (also covered). A third, HTML/DOM capture (cloning front-end markup into a pixel-accurate, *interactive* replica), was assessed explicitly against this feature's own need and ruled out: DOM-cloning tools exist to make a demo editable and backend-independent, which trades away exactly the authenticity property this feature's evidence pipeline depends on — a sponsor's acceptance decision needs proof the *real* deployed system did something, not a cleaned-up replica of it. The remaining ~17 items (sandbox environments, AI voiceover, branching flows, personalization-at-scale, lead-capture gating, CRM integrations, AI demo agents, demo hubs, etc.) describe a full commercial sales-enablement demo platform — a different persona (sales prospect / marketing viewer, not a feature sponsor reviewing DoD evidence) and a different problem than this feature addresses. Explicitly out of scope here; the operator may choose to scope this as its own, separate feature with its own `/discovery` later.

**Build vs. buy — compared directly against the commercial demo-platform list (operator's own direction):** Of the operator's 20 items, only three map onto a genuine need here: 5 (auto-zoom), 6 (auto-annotations), and 11 (GIF export, free once `ffmpeg` is in play). Everything else is either already built via existing mechanisms (1, 3 — Playwright recording/screenshots; 19, 20 — `/playback`'s own feature listing and `authGuard`), actively wrong for an evidence pipeline (10 — post-record data editing undermines the same authenticity property that ruled out DOM-capture; 15, 17, 7, 9, 18 — assume a sales/marketing persona this feature doesn't have), or irrelevant (2, 4, 8, 12, 13, 14, 16).

On the two items that do matter (5, 6), a mature SaaS tool is plausibly higher quality out of the box than a hand-rolled `ffmpeg` pipeline — no `zoompan`-jitter-style rough edges, more polished by default. That's a real, honestly-stated cost of the DIY direction, not dismissed. But it doesn't change the recommendation: a SaaS demo platform doesn't touch the feature's actual blocking problem (production auth has no safe, tenant-scoped path regardless of which presentation layer sits on top), and piping real captured screens through a third-party SaaS's own cloud infrastructure for processing reintroduces the exact hosted-service risk already ruled out for PiiBlur earlier in this same spike (`product/constraints.md` #11). The quality gap on zoom/annotation polish is real; it is not large enough to justify re-opening a constraint this spike already closed once.

### Reasoning

Neither dimension has a clean "add one npm package, done" answer — the original spike question's framing (a single dedicated package) doesn't match what's actually available. But a real, viable technical path exists for both, once reframed: **post-process the already-recorded `.webm` with `ffmpeg`'s own filters** — zoom at zero new dependency, annotations via a separate, explicit new `ffmpeg` install — for presentation, and **a composed local OCR+pattern-match+blur pipeline** (two small, genuinely offline libraries, no hosted service) for redaction. That's REDESIGN, not PROCEED (the original framing doesn't hold) and not DEFER (a real path forward exists, it's just shaped differently than assumed).

The two dimensions carry different confidence levels, which matters for how the parent discovery should use this finding:
- **Presentation (ffmpeg post-processing):** high confidence this directly fixes the fragile DOM-injection problem found during `journey-cx-redesign`'s own editorial review — recommend adopting it for *all* future demo capture, staging included, not just production. Zoom ships immediately (zero new dependency); annotations follow as a second, closely-sequenced story once the full-`ffmpeg`-install decision is made explicitly.
- **Redaction (OCR+pattern-match pipeline):** real and buildable, but OCR-based detection has a known false-negative risk that is not acceptable to fully automate-and-trust for something as consequential as real customer PII exposure. Recommend: if this pipeline is built, it gates production video with a **mandatory human verification step before any capture is ever saved or shared** — automated redaction proposes, a human confirms nothing was missed, same pattern this repo's own `markPackageReviewed`/editorial-review gate already uses for screenshot/video evidence generally. Not a fully-unattended automated redaction claim.

---

## If REDESIGN

**What needs to change:** The parent discovery's MVP scope (in progress, paused for this spike) should be updated:
1. Add a new MVP item (or amend the existing staging-capture mechanism as a follow-on): replace the ad hoc DOM-injection demo-framing approach with an `ffmpeg`-based post-processing step in `captureVideoForClip` or a new wrapper function. **Zoom (crop/scale) is zero new dependency** (Playwright-bundled `ffmpeg` already has it); **annotations/highlight boxes (drawtext/drawbox) require installing a full `ffmpeg`** as an explicit, named new CI/local dependency (LGPL, well-trodden, but a real decision — not free). This benefits staging capture immediately, not just production.
2. Keep "video capture against production" formally Out of Scope for *this* MVP still, but change the framing from "blocked on finding a redaction library" (resolved — a path exists) to "blocked on building and proving the OCR+pattern-match+human-verification pipeline reliable enough to trust with real customer data" — a materially different, narrower, and more honestly-scoped follow-on story than the original open-ended "find a library" framing.

**Suggested direction:** Three follow-on stories, not one:
- A near-term story: adopt `ffmpeg` static crop/scale zoom for demo-presentation on staging capture — zero new dependency, ship first.
- A second, closely-following story: install a full `ffmpeg` in CI and add `drawtext`/`drawbox` annotation support — a small, explicit new dependency decision, logged in `/decisions`, verified against this repo's own CI (the Ubuntu 24.04 install-compatibility risk) before relying on it.
- A separate, later story: build and prove the redaction pipeline, with an explicit human-verification gate as a hard requirement, before production video capture is ever attempted for real.

**Return to:** `/discovery` for `2026-10-20-production-playback-capture` (in progress — resume with this finding folded in).

---

## What remains unknown

- Whether this repo's own CI (`ubuntu-latest` runners) actually hits the reported `ffmpeg`-on-Ubuntu-24.04 install compatibility issue — flagged as a real risk, not verified against this specific repo's own CI directly. A cheap, direct thing to try (add the install step, run it once) rather than research further.
- Real-world accuracy rate of the tesseract.js + pattern-match pipeline against actual UI screenshots (form fields, tables, currency formatting) — no prototype was built in this spike (explicitly out of scope per the brief); this is exactly what the follow-on redaction story would need to measure before any PROCEED call on production video itself.
- Whether an instant-cut zoom (no animation, sidestepping the `zoompan` jitter bug entirely) looks acceptable for demo purposes, or whether the visual quality gap against a mature SaaS tool's own smooth zoom is large enough to matter in practice — a subjective call best made by actually looking at one, not by further research.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Unchanged — production auth gap remains the core problem |
| MVP scope | Yes | Out-of-Scope item 1 (video capture) reframed: redaction path exists but needs a human-verification gate and its own follow-on story, not an open-ended "find a library" blocker. A separate near-term item (ffmpeg-based presentation fix) is now addable to the *staging* mechanism independent of this feature's own MVP. |
| Assumptions | Yes | The implicit assumption that "a dedicated package" would be the answer did not hold — the real answer is composition of already-available tools (`ffmpeg`) plus two small local libraries, not a single adopted dependency. |
| Known risks | Yes | New named risk: OCR-based redaction false-negative rate is unproven and carries real data-exposure consequence if trusted without a human-verification gate — this risk must be explicitly accepted (with the gate) or the production-video follow-on stays deferred. |
| Technical constraints | No | `product/constraints.md` #11 (no hosted service) and #15-adjacent npm-minimalism norm both held throughout — no candidate violates either. |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing; resume the paused `/discovery` conversation with this finding folded into Section 4 (MVP scope) and Section 6 (Assumptions and risks), no need to restart from Section 1.

---

## Decision log reference

Logged at `artefacts/2026-10-20-production-playback-capture/decisions.md` (the first decision for this feature, created per CLAUDE.md's own "decisions.md is mandatory for features with architectural choices" rule).
