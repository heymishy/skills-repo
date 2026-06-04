# DoR Scope Contract: iwu.2 — Restructure right panel into two named sections

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.2-dor.md
**Date:** 2026-06-04

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `src/web-ui/routes/skills.js` | Contains `handleGetChatHtml` — the session shell handler |
| `src/web-ui/views/chat-view.js` | Contains `renderChat` — the session shell HTML template to be modified |
| `playwright.config.js` | Playwright E2E configuration — understand webServer, testDir, fixture import |
| `tests/e2e/fixtures/auth.js` | withAuth fixture pattern required for E2E spec |
| `tests/e2e/wuce22-status-board-html.spec.js` | Reference E2E spec pattern to follow |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md` | ACs and layout specifications |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.2-test-plan.md` | Test specification |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu2-right-panel-layout.js` | Governance test — unit and integration tests from the test plan |
| `tests/e2e/iwu2-right-panel-layout.spec.js` | Playwright E2E test for AC4 (CSS max-height 42% and scroll behaviour) — follows withAuth() fixture pattern |

### Files to MODIFY

| File | Change |
|------|--------|
| `src/web-ui/views/chat-view.js` | Replace the right panel HTML with two named sections: `#assumption-cards` (top; flex: 0 0 auto; max-height: 42%; overflow-y: auto; placeholder text) and `#draft-content` (bottom; flex: 1 1 auto; overflow-y: auto; placeholder text); add flex container CSS to right panel |
| `package.json` | Add `node tests/check-iwu2-right-panel-layout.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Governed file — iwu.6 scope only |
| `src/web-ui/routes/skills.js` lines relating to `handlePostTurnStreamHtml` | SSE streaming changes are iwu.3+ scope |
| `src/web-ui/server.js` route registration | No new routes required for this story |
| Any file under `artefacts/` | Read-only pipeline artefacts |

---

## Cross-story schema dependencies

| Dependency | Story | Type | Notes |
|------------|-------|------|-------|
| iwu.2 must be merged before iwu.3 E2E tests pass | iwu.3 | DOM structure | iwu.3 injects cards into #assumption-cards; unit tests mock DOM but E2E requires real section present |
| iwu.2 must be merged before iwu.5 E2E tests pass | iwu.5 | DOM structure | Nudge bar query requires #assumption-cards section |

Note: These are implementation dependencies for later stories. They do not block iwu.2 implementation itself.

---

## E2E test spec location (H-E2E requirement)

**Playwright spec file:** `tests/e2e/iwu2-right-panel-layout.spec.js`
**AC covered:** AC4 — #assumption-cards max-height 42% enforced by CSS; #draft-content fills remaining space
**Tooling confirmed:** Playwright configured at playwright.config.js; webServer: node src/web-ui/server.js; testDir: tests/e2e; withAuth fixture at tests/e2e/fixtures/auth.js

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 2 unit + 1 integration | — | — |
| AC2 | ✅ 1 unit | — | — |
| AC3 | ✅ 1 unit | — | — |
| AC4 | ✅ 1 Playwright E2E | — | CSS-layout-dependent; E2E tooling configured |
| AC5 | ⚠️ Partial (axe-core DOM check) | ✅ Manual | AT boundary announcement — acknowledged |
| NFR-A11Y | ✅ 1 integration (axe-core) | ✅ Manual | Announcement depth manual only — acknowledged |
