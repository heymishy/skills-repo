# Implementation Plan: Add the "Product in Action" Demo Section to the Landing Page

**Story:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Test plan:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s7-test-plan.md
**DoR:** artefacts/2026-09-18-design-system-adoption/dor/dsa-s7-dor.md
**Date:** 2026-09-19

---

## Pre-flight facts (independently verified before writing this plan)

- **Real target file:** `src/web-ui/templates/landing.html` (447 lines, post-`dsa-s3`), same self-contained file with its own inline `<style>`/`<script>`, read into `_LANDING_HTML` by `public.js` and served by `handleRoot` for `GET /`. No change needed elsewhere.
- **Exact insertion point:** between the hero-cards `.section-1120` block (closes at line 359, `</div>`) and the self-improving card's `.section-centered` block (opens at line 361). A new section goes there — matches the mock's own real ordering exactly (2-up hero-card grid → "Product in action" → self-improving closing card → auth panel).
- **Real token mapping to the mock's own hardcoded hex values** (confirmed by reading both the mock file and `html-shell.js`'s real `[data-theme="dark"]` block):
  - Traffic-light dots: `#F87171` → `var(--danger)`, `#F59E0B` → `var(--warn)`, `#34D399` → `var(--success)`
  - URL-bar strip background `#161A1F` → `var(--surface-2)`; its bottom border `#23272E` → `var(--line)`
  - URL-bar text `#6B7280` → `var(--muted-2)`
  - Outer frame border `#23272E` → `var(--line)`; frame radius `14px` (matches `.hero-cards-grid .hero-card`'s own `border-radius:14px`, reuse the same value)
  - Frame box-shadow: mock uses `0 40px 100px -20px rgba(0,0,0,0.6)` — this is a fixed shadow value, not tokenized elsewhere in this codebase; use it as-is (a shadow, unlike a fill/text color, isn't part of the tokenized palette in `DESIGN.md`'s own table)
  - Heading/copy: `.section-centered`'s own existing text-align/max-width pattern already used by the self-improving card immediately below — reuse it for this section's own heading+copy, do not invent a new container class
- **Existing honest-placeholder text pattern in this codebase** (`products.js:183-185`, the zero-products dashboard CTA): `<p style="...color:var(--muted)">` for explanatory/placeholder copy — reuse this exact styling convention for AC2's placeholder text, not a new pattern.
- **Real regression-guard suite this task must not break** (same list `dsa-s3` established and already re-verified clean on this branch during `/branch-setup`): 9 Node check-scripts (`check-lab-s1.2-landing-page.js`, `check-lphf-s1` through `s5`, `check-ccrh-s1-real-instruction-hash.js`, `check-lccf-s1-fail-open-learnings-count.js`, `check-rpiw-s1-real-route-posthog-wiring.js`) + `NODE_ENV=test npx playwright test` on `lphf-s1` through `s5` + `dsa-s3-landing-restyle.spec.js` (15 tests total).
- **Placeholder implementation approach — decided here, not deferred further:** a CSS-only placeholder (no `<img>` element at all yet) inside the existing `aspect-ratio:16/9` demo area — a centered `<p>` reading "Demo coming soon" styled with `var(--muted)`, matching the codebase's own established zero-state text pattern. This avoids any new asset-serving route or a broken/empty `<img src>` — AC3's swap-in point is a single, clearly-commented line: replace the placeholder `<p>` with `<img src="/product-demo.gif" alt="...">` (or a `<video>` if a future story judges that better) once a real asset exists. No new static file needed for this story itself.

---

## Task 1: Add the "Product in action" section — structure, tokens, mobile breakpoint, placeholder (AC1, AC2, AC3, AC4, AC5)

**Files:**
- Modify: `src/web-ui/templates/landing.html`

- [ ] **Step 1: Read the exact current state first**

Re-read `src/web-ui/templates/landing.html` in full (447 lines) immediately before editing — confirm line numbers/structure above are still accurate (this plan was written against the current committed state on this branch; if it has changed, re-derive the insertion point, do not assume the line numbers are still exact).

- [ ] **Step 2: Write the failing tests**

Extend `tests/e2e/dsa-s3-landing-restyle.spec.js` (reuse the existing file, add new tests — do not create a parallel spec file for the same page) with 5 new tests covering:
- AC1: "Product in action" heading + browser-chrome frame present (3 dot elements with the real `--danger`/`--warn`/`--success` computed colors, a label element with real `--muted-2` computed color)
- AC2: the placeholder text element is visible and its text content does NOT claim to be a real screenshot (e.g. assert it contains "coming soon" or equivalent, not empty, not a broken `<img>`)
- AC4: dark/light mode computed token values for the frame's border/background match `DESIGN.md`'s tables (reuse the same token-reading helper the file's own AC1/AC2 tests already use)
- AC5: at 375px/390px, the frame's own real rendered width does not exceed the viewport width (measure via `getBoundingClientRect().width`), and `document.body.scrollWidth` still does not exceed the viewport width
- AC6 (regression): no new test needed — this AC is verified by re-running `dsa-s3`'s own existing suite unmodified in Step 6 below, per the test plan.

- [ ] **Step 3: Run tests — must fail** (section not yet added)

- [ ] **Step 4: Write the implementation**

Add new CSS (inside the existing `<style>` block, near the other section-specific rules like `.hero-cards-grid`) and new HTML (between lines 359/361 as identified above):

```css
/* ── "Product in action" demo section (dsa-s7) — browser-chrome-framed
   placeholder, real GIF asset swap-in deferred to a future story. ── */
.demo-frame {
  border-radius: 14px; overflow: hidden; border: 1px solid var(--line);
  box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6);
}
.demo-frame__chrome {
  height: 36px; background: var(--surface-2); display: flex; align-items: center;
  gap: 8px; padding: 0 14px; border-bottom: 1px solid var(--line);
}
.demo-frame__dot { width: 11px; height: 11px; border-radius: 50%; }
.demo-frame__dot--danger { background: var(--danger); }
.demo-frame__dot--warn { background: var(--warn); }
.demo-frame__dot--success { background: var(--success); }
.demo-frame__url {
  margin-left: 12px; font-family: var(--mono); font-size: 11.5px; color: var(--muted-2);
}
.demo-frame__body {
  position: relative; width: 100%; aspect-ratio: 16/9; background: var(--bg);
  display: flex; align-items: center; justify-content: center;
}
/* dsa-s7 AC3 swap-in point: replace this <p> with a real <img>/<video> once
   a real demo GIF asset exists -- e.g.
   <img src="/product-demo.gif" alt="Skills Platform in action" style="width:100%;height:100%;object-fit:cover">
   No other markup or CSS change should be needed. */
.demo-frame__placeholder { color: var(--muted); font-size: 14px; }

@media (max-width: 768px) {
  /* dsa-s7 AC5: frame scales with its own section's existing padding
     collapse (see .section-centered's own mobile rule above) -- no
     additional override needed here since aspect-ratio + width:100%
     already scale correctly; verify this empirically in Step 5, don't
     assume. */
}
```

```html
<div class="section-centered">
  <h2 class="hero-card-heading">Product in action</h2>
  <p class="hero-card-text">From skill session to shipped board, in the actual product.</p>
  <div class="demo-frame">
    <div class="demo-frame__chrome">
      <span class="demo-frame__dot demo-frame__dot--danger"></span>
      <span class="demo-frame__dot demo-frame__dot--warn"></span>
      <span class="demo-frame__dot demo-frame__dot--success"></span>
      <span class="demo-frame__url">skills-framework.fly.dev</span>
    </div>
    <div class="demo-frame__body">
      <p class="demo-frame__placeholder">Demo coming soon</p>
    </div>
  </div>
</div>
```

Verify `.section-centered`'s own real CSS rule (read it directly, don't assume) provides the right max-width/centering/margin for this new block before using it — if it doesn't fit cleanly (e.g. it was written narrowly for just the self-improving card's own content), adjust with a scoped additional class rather than fighting the existing rule.

