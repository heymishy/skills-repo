# DoR Scope Contract: iwu.1 — Render context manifest panel with chip layout

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.1-dor.md
**Date:** 2026-06-04

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Contains `handleGetChatHtml` — the session shell handler to be extended |
| `src/web-ui/views/chat-view.js` | Contains `renderChat` — the session shell HTML template that likely needs a `#context-manifest` section added |
| `src/web-ui/utils/html-shell.js` | Contains `escHtml` — must be used for path sanitisation |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read per coding agent instructions |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md` | ACs and architecture constraints |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.1-test-plan.md` | Test specification |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu1-context-manifest.js` | Governance test — all unit and integration tests from the test plan |

### Files to MODIFY

| File | Change |
|------|--------|
| `src/web-ui/routes/skills.js` | Extend `handleGetChatHtml` to pass context manifest data (loaded artefact paths) to the view; may introduce a helper `buildContextManifestHtml(paths)` function |
| `src/web-ui/views/chat-view.js` | Add `#context-manifest` panel section to the session shell HTML with chip layout; add chip CSS inline |
| `package.json` | Add `node tests/check-iwu1-context-manifest.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Governed file — iwu.6 scope only |
| `src/web-ui/routes/skills.js` lines relating to `handlePostTurnStreamHtml` | SSE streaming changes are iwu.3+ scope |
| Any file under `artefacts/` | Read-only pipeline artefacts |
| Any file under `.github/skills/` other than ideate/SKILL.md | Out of scope for this feature |
| `src/web-ui/server.js` route registration | No new routes required for this story |

---

## Cross-story schema dependencies

| Dependency | Story | Type | Notes |
|------------|-------|------|-------|
| None | — | — | iwu.1 is independent; no upstream story must merge before implementation can begin |

---

## Test file locations

| Test type | File | AC covered |
|-----------|------|-----------|
| Unit + integration (governance) | `tests/check-iwu1-context-manifest.js` | AC1–AC4, NFR-SEC, NFR-A11Y (partial — axe-core rule coverage) |
| Manual verification | `artefacts/2026-05-21-ideate-web-ux/verification-scripts/iwu.1-verification.md` | AC5 (AT announcement — manual only) |

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 2 unit + 1 integration | — | — |
| AC2 | ✅ 2 unit | — | — |
| AC3 | ✅ 2 unit | — | — |
| AC4 | ✅ 1 unit | — | — |
| AC5 | ⚠️ Partial (axe-core DOM check only) | ✅ Manual scenario | AT announcement depth — acknowledged |
| NFR-SEC | ✅ 1 unit (XSS probe) | — | — |
| NFR-A11Y | ✅ 1 integration (axe-core) | ✅ Manual | Announcement depth manual only — acknowledged |
