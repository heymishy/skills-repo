# Epic: Tenants can self-serve playback evidence for their own DoD-complete features

**Discovery reference:** `artefacts/2026-10-20-production-playback-capture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-10-20-production-playback-capture/benefit-metric.md`
**Slicing strategy:** Walking skeleton — the real technical risk is narrow and concentrated (proving the session-cookie-to-Playwright integration works end-to-end through a new tenant-scoped surface), so the first story proves that thin path for one AC before extending to the full loop.

## Goal

A tenant's own Product Owner can open one of their own DoD-complete features within one of their own products and trigger an on-demand capture of screenshot evidence for every acceptance criterion, using their own live login session — no CI service credential, no synthetic capture tenant, no engineer demoing it by hand. The capture runs through a new, properly tenant-scoped viewer surface (not the existing `/playback` route, which would leak cross-tenant data if reused). When this epic is complete, a Product Owner can go from "feature marked DoD-complete" to "evidence viewed, sign-off decision made" within a single sitting.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    ROUTE[routes/playback-review.js]\n    MW_RL[middleware/rate-limiter.js]\n    SESS[middleware/session.js]\n    CAP[src/utils capture mechanism: captureAcScreenshots]\n    ARTF[adapters/artefact-fetcher.js]\n    REPO[adapters/repo-adapter.js]\n    DB[(Postgres: journeys, products)]\n    ROUTE --> MW_RL\n    ROUTE --> SESS\n    ROUTE --> ARTF\n    ARTF --> REPO\n    ROUTE --> CAP\n    CAP --> SESS\n    ROUTE --> DB\n    ARTF --> DB"}}---

## Out of Scope

**Fast-follow (next iteration after MVP validates):**
- ~~Video capture~~ — now in scope via `ppc-s5` (2026-10-25). **Correction (2026-10-26):** "screenshot-only capture proven and live in production" was not actually true — see `decisions.md` 2026-10-26 ARCHITECTURE entry. The `playwright` module was never installed in the deployed production image, so the capture mechanism (screenshots and video alike) has never functioned against a real deployed instance; fixed via `ppc-s8`.
- Captions/transcript for captured video — deferred further; `ppc-s5` ships video-only (see `decisions.md` 2026-10-25 DESIGN entry)
- Presentation polish (ffmpeg zoom/annotation)
- Automated redaction/PII handling (needs its own build-and-measure story with a human-verification gate)

**Not currently planned:**
- Cross-tenant or external sharing of captured evidence
- Scheduled/recurring or bulk capture
- Capturing features that are not yet DoD-complete
- Retention/deletion policy for captured evidence

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Self-service DoD validation adoption | 0% | ≥50% of a pilot tenant's own DoD-complete features captured self-service within 6 weeks, for at least one real tenant | Delivers the only mechanism by which this adoption can happen at all — currently no self-service path exists |
| Time to DoD sign-off | Not yet established | Median under 10 minutes, single sitting | The synchronous capture-trigger action (S1/S2) removes the manual demo-scheduling loop entirely |
| Engineer manual-demo load removed | Not yet established | Zero engineer-hours per feature once adopted | Once a tenant's PO can self-serve capture, the engineer is no longer the one collating evidence for that feature |

## Stories in This Epic

- [x] Walking skeleton: tenant-scoped surface + single-AC capture via session-reuse auth — `stories/ppc-s1.md`
- [x] Extend to full-feature capture loop with timing validation — `stories/ppc-s2.md`
- [x] Rate-limit the capture-trigger endpoint per tenant/user — `stories/ppc-s3.md`
- [x] Recognise pipeline-state.json DoD-complete features (CLI/web-UI parity fallback) — `stories/ppc-s4-pipeline-state-dod-fallback.md`
- [x] Self-service video capture per AC — `stories/ppc-s5-video-capture.md`
- [ ] Dashboard-shell UX/CX parity and scope/benefit summary — `stories/ppc-s6-dashboard-shell-parity.md`
- [ ] Record an in-app sign-off decision on captured evidence — `stories/ppc-s7-sign-off-recording.md`
- [ ] Production bug fix: `playwright` module missing from the deployed image, capture mechanism never actually worked in production — `stories/ppc-s8-playwright-production-dependency.md`

## Human Oversight Level

**Oversight:** Medium — coding agent should pause for human review at PR.
**Rationale:** This epic touches real tenant session/auth handling and cross-tenant data isolation. Discovery itself already found and had to correct a real cross-tenant leak risk in this exact codebase area (`/playback`'s untenanted data read) — that history is reason enough for a human look at PR, even though the mechanism design itself is now well-reasoned and code-confirmed, not experimental enough to warrant High (human-implements-directly).

## Complexity Rating

**Rating:** 2
<!-- Some ambiguity, known unknowns — the session-cookie-to-Playwright integration is architecturally resolved (confirmed via code inspection) but not yet proven in a real implementation. The rest of the epic is well understood. -->

## Scope Stability

**Stability:** Stable
<!-- The three discovery assumptions (session reuse, exposure bound, new-surface decision) are resolved with code evidence, not open questions — scope is unlikely to shift. The one flagged risk (capture timing pushing toward async) is explicitly handled inside S2, not left to destabilise the epic. -->
