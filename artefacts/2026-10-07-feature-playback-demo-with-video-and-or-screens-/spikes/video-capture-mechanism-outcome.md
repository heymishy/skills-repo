# Spike Outcome: Video capture mechanism for the playback package

**Date:** 2026-10-15
**Feature:** 2026-10-07-feature-playback-demo-with-video-and-or-screens-
**Trigger:** `/clarify`'s own remaining open question ("[ASSUMPTION] Chrome's built-in screen recording or a Node.js equivalent...") — the operator asked for real research before picking, specifically flagging that "Chrome's built-in recording" was ambiguous (a human manually using Chrome's own screen-record feature vs. a browser-automation tool driving Chrome programmatically) and asking which actually gives the best result.
**Verdict:** Use Playwright's own built-in `recordVideo` browser-context option. Not `puppeteer-screen-recorder`/`puppeteer-capture`, and not a human manually using Chrome's own screen-record UI.

---

## What was found

1. **The original question conflated two different things.** "Chrome's built-in screen recording" as originally framed in discovery.md meant a *human* manually recording their own screen. That's not actually a serious MVP candidate once automation is the goal — it's the one option that requires exactly the engineer effort ("doesn't require the user to do anything") the operator correctly flagged as the deciding factor. The real comparison is between Playwright's own built-in video capture and Puppeteer-based alternatives — both are *programmatic* (zero human-in-the-loop) capture mechanisms.

2. **Playwright already has this capability built in — no new dependency.** Setting `recordVideo: { dir, size }` on the browser context (not the browser) records video automatically for everything that happens in that context; the file finalises when the context closes. Playwright is already a `devDependency` in this repo (ADR-018) and is the exact same tool already driving every E2E spec written this session (`jae-s5`, `jcx-s6`, `cnsf-s1`'s own route checks) — reusing it here is a direct application of ADR-026 (reuse an existing capability before introducing a new one), not a new automation framework running alongside Playwright.

3. **No independent source shows puppeteer-screen-recorder/puppeteer-capture producing a materially better result.** The only direct comparison found is a competing tool's own README (`puppeteer-capture`), which is a self-interested claim, not an independent benchmark — it describes Playwright's built-in recording and `puppeteer-screen-recorder` as both screencast-based with real-time frame timing, differing mainly in reproducibility/determinism (a concern for CI-stability of the RECORDING process itself, not output quality). No source found measured frame-rate, bitrate, or visual-quality differences between them. [puppeteer-capture README](https://cdn.jsdelivr.net/npm/puppeteer-capture@1.58.0/README.md)

4. **This is the mainstream pattern, not a weak choice.** Multiple independent tools converge on the same shape: script the demo flow as versioned config/code, drive it headlessly through a browser-automation tool, encode the result with `ffmpeg`. [`demo-video-recorder`](https://pypi.org/project/demo-video-recorder/0.1.4/)'s own browser mode explicitly uses "Playwright's built-in video capture" specifically so headless demos don't need OS-level screen-recording permissions (relevant if this skill ever runs in CI, not just interactively). [webreel](https://webreel.dev/) and an [OpenClaw demo-video skill](https://skills.sh/openclaw/skills/demo-video) both follow the same record-via-automation-then-ffmpeg-encode shape, using a CDP screencast rather than Puppeteer's own recorder.

5. **One new, concrete implementation detail for `/definition` to carry forward:** Playwright writes `.webm` files, one per page/context — not MP4. Discovery's own Constraints section already requires "MP4 or equivalent — no proprietary format." An `ffmpeg` encoding step is needed to convert `.webm` → MP4. `ffmpeg` is a system binary, not an npm package, so it falls outside ADR-011's "no new npm dependencies" framing but is still a new tool-availability requirement `/definition` must name explicitly (confirm it's available in whatever environment actually runs this skill — local dev machine and/or CI).

## Recommendation

- **Capture mechanism:** Playwright's built-in `recordVideo` browser-context option. Zero new npm dependency; reuses the exact tool and pattern already proven in this repo this session.
- **Encoding:** `ffmpeg` for `.webm` → MP4 conversion, named as a new tool-availability requirement (not an npm dependency) for `/definition` to confirm.
- **Not recommended:** `puppeteer-screen-recorder`/`puppeteer-capture` — would introduce a second browser-automation framework (Puppeteer) alongside the one already standard in this repo (Playwright, ADR-018), with no demonstrated quality benefit to justify it.
- **Not recommended:** Manual human screen recording via Chrome's own UI — fails the operator's own stated "doesn't require the user to do anything" criterion; already effectively ruled out by the MVP's own automated-capture direction.

## Sources

- [puppeteer-capture README](https://cdn.jsdelivr.net/npm/puppeteer-capture@1.58.0/README.md) — the only direct feature comparison found; a competing tool's own claim, not an independent benchmark
- [Record a product demo with Playwright — Flavio Copes](https://flaviocopes.com/record-demo-video-playwright/) — Playwright `recordVideo` setup, context-level configuration, `.webm` output format
- [demo-video-recorder (PyPI)](https://pypi.org/project/demo-video-recorder/0.1.4/) — browser-mode demo recording using Playwright's built-in video capture specifically to avoid OS screen-recording permissions
- [webreel.dev](https://webreel.dev/) — scripted headless recording with cursor/keystroke overlay, ffmpeg encoding
- [OpenClaw demo-video skill](https://skills.sh/openclaw/skills/demo-video) — Playwright CDP screencast + ffmpeg encoding pattern

## Discovery fields resolved

- `## Assumptions and risks`: the `[ASSUMPTION]` entry for video capture mechanism — resolved. Replace with `[RESOLVED 2026-10-15, per spike]`.
- `## /clarify recommendation`: the first remaining bullet — resolved; only the staging-access confirmation bullet remains, and that was independently confirmed by the operator in the same `/clarify` session (Playwright E2E already targets this repo's staging-equivalent webServer target).
