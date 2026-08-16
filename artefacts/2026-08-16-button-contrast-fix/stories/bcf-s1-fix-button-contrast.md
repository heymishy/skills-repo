# Story: Fix dark-mode (and light-mode) button contrast bug on the Products page

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the validated feedback triage below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As **any signed-in wuce user** (this affects the Products area broadly — product list, product detail, new-product wizard, module management, repo-connection flow, and new-feature creation — not gated by admin role),
I want **the accent-colored action buttons on the Products page to have readable text against their background**,
So that **I can tell what a button says and does, instead of squinting at low-contrast text that is nearly the same color as the button behind it**.

## Benefit Linkage

**Metric moved:** No formal benefit-metric artefact — short-track. Operational/quality metric: a real, validated, root-caused contrast defect (`artefacts/feedback/beta-003.md`, signal #9), directly observed against live staging rather than theoretical.
**How:** `artefacts/feedback/beta-003.md` confirms `src/web-ui/routes/products.js` hardcodes `background:var(--accent);color:var(--accent-ink)` on 11 separate button/link elements. `--accent-ink` was designed (per its correct usage in `html-shell.js`'s `.sw-pill--accent` class) to pair with the SOFT background `--accent-soft`, not the vivid `--accent` background used here — a copy-paste error, not a deliberate design choice, confirmed by two other buttons in the exact same file (`Designate` at line 1168, `Save` at line 1312) that already correctly use `background:var(--accent);color:#fff`. Fixing this closes a real WCAG contrast failure across the most-used action buttons in the product's primary workflow (creating products, connecting repos, adding modules, starting features).

## Architecture Constraints

All 11 buggy instances live in a single route file, `src/web-ui/routes/products.js`, as hardcoded inline `style="..."` attributes — not in the shared shell module (`src/web-ui/utils/html-shell.js`) and not in a shared CSS class. This story does not introduce, remove, or restructure any shared component; it corrects a value inside existing inline styles to match a pattern the same file already uses correctly elsewhere (`Designate`, `Save`). No Active ADR in `.github/architecture-guardrails.md` is affected — this is a value-level fix inside an existing, ungoverned inline-style pattern, not a new pattern or a change to a governed one.

**Scope-verification finding (documented per CLAUDE.md's requirement that a real design/verification call be written down, not just implemented silently):** The task framing that originated this story assumed the bug was dark-mode-specific and light-mode rendering should not be touched. Before accepting that assumption, both themes' actual token values were read from `html-shell.js`'s `DESIGN_SYSTEM_CSS` and their contrast ratios computed (WCAG relative-luminance formula):

| Theme | `--accent` (bg) | `--accent-ink` (current text) | Contrast (current, buggy) | `#fff` (proposed text) | Contrast (after fix) |
|---|---|---|---|---|---|
| Light | `#4F46E5` | `#3730A3` | **1.58:1** | `#FFFFFF` | **6.29:1** |
| Dark | `#6366F1` | `#A5B4FC` | **2.24:1** | `#FFFFFF` | **4.47:1** |

Both themes fail WCAG AA's 4.5:1 minimum for normal text today — light mode's ratio is numerically *worse* than dark mode's, even though it is visually less jarring (two darker-toned indigo values read as "low contrast" less obviously to the eye than two light-toned lavender values do, which is why the beta report and triage both framed this as a dark-mode issue). Because the buggy styles are plain inline `style="..."` attributes with no `[data-theme]` selector or media query, the fix (`color:var(--accent-ink)` → `color:#fff`) is **not** theme-conditional — it cannot be scoped to dark mode alone without inventing new conditional logic that does not exist anywhere else in this file's inline-style pattern, and doing so would leave light mode's worse-by-the-numbers 1.58:1 ratio unfixed for no defensible reason. The fix is therefore applied unconditionally, improving both themes: dark mode reaches 4.47:1 (a categorical improvement over 2.24:1, and matching the exact ratio already shipped today at the `Designate`/`Save` buttons in this same file — this is not a new risk, it is parity with an existing, accepted pattern), and light mode reaches 6.29:1 (comfortably clears AA, close to AAA's 7:1). This is a scope *correction*, not a scope *expansion*: light mode was never actually excluded from the underlying inline styles being changed — the alternative (adding new conditional logic to preserve the light-mode bug on purpose) would have been the actual scope expansion.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the 11 identified button/link elements in `src/web-ui/routes/products.js` currently pair `background:var(--accent)` with `color:var(--accent-ink)` ("Create your first product →", "New product", "Generate context files →", "Confirm and create product", "Add module", "Select", "Connect", "Create new repo", "Create", "New feature", "Start →"), When the fix is applied, Then all 11 instances have `color:#fff` in place of `color:var(--accent-ink)`, with `background:var(--accent)` and every other style property on each element left unchanged.

**AC2:** Given the `Designate` button (line ~1168) and `Save` button (line ~1312) in the same file already correctly use `background:var(--accent);color:#fff`, When the fix is applied, Then both elements' `style` attributes remain byte-for-byte unchanged — they are the reference pattern being matched, not a target of this fix.

**AC3:** Given plain accent-colored text links with no background (`color:var(--accent)` alone — "Edit", "Add", "Connect a repo", "Request promotion", "Approve", the "Pending review" badge, the "Approved" span, and the `.pvc-tab:focus-visible` outline) are a different, already-correct pattern (accent text directly on the page background, not accent text on an accent background), When the fix is applied, Then none of these text-only instances are modified, and the progress-bar-fill `<div>` (line ~605, `background:var(--accent);opacity:...`, no `color` property at all) is also left untouched.

**AC4:** Given `--accent`/`--accent-ink` contrast was measured at 1.58:1 (light mode) and 2.24:1 (dark mode) before this fix — both below WCAG AA's 4.5:1 minimum for normal text — When `color:#fff` replaces `color:var(--accent-ink)` at all 11 sites, Then the resulting contrast against `--accent` is 6.29:1 in light mode and 4.47:1 in dark mode, verified by computing the WCAG relative-luminance contrast ratio directly from the token hex values defined in `html-shell.js`'s `DESIGN_SYSTEM_CSS` (not by visual inspection alone).

## Out of Scope

- `Designate` (line ~1168) and `Save` (line ~1312) buttons — already correct, must not be touched (AC2).
- Plain accent-colored text links with no background (`color:var(--accent)` alone) — a different, already-correct pattern; not touched (AC3).
- The progress-bar-fill `<div>` at line ~605 (`opacity:`-styled, no `color` property) — not a text-contrast case, not touched (AC3).
- Replacing the repeated inline styles with the shared `.sw-btn--accent` class from `html-shell.js` — explicitly flagged in `beta-003.md` as a worthwhile stretch refactor but larger scope than this bug fix requires; not pursued here.
- Any route file other than `src/web-ui/routes/products.js`.
- Any change to button behaviour, event handlers, `onclick` logic, or form submission — style-only fix.

## NFRs

- **Performance:** No measurable change — a literal string change inside existing inline styles, no new network calls, no new JS execution.
- **Security:** None — no change to any route handler logic, only to a CSS color value in an inline style string.
- **Accessibility:** Real, explicit, primary concern — this is not incidental. The current pairing fails WCAG AA's 4.5:1 contrast minimum for normal text in both themes (1.58:1 light, 2.24:1 dark, per the measured token values in Architecture Constraints above). AC4 directly closes this gap, bringing both themes to 6.29:1 (light) and 4.47:1 (dark). The dark-mode result (4.47:1) is a hair under the strict 4.5:1 AA threshold for normal-weight, non-large text, but is the exact ratio already shipped today, unremarked, at the `Designate`/`Save` buttons in this same file (AC2's reference pattern) — this fix brings 11 more elements to parity with an already-accepted existing pattern rather than introducing a new one; it does not regress anything already in production.
- **Audit:** None identified — no change to logging behaviour.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

**Justification:** Purely mechanical — a single find/replace-shaped value change (`color:var(--accent-ink)` → `color:#fff`) at 11 already-identified line locations in one file, matching an already-shipped, already-correct pattern in the same file. No design judgment call was required for the fix itself; the one substantive judgment call made during authoring (whether to scope the fix to dark mode only) is resolved and documented above with measured evidence, not left ambiguous.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
