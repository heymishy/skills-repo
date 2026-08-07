# Decisions: Warn at boot time for silently-misconfigured-but-optional env vars

---

**Decision:** GAP — no discovery artefact for this feature
**Date:** 2026-07-29
**Context:** Short-track path (per CLAUDE.md) intentionally skips `/discovery` through `/review` for bugs, small fixes, and bounded refactors.
**Decision:** Proceed without a discovery artefact. H-GOV is acknowledged as a structural short-track exception, not an oversight.
**Rationale:** This story is a bounded, additive-only infra fix matching the short-track profile exactly (Complexity 1, Stable scope, no cross-team dependency). The scope and rationale are fully captured in the story's own Benefit Linkage section, which cites `workspace/learnings.md`'s documented incident history (2026-07-19/20).

---

**Decision:** Excluded `POSTHOG_KEY_STAGING`/`POSTHOG_KEY_PROD` from this story's scope
**Date:** 2026-07-29
**Context:** These two vars were part of the original 4-incident pattern that motivated this story. Investigation of `src/web-ui/modules/posthog-config.js` (bri-s1.2) found `initPostHogFlagsClient()` already logs a clear `console.error` naming the missing variable at module-load time (before `server.listen()`), and never crashes the process — this gap was already closed by prior work, just not explicitly credited as "the env-var-warning fix" until this investigation.
**Decision:** Do not touch `posthog-config.js`. Scope this story to the 3 genuinely still-open cases (`PLATFORM_TENANT_ID`, `ADMIN_GITHUB_LOGINS`, `SKILL_EXECUTOR_PROVIDER`/`ANTHROPIC_API_KEY` pairing).
**Rationale:** Avoids duplicate/conflicting logic for an already-solved case; keeps this story's diff minimal and focused on the real gap.
**Made by:** Claude (agent), during story authoring, 2026-07-29
