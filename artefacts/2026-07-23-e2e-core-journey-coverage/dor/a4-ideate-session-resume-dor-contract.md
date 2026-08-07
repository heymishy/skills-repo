## Contract Proposal — Assert full session close/resume mid-SSE-stream for the ideate canvas

**What will be built:**
- A Playwright spec (`tests/e2e/a4-ideate-session-resume.spec.js`) that continues A3's session, closes the browser context mid-SSE-stream, reopens it, and asserts canvas/turn-history restoration and context-aware continuation.
- An Integration test reading the session-state store directly (via the same read path used elsewhere) to assert `pendingSectionDraft` presence (AC1) and `canvasBlocks` presence (AC4) — both structural proofs that the existing `mergeRedisSessionData` denylist-restore mechanism (from `wusl-s2`) behaves correctly for this session type.
- An additional E2E test for the Security NFR: an unauthenticated/different-tenant request to the same session URL is rejected.

**What will NOT be built:**
- Any change to `mergeRedisSessionData` itself — this story only tests the already-shipped mechanism.
- Cross-device/cross-browser resume testing — same-context resume only.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration: close mid-stream, query session store for `pendingSectionDraft` | Integration |
| AC2 | E2E: reopen session, assert canvas + turn history match | E2E |
| AC3 | E2E: send new turn referencing prior context, assert coherent response | E2E |
| AC4 | Integration: query session store for `canvasBlocks` | Integration |

**Assumptions:**
- `mergeRedisSessionData`'s denylist mechanism (already shipped, `wusl-s2`) requires no code changes for this story to pass — this story is purely a regression-guard test addition.

**Estimated touch points:**
Files: `tests/e2e/a4-ideate-session-resume.spec.js`, `tests/check-a4-session-store-state.js`
Services: `wuce-staging`
APIs: session-state read API (existing, reused from `wusl-s1`/`wusl-s2`)

---

**ADR-008 amendment (2026-07-23, during implementation):** `src/web-ui/routes/skills.js` is added as a touch point. Implementing the Security NFR test found that `handleGetChatHtml` (the GET route a browser reloads/reopens to resume any skill session) had no tenant/ownership check at all — any authenticated user could view any other tenant's session content. This was not a "no code change needed" case like AC1-AC4's `mergeRedisSessionData` restore mechanism; the NFR test requires this fix to be genuinely testable. See `decisions.md`'s "a4: `handleGetChatHtml` ... had no tenant/ownership check at all" entry for the full rationale, implementation, and verification. `mergeRedisSessionData` itself remains untouched, per this contract's original "What will NOT be built" list.