- [ ] **Step 5: Run tests — must pass**

Explicitly verify AC5's mobile behavior empirically (real Playwright viewport check, not just reading the CSS) — the plan's own guess above (that no extra `@media` override is needed) must be confirmed, not assumed. If the frame does overflow or clip at 375/390px, add the necessary override and update the CSS comment accordingly.

- [ ] **Step 6: Run the full regression suite**

```bash
node tests/check-lab-s1.2-landing-page.js
node tests/check-lphf-s1-golden-trace-demo.js
node tests/check-lphf-s2-scope-contract-card.js
node tests/check-lphf-s3-crypto-verification-card.js
node tests/check-lphf-s4-self-improving-card.js
node tests/check-lphf-s5-auth-panel-restyle.js
node tests/check-ccrh-s1-real-instruction-hash.js
node tests/check-lccf-s1-fail-open-learnings-count.js
node tests/check-rpiw-s1-real-route-posthog-wiring.js
NODE_ENV=test npx playwright test tests/e2e/lphf-s1-keyboard-nav.spec.js tests/e2e/lphf-s2-responsive.spec.js tests/e2e/lphf-s3-responsive.spec.js tests/e2e/lphf-s4-responsive.spec.js tests/e2e/lphf-s5-responsive.spec.js tests/e2e/dsa-s3-landing-restyle.spec.js
```

