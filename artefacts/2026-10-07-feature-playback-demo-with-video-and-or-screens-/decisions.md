# Decisions: Feature Playback Demo Package

---

**2026-10-15 | SCOPE | /definition D2-platform gate (fpd-s2)**
**Decision:** Video output format corrected from MP4 (via an `ffmpeg` encoding step) to `.webm` directly — Playwright's own native `recordVideo` output, shipped as-is.
**Context:** `/definition`'s own mandatory D2-platform gate requires verifying any platform/tool dependency before writing an AC around it. `ffmpeg` was confirmed unavailable in this session's own delivery sandbox (`ffmpeg -version` → command not found), with no confirmation it exists in any other real delivery environment this skill would run in.
**Rationale:** The discovery's own Constraints section already permits this — "MP4 or equivalent" — and `.webm` is a standard, patent-unencumbered, universally browser-playable web video format, satisfying the same requirement MP4 was chosen for (native `<video>` element playback, no plugin). Dropping the encoding step removes a tool dependency entirely rather than carrying a deferred, unconfirmed one forward into the story.
**Made by:** Claude (session), per `/definition`'s own mandatory D2-platform gate — no operator judgment call needed, the platform-availability check is unambiguous.
**Revisit trigger:** If a future need arises for MP4 specifically (e.g. an external tool or integration that doesn't accept `.webm`), confirm `ffmpeg`'s real availability in the actual delivery environment first, then reinstate the encoding step as its own story.

---

**2026-10-15 | ARCHITECTURE | /definition (fpd-s3, ADR-028)**
**Decision:** Before building a new feature/epic/story/AC traversal for the viewer (`fpd-s3`), the story's own Architecture Constraints require checking whether `/trace`'s own chain-walking logic or `dashboards/pipeline-viz.html`'s own feature-card rendering already provides a reusable traversal — per ADR-028 ("a derived structure needs exactly one canonical builder"). This check is a story-level task, not resolved at `/definition` itself (which does not produce implementation detail) — named here so it is not missed at implementation time.
**Context:** Carried forward from the discovery's own amendment (2026-10-15, per operator CX direction) naming this exact check.
**Rationale:** Same rationale as every other ADR-028 application this session (`jae-s5`) — avoid a second independent derivation of "walk the feature/epic/story/AC structure" if one already exists.
**Made by:** Claude (session), consistent with the discovery's own already-logged direction.
**Revisit trigger:** None — this is a standing implementation-time check, resolved when `fpd-s3` is actually built.
