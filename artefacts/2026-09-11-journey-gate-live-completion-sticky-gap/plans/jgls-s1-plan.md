# The journey-gate "Continue to next stage" control is not sticky when it appears via a live turn completion — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Add the same sticky-positioning CSS properties already shipped on `journeyPanel`'s server-rendered gate (`wnl-s2`) to `showCommitLink()`'s client-side `wrap.style.cssText` — the code path that actually renders when an operator resumes a journey and its stage's turn completes live (the most common real usage path).
**Branch:** `feature/jgls-s1`
**Worktree:** `.worktrees/jgls-s1`
**Test command:** `node tests/check-jgls-s1-live-gate-sticky.js` (new), `npm test` (full baseline)

---

## File map

```
Create:
  tests/check-jgls-s1-live-gate-sticky.js  — 3 new unit tests (AC1, AC2, AC3)

Modify:
  src/web-ui/routes/skills.js  — showCommitLink() (~line 3845): append sticky properties to wrap.style.cssText
```

---

## Task 1: AC1/AC2/AC3 — add sticky positioning to the live-completion gate, guard against future drift

**Files:**
- Modify: `src/web-ui/routes/skills.js`
- Create: `tests/check-jgls-s1-live-gate-sticky.js`

- [x] **Step 1: Write the failing tests**

`tests/check-jgls-s1-live-gate-sticky.js` — renders a chat page for a `done:false`, `journeyId`-set session, extracts `showCommitLink()`'s source from the embedded `<script>`, and asserts its `wrap.style.cssText` contains the sticky properties (AC1) while retaining its existing layout properties (AC2); separately reads `skills.js` from disk and asserts the canonical sticky substring appears at least twice — once for `journeyPanel`, once for `showCommitLink()` (AC3).

- [x] **Step 2: Run test — must fail**

```bash
node tests/check-jgls-s1-live-gate-sticky.js
```

Expected output (against unmodified code): AC1's 5 sticky-property assertions FAIL (none present in `wrap.style.cssText`); AC2's 5 layout-property assertions PASS (pre-existing, unchanged); AC3's occurrence-count assertion FAILS (only 1 occurrence — `journeyPanel`'s — not 2).

- [x] **Step 3: Write minimal implementation**

`src/web-ui/routes/skills.js` (~line 3845), change:
```js
wrap.style.cssText = "padding:10px 12px 2px;display:flex;align-items:center;gap:10px;flex-wrap:wrap";
```
to:
```js
wrap.style.cssText = "padding:10px 12px 2px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500";
```

- [x] **Step 4: Run test — must pass**

```bash
node tests/check-jgls-s1-live-gate-sticky.js
```

Result: `[jgls-s1] 11 passed, 0 failed`.

- [x] **Step 5: Run full suite — no regressions**

```bash
node tests/check-wnl-s2-journey-gate-sticky.js   # 3/3 passing
node tests/check-lsbm-s1-live-substep-injection.js  # 12/12 passing
node tests/check-wnl-s1-context-manifest-collapse.js  # 21/21 passing
npm test  # full baseline
```

- [x] **Step 6: Live smoke check (per decisions.md RISK-ACCEPT)**

Re-verify on `wuce-staging.fly.dev` after this fix deploys: `/journey/:slug/resume` a feature, let the stage's turn complete live, confirm the resulting gate control has `position:sticky;bottom:0` applied and stays visible when scrolling up through chat history — the exact scenario that originally surfaced this bug.

- [x] **Step 7: Commit**

```bash
git add tests/check-jgls-s1-live-gate-sticky.js src/web-ui/routes/skills.js
git commit -m "fix: add sticky positioning to the live-completion journey-gate control

showCommitLink() (the client-side function that injects the 'Continue to
[stage] ->' control when a turn completes live, e.g. via /journey/:slug/
resume) never received the sticky-positioning fix wnl-s2 shipped for the
server-rendered path -- meaning the most common real usage path (clicking
Continue from the journey list) still showed the non-sticky control.
Adds the identical position:sticky;bottom:0;... properties already proven
correct by wnl-s2's own E2E suite, plus a consistency-guard test so a
future change to one path without the other fails CI."
```

---

<!-- All 3 ACs (AC1-AC3) covered by this single task -- AC1's underlying
     CSS mechanism (position:sticky) is already proven correct by wnl-s2's
     own Playwright E2E suite; this task applies the identical, proven
     properties to a second code path and verifies via unit-level string
     assertion plus a manual live smoke check (RISK-ACCEPT, decisions.md). -->
