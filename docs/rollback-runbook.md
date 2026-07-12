# Production Rollback Runbook

**Story:** bri-s2.6 — Add staging smoke test + manual promote gate to prod (`artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.6-smoke-test-promote-gate.md`)
**Applies to:** the `skills-framework` Fly app (this repo's production deployment target — see `fly.toml`'s `app =` field; also referred to as `wuce-prod` in earlier story/planning artefacts).
**Scope:** this runbook covers manual rollback after a bad promotion. It is deliberately never live-tested against a real production incident — see the story's test plan Coverage gaps table. Rollback here is manual-but-documented; there is no automated rollback on post-promote failure detection (out of scope per the story).

---

## When to use this runbook

Use this runbook when a promotion to production (via the `promote-to-prod` job in `.github/workflows/staging-deploy.yml`) has gone out and is causing a problem in production — errors, a broken page, a regression a user or Hamish has noticed after promotion completed.

Do not use this runbook for staging issues — staging redeploys automatically on every push to `master` via the `deploy-staging` job, so a bad staging deploy is fixed by simply pushing a fix to `master` (no rollback needed there).

---

## Step 1 — Identify the previous known-good release

List recent releases for the production app to find the version immediately before the bad one:

```bash
fly releases --app skills-framework
```

This prints a table of releases with a version number, status, and the image/description for each. Identify the version number of the last release that was known to be good (the one immediately before the promotion you are rolling back).

---

## Step 2 — Roll back to that release

Fly supports rolling back directly to a previous release version:

```bash
fly releases rollback <version> --app skills-framework
```

Replace `<version>` with the version number identified in Step 1 (for example, `fly releases rollback v42 --app skills-framework`).

### Alternative: redeploy a pinned image

If `fly releases rollback` is unavailable or does not apply cleanly, the previous release's image can be redeployed directly. The image reference for a given release is shown in the `fly releases --app skills-framework` output (or via `fly releases --app skills-framework --image` if that flag is supported by the installed `flyctl` version):

```bash
fly deploy --image registry.fly.io/skills-framework@<sha256-digest> --app skills-framework
```

Replace `<sha256-digest>` with the image digest of the known-good release from Step 1's output.

---

## Step 3 — Verify the rollback

After running either command in Step 2:

1. Confirm the deploy completes with a "successfully deployed" message (or equivalent, depending on `flyctl` version).
2. Check `fly status --app skills-framework` to confirm the machine(s) are `started` and healthy.
3. Manually load the production URL and confirm the issue is resolved.
4. Record the rollback (what was rolled back, from which version to which, and why) in `artefacts/2026-07-09-beta-readiness-infra/decisions.md` as a `RISK-ACCEPT` or `ARCH` entry, consistent with this repo's post-incident documentation convention.

---

## Notes

- Every promotion (who approved it, when, and which staging smoke-test run it was based on) is already recorded in GitHub Actions' own run history for the `promote-to-prod` job — no separate audit log is needed to answer "what was promoted and by whom" when diagnosing an incident (see the story's NFR-Audit).
- This runbook intentionally documents a manual dry-run/walkthrough process rather than an automated rollback mechanism. Automated rollback on post-promote failure detection is explicitly out of scope for this story.
- If `flyctl` command syntax has changed since this runbook was written, run `fly releases --help` and `fly deploy --help` to confirm current flag names before using the commands above verbatim.
