# PR — web-ui redesign (Notion-calm)

> Title suggestion: `web-ui: Notion-calm redesign of all SSR HTML routes`
> Branch suggestion: `feat/web-ui-redesign`

---

## What this PR does

Replaces the visual layer of `src/web-ui/` with a calm, document-y design
language aimed at non-engineer users running the discovery → DoR-ready stories
pipeline.

The current UI is a server-side rendered HTML app with one shared shell
(`utils/html-shell.js`) and per-route HTML built inline in
`routes/skills.js`, `routes/dashboard.js` etc. **This PR keeps that
architecture exactly as-is.** No SPA, no build step, no new runtime
dependencies. The change is:

- A rewritten `utils/html-shell.js` with a sidebar layout, design tokens, and
  a typographic system (Inter for chrome, Source Serif 4 for prose).
- Seven new pure-function view modules under `src/web-ui/views/` that produce
  the `bodyContent` strings each route renders. Routes are unchanged in shape
  — only the HTML they emit moves.
- Empty states for `/actions` and `/features` that were previously bare-bones.
- A reworked `/skills/:name/sessions/:id/next` page: it becomes a proper chat
  thread on the left with a live artefact-draft pane on the right, fed
  directly from existing session state (`session.sections`,
  `session.sectionDrafts`, `session.pendingSectionDraft` — no schema changes).

## Screens covered

| Route | Status |
|---|---|
| `GET /dashboard` | Greeting + skill launcher grid + waiting-on-you + recent sessions |
| `GET /features` | Pipeline-dot table; empty state for new workspaces |
| `GET /features/:slug` | (unchanged in this PR — feature-detail view) |
| `GET /artefact/:slug/:type` | Document layout + sign-off panel + comments rail |
| `GET /skills` | (uses existing list, picks up new shell automatically) |
| `GET /skills/:n/sessions/:id/next` | Split-pane: chat thread + live draft |
| `GET /skills/:n/sessions/:id/commit-preview` | Review & commit |
| `GET /skills/:n/sessions/:id/result` | Success state + next-skill nudge |
| `GET /actions` | Empty state added |
| 409 `ARTEFACT_CONFLICT` | "Already committed" page |

## What's not in this PR

- The `/api/artefacts/:slug/:type/annotations` endpoint that the artefact
  comment form posts to — the form is rendered, the route is a follow-up.
- Real `signoffs[]` / `comments[]` storage — views accept the data and degrade
  to empty panels when none is supplied.
- Any change to authentication, session lifecycle, or commit logic.
- Any change to the JSON API endpoints (`POST /api/skills/...`).

## Risk

**Low.** The blast radius is HTML + CSS in the response body of routes whose
handler logic and contracts are untouched. The single API change is one new
optional property on `renderShell` (`active`, `crumbs`, `headerActions`) — all
defaulted, so old callers compile unchanged.

The only behaviour change worth flagging:

- The chat page now reads `session.sections`, `session.sectionDrafts`,
  `session.pendingSectionDraft`, and `session.currentSectionIndex` to render
  the right-hand draft pane. These already exist (set by `dsq.2` flow in
  `htmlRecordAnswer`); we're just surfacing them. **No change to writers.**

## Test plan

Manual smoke tests against a real GitHub-authenticated dev session:

- [ ] `/dashboard` loads, sidebar shows correct active state, skill cards
      render and POST starts a session.
- [ ] `/features` loads with seeded features and with zero features (empty
      state).
- [ ] `/artefact/<slug>/<type>` loads, prose is in serif, sidebar shows
      sign-off & comments panels (empty arrays render fine).
- [ ] Run a full skill end-to-end:
  - [ ] First question renders in chat layout, draft pane shows all sections
        as "Not yet".
  - [ ] After answering, prior Q&A appear above the next question with the
        coach insight bubble.
  - [ ] When a section boundary is hit (`pendingConfirmation = true`), a
        confirmation banner appears in the chat input area and the relevant
        draft section flips to "Confirm" tone.
  - [ ] After typing `confirm`, the section flips to "Drafted" and the next
        question loads.
  - [ ] At the end, `/commit-preview` shows the file path, raw content,
        editable commit message, and reviewer chips.
  - [ ] `/result` shows green check, file link, and (if configured) a
        "Next up: …" nudge.
  - [ ] Re-submitting commit returns 409 → "Already committed" page renders.
- [ ] `/actions` with zero items → empty state.
- [ ] Unauthenticated requests still 302 to `/auth/github`.
- [ ] Existing JSON API tests still green (no behaviour change).

## Files touched / added

```
M  src/web-ui/utils/html-shell.js            (rewritten — same exports)
A  src/web-ui/views/components.js            (NEW — pill/btn/avatar helpers)
A  src/web-ui/views/dashboard-view.js
A  src/web-ui/views/features-view.js
A  src/web-ui/views/artefact-view.js
A  src/web-ui/views/chat-view.js
A  src/web-ui/views/commit-view.js
A  src/web-ui/views/actions-view.js
M  src/web-ui/routes/dashboard.js            (bodyContent string only)
M  src/web-ui/routes/features.js             (bodyContent string only)
M  src/web-ui/routes/artefact.js             (bodyContent string only)
M  src/web-ui/routes/skills.js               (bodyContent strings only)
M  src/web-ui/routes/actions.js              (bodyContent string only)
```

The route-handler diffs are purely "build the data object, pass it to the
view function, pass the result to `renderShell`". Concrete code shown in
`INTEGRATION.md` (in this folder).

## How to apply

```bash
# from your local clone of heymishy/skills-repo
git checkout -b feat/web-ui-redesign

# copy the eight files from this project's port/src/web-ui/* into your repo
cp -r <this-project>/port/src/web-ui/* src/web-ui/

# apply the per-route diffs from INTEGRATION.md to:
#   src/web-ui/routes/dashboard.js
#   src/web-ui/routes/features.js
#   src/web-ui/routes/artefact.js
#   src/web-ui/routes/skills.js
#   src/web-ui/routes/actions.js

# run your existing test suite
npm test

git push origin feat/web-ui-redesign
```

Then open the PR on `heymishy/skills-repo` with this description.
