# wugs-s6 manual sandbox verification (post-merge, RISK-ACCEPT)

**Why this exists:** `wugs-s6`'s DoR required a real manual test against a sandbox GitHub repo before merge, confirming the actual GitHub API response shapes match what `tests/check-wugs-s6-branch-pr-creation-adapter.js` mocks (CLAUDE.md's mock-shape-verification rule). PR #726 merged without it. See the RISK-ACCEPT entry dated 2026-08-13 in `decisions.md`. This doc is the runnable procedure to close that gap.

## Steps

1. **Create a disposable sandbox repo** on your own GitHub account — public or private, doesn't matter. Example name: `wugs-s6-sandbox`. Initialize it with a README so the default branch (`main`) has at least one commit (the adapter reads the default branch's ref, which requires it to exist).

2. **Generate a GitHub Personal Access Token** scoped to that one repo:
   - Classic PAT: `repo` scope.
   - Fine-grained PAT: Contents (read/write) + Pull requests (read/write), repository access limited to `wugs-s6-sandbox`.

3. **Run the verification script** from the repo root:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here GITHUB_OWNER=your-github-username GITHUB_REPO=wugs-s6-sandbox \
     node artefacts/2026-08-11-web-ui-guardrails-standards-surface/reference/wugs-s6-manual-verification.js
   ```
   (PowerShell: `$env:GITHUB_TOKEN='ghp_...'; $env:GITHUB_OWNER='...'; $env:GITHUB_REPO='wugs-s6-sandbox'; node artefacts/2026-08-11-web-ui-guardrails-standards-surface/reference/wugs-s6-manual-verification.js`)

4. **This performs real writes** — it creates a real branch, commits a real file under `standards/`, and opens a real PR on your sandbox repo. That's intentional: it exercises the exact code path production uses.

5. **Read the logged output.** The script logs every raw GitHub API request/response as it happens (5 steps: read default branch ref, create branch ref, check file existence, PUT file, create PR). Compare each step's logged shape against the equivalent mocked response in `tests/check-wugs-s6-branch-pr-creation-adapter.js`'s `mockFetchSequence()` calls (e.g. the `AC1` test's mock sequence for the new-file path).

6. **Record the outcome:**
   - If every shape matches (script prints `=== SUCCESS ===` and the real PR opens correctly): add a comment on PR #726 confirming the shapes matched, and update the RISK-ACCEPT entry in `decisions.md` to note it's now verified.
   - If any shape differs (script prints `=== FAILED ===`, or succeeds but you notice a field the code doesn't use that it should, or a field the code assumes exists that doesn't): this is a real production bug in `src/web-ui/adapters/guardrail-pr-adapter.js`. File it as a short-track story (`/test-plan` → `/definition-of-ready` → coding agent) rather than a silent hotfix, per this repo's artefact-first rule.

7. **Clean up the sandbox repo** afterward (delete the test branch/PR/file, or delete the whole repo) — it's disposable.
