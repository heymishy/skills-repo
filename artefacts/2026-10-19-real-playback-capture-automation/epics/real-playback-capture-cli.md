## Epic: Playback evidence captures itself, for real, without an operator driving a browser

**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

When this epic is complete, running `node scripts/playback-capture.js [feature-slug]` authenticates against `wuce-staging` via the already-deployed `E2E_STAGING_AUTH_STUB_SECRET` mechanism, navigates to each AC's own stable UI state (derived from an existing E2E spec's own selector where one exists, or a manually-authored fallback), and saves a real screenshot and/or video clip to `artefacts/[feature-slug]/playback/[story-slug]/screenshots/`/`video/` — with zero manual Chrome-driving required. `skills/feature-playback/SKILL.md`'s own documented Step 2-3 ("Run scripts/playback-capture.js") finally describes something that actually runs, not an aspirational CLI that was never built. The walking skeleton's own two-part shape: `rpca-s1` proves the thinnest possible real end-to-end path (auth → navigate → one real screenshot, for a single hand-picked AC) before any generalisation is built; `rpca-s2`-`rpca-s4` generalise it to every AC with E2E coverage, add video, and wire it into the documented skill flow.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    CLI[scripts/playback-capture.js\\nCLI entrypoint]\n    AUTH[authenticateStagingSession]\n    SEL[deriveAcSelectorsFromE2ESpecs]\n    FALLBACK[selectors-manual.json\\nfallback]\n    SHOT[captureAcScreenshots]\n    VID[captureVideoRecording]\n    CAP[generateCaptionsForVideo\\nfpd-s2, reused unchanged]\n    STAGING[wuce-staging\\nGET /test/session]\n    SKILL[skills/feature-playback/SKILL.md]\n    CLI --> AUTH\n    AUTH --> STAGING\n    CLI --> SEL\n    SEL --> FALLBACK\n    SEL --> SHOT\n    SEL --> VID\n    VID --> CAP\n    SKILL -.describes.-> CLI"}}---

## Out of Scope

- **Production capture** — explicitly deferred to a fast-follow epic/story per the discovery's own risk decision (a production-equivalent auth-bypass secret carries materially higher risk than staging's).
- **Bulk retrofitting real capture against the ~270 existing DoD-complete features** — this epic proves the mechanism works, it does not run a backfill campaign.
- **Captions/transcript generation quality improvements** — `fpd-s2`'s existing `generateCaptionsForVideo` is reused as-is.
- **A new mandatory manual-authoring step as the primary selector source** — manual authoring is a fallback only, not the main mechanism this epic builds.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| M1 — Real capture coverage on new DoD-complete features | 0% | ≥50% of new DoD-complete features reach non-zero real capture coverage via the CLI within 30 days | This epic is the entire mechanism M1 measures — without it, M1 stays at 0% indefinitely |
| M2 — Manual capture time per feature | Multi-hour (confirmed this session) | ≤5 minutes per feature (trigger + review) for ACs with E2E coverage | Direct mechanism: replacing manual Chrome-driving with an unattended CLI run is exactly what reduces this time |

## Stories in This Epic

- [ ] CLI entrypoint + staging auth-stub session + first real end-to-end screenshot — `rpca-s1`
- [ ] Selector derivation from E2E specs, generalised beyond one hand-picked AC, with manual fallback — `rpca-s2`
- [ ] Video capture wired for real — `rpca-s3`
- [ ] Wire the real CLI into `skills/feature-playback/SKILL.md`'s own documented steps — `rpca-s4`

## Human Oversight Level

**Oversight:** High
**Rationale:** Per `architecture-guardrails.md`'s "Solo operator / W4 RISK-ACCEPT posture" — oversight defaults to High for every story in this repo's operating model. Additionally genuinely warranted here: this epic introduces a new consumer of an existing auth-bypass secret mechanism, which carries real security weight even when scoped to staging only.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
