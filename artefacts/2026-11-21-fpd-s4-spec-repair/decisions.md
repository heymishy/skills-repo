# Decisions: fpd-s4 caption-sync spec repair (fpsr-s1)

## D1. Point the spec at the real feature with committed evidence instead of building a fixture (2026-11-21)

**Context:** the quarantine reason said the spec needs a playback fixture that does not exist. The spec navigates to a placeholder slug that matches no feature, so the page is a 404. The playback page reads the real repository, and the feature `2026-10-11-journey-cx-redesign` already has a committed video, captions and transcript for story `jcx-s3`.
**Decision:** change the spec's `page.goto` to `/playback/2026-10-11-journey-cx-redesign` and update the one expectation in `check-actr-s1-capture-target-derivation.js` that reads the spec's URL. No `src/` change and no new fixture.
**Rationale:** the fixture the matrix reason called missing exists and is real delivery evidence, so the smallest correct repair is a different URL. It tests the product against real captured media, which is a stronger test than a synthetic file, and the assertions that prove caption cues activate during playback are unchanged.
**Alternatives rejected:** generating a tiny WebM and VTT plus a temporary repository root for the test (no ffmpeg on the machine, a temporary root must be wired through the server and would diverge from what real users see, and it adds a fixture to maintain); retiring the spec (it is the only test of caption cues during real playback, since jsdom cannot play media); copying the evidence into `tests/` (a second copy that can drift).
**Risk accepted:** the spec now depends on the `jcx-s3` evidence staying committed under that path. If it is moved the spec fails with the same "video not found" symptom; the DoD records this so a future operator knows where to look.
**Operator go-ahead (2026-11-21, "What do you suggest", then "OK go for it"):** take `fpd-s4` next, starting with a read-only look at whether to repair or retire it.
