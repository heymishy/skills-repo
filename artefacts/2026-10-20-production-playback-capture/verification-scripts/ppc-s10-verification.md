# AC Verification Script: ppc-s10 — Capture evidence now appears, and is reachable from the UI

**Audience:** Platform Owner / domain expert sign-off before coding, and post-merge smoke test.
**Setup:** A production (or staging) deployment with the `ppc-s9` capture pipeline already working (GitHub Actions dispatch succeeds and uploads a real artifact). You'll need a feature that has reached "Definition of Done" and has a connected product.

---

## Scenario 1 — A captured screenshot/video actually shows up (covers AC1, AC2)

1. Open a feature's Playback Evidence page (`/products/<productId>/playback-evidence/<featureSlug>`).
2. Click "Capture evidence" for any AC that has a target set.
3. Wait for the capture to finish (the page will stop showing "Capture in progress...").
4. Reload the page.

**Expected result:** You should see a real screenshot image and/or a playable video on the page for that AC — not a broken-image icon, and not a blank video player that won't load. If you right-click the image and open it in a new tab, it should load normally (not show an error page).

---

## Scenario 2 — Direct image/video link works even without reloading the page first (covers AC2)

1. With a capture already completed (from Scenario 1), copy the image's own link (right-click the screenshot → "Copy image address", or similar).
2. Open that link directly in a new browser tab, without visiting the Playback Evidence page first in that tab.

**Expected result:** The image loads directly. It should not show `{"error":"not found"}` or any error text.

---

## Scenario 3 — There's a visible way to get to the capture evidence page (covers AC3)

1. From the main Journeys list, open a feature that has reached "Definition of Done" and is linked to a product.
2. Click into that feature's "Definition of Done" stage (the same place you'd go to read its DoD writeup).

**Expected result:** On that page, alongside the DoD writeup, you should see a clearly labelled link such as "Playback evidence" (exact wording may vary slightly). Clicking it should take you straight to that feature's Playback Evidence page — you should never need to manually type or construct that page's URL yourself.

---

## Scenario 4 — No broken link for a feature with no connected product (covers AC4)

1. Find (or imagine) a feature that has reached "Definition of Done" but has no product linked to it.
2. View that feature's "Definition of Done" stage page.

**Expected result:** No "Playback evidence" link appears on this page. (If one did appear and you clicked it, it would lead to an error page — this scenario confirms that link is correctly left out instead.)

---

## Reset instructions

Scenarios 1 and 2 share state (both use the same completed capture) — do Scenario 1 first, then Scenario 2 immediately after, without re-triggering a new capture in between. Scenarios 3 and 4 are independent of 1/2 and of each other; no reset needed between them.

---

## Smoke test command reference (for the engineer running post-merge verification, not required reading for sign-off)

```powershell
# PowerShell — load .env then start server locally if verifying off production
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Automated test run: `node scripts/run-all-tests.js` (full suite) — new tests for this story are named `check-ppc-s10-*.js`.