All must pass unmodified (AC6). If any fails, investigate whether this section's new markup shifted something unrelated (e.g. an unintended CSS cascade effect) before assuming it's unrelated.

- [ ] **Step 7: Accessibility check (NFR)**

Confirm the placeholder `<p>` has real, non-empty text content serving as its own accessible name (no `alt`-text gap, since it's a `<p>` not an `<img>` — this sidesteps the empty-alt-text risk an `<img>` placeholder would have carried). Note in the commit message that WCAG's flashing-content guidance is N/A for this story's own static placeholder (no real media file yet) and remains a follow-up-story concern per the story's own NFR section.

- [ ] **Step 8: Run ci-typecheck**

- [ ] **Step 9: Commit**

```bash
git add src/web-ui/templates/landing.html tests/e2e/dsa-s3-landing-restyle.spec.js
git commit -m "feat(dsa-s7): add the 'Product in action' demo section with a static placeholder (AC1-AC5)"
```

---

## Task 2: Full regression verification (AC6) + npm test + live browser check

**Files:** verification only, no source changes expected (fix forward if Task 1 missed something).

- [ ] **Step 1: Re-run the full Task 1 regression suite** (same commands as Task 1 Step 6) — confirm clean on the committed state.

- [ ] **Step 2: Run the full Node suite**

```bash
npm test
```

Foreground, wait for completion. Expect the SAME baseline already acknowledged at `/branch-setup` time (see `decisions.md`'s dedicated entry): `tests/check-p3.5-validate-trace.js` (already-documented pre-existing), plus possibly `check-lccf-s1`/`check-lcdf-s1`/`check-pcr-s1-test-runner.js` recurring as test-order/timing artifacts (re-run any of these standalone to distinguish real regression from the already-documented pattern before flagging anything new).

- [ ] **Step 3: Live browser render check**

Given this story's own established precedent (`dsa-s1`/`dsa-s2`/`dsa-s3` all found real value in this check, and `dsa-s3`'s own live-staging check just confirmed the Chrome tooling is currently working), load the real page with this new section, both light and dark mode, at both a normal desktop viewport and a real mobile viewport if achievable. Confirm: the browser-chrome frame renders correctly (dots, URL label, placeholder text), no unstyled elements, and it visually fits into the page's existing flow between the hero cards and the self-improving card without an awkward gap or overlap.

- [ ] **Step 4: Commit if any fixes were needed** (separate commit, own clear message)

---

## Post-plan note for /verify-completion

This story's diff touches `src/web-ui/templates/landing.html` — the same real, live, first-impression page `dsa-s3` already restyled. `/verify-completion`'s mandatory live browser render check applies, and per `dsa-s3`'s own recent experience, Claude-in-Chrome tooling was confirmed working as of this plan's own writing (2026-09-19) — use it directly rather than assuming another RISK-ACCEPT is needed, but if it disconnects again, follow the same documented RISK-ACCEPT path already established twice in this feature.

Any RISK-ACCEPTs already logged in `decisions.md` for this story (the `/branch-setup` baseline acknowledgement) carry forward — no new action needed at `/verify-completion` for that one.
