# What's in This Release — Feature Playback Demo Package (2026-10-18)

**Available from:** 2026-10-18

---

## What's New

### Sponsors can now watch a short, automatically-produced recap of any finished feature

Once a feature is fully done and checked, you can now open a new "Playback" page in the app, pick that feature, and see a plain summary of what it does and why — followed by a section for each piece of work showing exactly what was promised and a screenshot or short video proving it was actually delivered. This replaces the old way of being handed a folder of files or a list of file paths to open yourself.

### The playback page now tells you, at a glance, how much evidence is actually ready to look at

Some features are still mid-way through having their proof screenshots collected. Rather than scrolling through dozens of "nothing to show here yet" lines to work that out yourself, the page now opens with a single line — "11 of 41 pieces of evidence are ready" — so you know immediately whether a feature's recap is ready for a proper look or still being put together.

---

## What We Fixed

### A page that could have crashed the site for 10 hours is now fixed

Early in building this, one version of the new playback page accidentally depended on a file that only exists on a developer's own computer, not on the real website. For about 10 hours, that made the real site's "staging" (testing) version crash every time it tried to start. We found and fixed this the same day, and the fix is now part of this release — but we're mentioning it here because it's a real thing that happened, not something to quietly leave out.

---

## What's Not in This Release

The automatic, hands-free way of taking the proof screenshots and videos is **not** part of this release. Right now, someone still has to sit down, log in, and manually click through the feature to capture the evidence. We looked into building the fully automatic version during this work and found it's genuinely possible, but needs its own dedicated piece of work (login handling, in particular) — that's being scoped separately, not bundled into this release.

---

## Questions?

Ask in this repo's own chat/session, as usual — no separate support channel configured.
