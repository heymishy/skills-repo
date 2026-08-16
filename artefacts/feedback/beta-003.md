# Feedback: 2026-08-16 (operator-reported, not beta-user-relayed)

**Source:** Hamish King (operator), direct report while reviewing the product himself.
**Status:** Validated and root-caused against `skills-framework.fly.dev` on 2026-08-16 (Chrome, authenticated as heymishy). Queued — not yet dispatched, per operator's own choice to let the two already-running fixes (`bpe-s1`, `nia-s1`) land first.

---

## Signal 9: Dark-mode button text/background contrast on Products page

**Reported:** "In dark mode the button colours need to change on products page as the colour and text makes it difficult to read the button action."

**Severity:** Medium-High — real WCAG contrast failure, and far more widespread than the single button reported.

**Validation:** Confirmed live. Zoomed screenshot of the "New product" button on `/dashboard?view=list` shows a medium-lavender background (`--accent: #6366F1` in dark mode) paired with a lighter-lavender text color (`--accent-ink: #A5B4FC` in dark mode) — both mid-to-light tones in the same hue family, well below WCAG AA's 4.5:1 contrast minimum for normal text.

**Root cause:** `src/web-ui/routes/products.js` hardcodes inline styles `background:var(--accent);color:var(--accent-ink)` on button/link elements. `--accent-ink` was designed (per its correct usage in `html-shell.js`'s shared `.sw-pill--accent` class) to pair with the SOFT background `--accent-soft` (`#1E1B4B`, dark navy) for readable light-text-on-dark-soft-background — not to pair directly with the vivid `--accent` background. This is a copy-paste error, not a deliberate design choice: two other buttons in the exact same file (`Designate` at line ~1168, `Save` at line ~1312) correctly use `background:var(--accent);color:#fff`.

**Scope — confirmed via `grep -n "var(--accent)" src/web-ui/routes/products.js`:** the buggy pairing (`background:var(--accent)` + `color:var(--accent-ink)`) appears at **11 separate button/link instances**, all in `products.js`:

| Line (approx) | Button label |
|---|---|
| 150 | "Create your first product →" |
| 164 | "New product" (the one originally reported) |
| 194 | "Generate context files →" |
| 208 | "Confirm and create product" |
| 657 | "Add module" |
| 838 | "Select" (repo picker) |
| 852 | "Connect" |
| 873 | "Create new repo" |
| 877 | "Create" |
| 902 | "New feature" |
| 913 | "Start →" |

Not in scope for this fix: plain accent-colored text links with no background (`color:var(--accent)` alone — e.g. "Edit", "Add", "Connect a repo", "Request promotion", "Approve") — these are a different, unrelated, correctly-contrasted pattern (accent-colored text directly on the dark page background) and should not be touched.

**Fix shape:** Mechanical, single-file, low-risk — change `color:var(--accent-ink)` to `color:#fff` at all 11 identified lines, matching the already-correct precedent in the same file. Recommend also considering (as a stretch, not required for the bug fix itself) replacing these repeated inline styles with the shared `.sw-btn--accent` class from `html-shell.js` while touching this file, for consistency — but that's a larger refactor than the reported bug requires; scope decision for `/definition` if pursued.

**Status:** Queued. Operator chose to let `bpe-s1` (billing portal fix) and `nia-s1` (nav icon fix) land first before dispatching a third parallel agent for this one, to keep fewer things in flight at once.
