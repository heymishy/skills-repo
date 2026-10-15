## Epic: Engineers can produce a reviewable, AC-mapped demo package from a DoD-validated feature without authoring it from scratch

**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, running the Feature Playback Package skill against any DoD-validated feature produces a structured walkthrough document — scripted from that feature's own DoD artefact (AC Coverage table and Metric Signal section, not raw E2E test content) — with screenshots captured at the key, AC-mapped stable UI states, saved to `artefacts/[feature-slug]/playback/`. This is the walking skeleton's own thinnest real end-to-end path: no video, no viewer yet, but a real engineer can run it against a real feature and get a reviewable, sponsor-presentable artefact.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    SKILL[skills/feature-playback/SKILL.md]\n    CAPTURE[scripts/playback-capture.js]\n    SKILL -->|instructs engineer to run, parameterised by feature-slug| CAPTURE\n    CAPTURE -->|reads AC Coverage table + Metric Signal| DOD[artefacts/feature-slug/dod/*.md]\n    CAPTURE -->|Playwright screenshots at AC-mapped stable states| ARTEFACT[artefacts/feature-slug/playback/]\n    FFMPEG[ffmpeg encode .webm to MP4]\n    CAPTURE -->|recordVideo context, fpd-s2| FFMPEG\n    FFMPEG --> ARTEFACT\n    ROUTE[src/web-ui/routes/playback.js, fpd-s3/fpd-s4]\n    ROUTE -->|reads| ARTEFACT\n    ROUTE -->|reuses existing traversal if found, ADR-028| TRAVERSAL[feature/story/AC traversal]"}}---

## Out of Scope

- **Video recording and its accessibility constraint (captions/transcript)** — a separate epic (`feature-playback-video-accessibility`); this epic ships doc + screenshots only, not a complete MVP package on its own.
- **The web-app viewer** — a separate epic (`feature-playback-web-viewer`); this epic's own output is files on disk, not yet browsable in-app.
- **Automated video narration / AI voiceover** — out of scope for the whole feature per discovery.
- **Sponsor feedback collection tooling** — out of scope for the whole feature per discovery.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M1 — Acceptance loop closure rate | 0% | ≥80% of DoD-validated features produce and share a complete package within 5 business days | Establishes the walking skeleton's own core mechanism (doc + screenshots) that every later epic builds on — without this, no package can exist at all |
| M3 — Demo preparation time | ~2–4h (estimate) | ≤45 min engineer input time | The DoD-sourced script and automated screenshot capture are the two biggest time-savers named in discovery; this epic ships both |

## Stories in This Epic

- [ ] Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots — `fpd-s1`

## Human Oversight Level

**Oversight:** High
**Rationale:** Per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture" — oversight defaults to High for every story in this repo's operating model, not because this epic's own complexity demands it.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
