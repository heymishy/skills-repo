# Review Report: Relocate the theme toggle into Settings — Run 1

**Story reference:** artefacts/2026-08-17-settings-improvements/stories/si-s1-relocate-theme-toggle.md
**Date:** 2026-08-17
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C — AC4 says the click event fires "via the existing `_posthog.capture` convention (event name distinct from any prior topbar-toggle event, since no prior event existed to reuse)" but never names the actual event string. Not blocking — this is a reasonable implementation-time detail — but naming it now (e.g. `settings_theme_toggle_clicked`) would remove ambiguity before /test-plan writes assertions against it.

- **[1-L2]** Category D — The user story's persona line reads "As a **regular team member** (or account owner/admin — this preference is available to all signed-in users)". The parenthetical softening functionally broadens this back toward "as any user," which is the exact generic-persona pattern the story template's own discipline note warns against, even though a real named persona is technically present. Consider dropping the parenthetical and letting the epic's own "affects both personas" framing carry that nuance instead.

- **[1-L3]** Category E — `html-shell.js` is a shared surface module (topbar chrome), and this story does modify it (removing the toggle from the topbar). The Architecture Constraints field correctly identifies `swToggleTheme()` reuse but doesn't explicitly name the "shared surface module change requires its own story" anti-pattern this story is already correctly satisfying (it has its own story). No action needed — noting for self-documentation only, since a future reader checking Architecture Constraints against the anti-pattern table shouldn't have to infer the connection.

---

## Summary

0 HIGH, 0 MEDIUM, 3 LOW across 1 story.
**Outcome:** PASS

---

## Category scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |
| Architecture compliance | 4 | PASS |

**Verdict:** PASS — all criteria scored 3 or above.
