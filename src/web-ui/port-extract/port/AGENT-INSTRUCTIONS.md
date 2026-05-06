# Agent implementation instructions — Notion-calm web UI design port

**Task:** Apply this design port to the `src/web-ui/` layer of the skills framework web UI.

**Scope:** Visual layer only. No route logic, no session lifecycle, no auth, no API contracts change. The blast radius is the HTML strings that route handlers return to the browser.

**Constraints:**
- No new npm dependencies (all files use Node.js built-ins; views are pure functions)
- No build step — server-rendered HTML only
- All existing tests must still pass after applying the port
- Do not modify any file under `src/web-ui/routes/` beyond the specific `require` and `renderShell` call-site changes documented below

---

## Step 1 — Copy the new view files

Copy every file from `src/web-ui/port-extract/port/src/web-ui/` into `src/web-ui/`, preserving the sub-directory structure:

```
port/src/web-ui/utils/html-shell.js         → src/web-ui/utils/html-shell.js    (REPLACES existing)
port/src/web-ui/views/components.js         → src/web-ui/views/components.js    (NEW)
port/src/web-ui/views/dashboard-view.js     → src/web-ui/views/dashboard-view.js (NEW)
port/src/web-ui/views/features-view.js      → src/web-ui/views/features-view.js  (NEW)
port/src/web-ui/views/artefact-view.js      → src/web-ui/views/artefact-view.js  (NEW)
port/src/web-ui/views/chat-view.js          → src/web-ui/views/chat-view.js      (REPLACES if present)
port/src/web-ui/views/commit-view.js        → src/web-ui/views/commit-view.js    (REPLACES if present)
port/src/web-ui/views/actions-view.js       → src/web-ui/views/actions-view.js   (NEW)
```

`html-shell.js` is a backwards-compatible drop-in. Existing callers that pass only `{ title, bodyContent, user }` work unchanged. Three new optional props are added: `active` (string — nav item to highlight), `crumbs` (string[] — breadcrumb labels), `headerActions` (HTML string — buttons in the top-right).

---

## Step 2 — Wire view modules into route handlers

For each route handler listed below, add the `require` at the top of the file and replace the inline `bodyContent` string with the view function call.

### `routes/dashboard.js` — `GET /dashboard`

```js
const { renderDashboard } = require('../views/dashboard-view');

// Replace bodyContent with:
const body = renderDashboard({
  greetingName:        req.session.login || 'there',
  dateLabel:           new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }),
  pendingActionsCount: actions.length,
  inProgressCount:     activeSessions.length,
  skills:              skills.map(s => ({
    name:  s.name,
    label: s.displayName || s.name,
    desc:  s.description || '',
    est:   s.estimatedDuration || '15 min',
    stage: s.stage || 'Discovery'
  })),
  actions: actions.slice(0, 4),      // shape: { what, feature, age, you }
  recent:  recentSessions.slice(0, 4)
});

res.end(renderShell({ title: 'Home', bodyContent: body, user: { login: req.session.login }, active: 'dashboard' }));
```

### `routes/features.js` — `GET /features`

```js
const { renderFeaturesList } = require('../views/features-view');

const body = renderFeaturesList({
  features: features.map(f => ({
    slug:          f.slug,
    title:         f.title,
    stage:         f.stage,         // 'discovery'|'definition'|'review'|'delivery'|'committed'
    updated:       humanDate(f.updatedAt),
    owner:         f.ownerLogin,
    artefactCount: f.artefacts.length
  })),
  repoCount: 1
});

res.end(renderShell({ title: 'Features', bodyContent: body, user: { login: req.session.login }, active: 'features', crumbs: ['Features'] }));
```

### `routes/artefact.js` — `GET /artefact/:slug/:type`

```js
const { renderArtefact } = require('../views/artefact-view');

const body = renderArtefact({
  proseHtml:  renderedMarkdownHtml,   // your existing safe HTML from markdown render
  meta: {
    title:       artefact.title,
    feature:     artefact.feature,
    stage:       'In review',
    author:      artefact.author,
    updated:     humanDate(artefact.updatedAt),
    featureSlug: artefact.featureSlug,
    fileSlug:    artefact.fileSlug
  },
  commitSha: artefact.commitSha || null,
  commitUrl: artefact.commitUrl || null,
  signoffs:  artefact.signoffs  || [],   // shape: { login, role, signed }
  comments:  artefact.comments  || []    // shape: { by, text, when, resolved }
});

res.end(renderShell({
  title:         artefact.title,
  bodyContent:   body,
  user:          { login: req.session.login },
  active:        'features',
  crumbs:        ['Features', artefact.feature, artefact.title],
  headerActions: '<button class="sw-btn">Edit</button><button class="sw-btn sw-btn--primary">Sign off</button>'
}));
```

`signoffs` and `comments` are not yet stored in the current session layer — passing `[]` renders an empty panel gracefully. Implementing their storage is out of scope for this port.

### `routes/skills.js` — chat and commit pages

The `handleGetChatHtml` / `_renderChatPage` function already uses `renderChat` from `views/chat-view.js` in the model-first chat architecture (mfc.1). The port's `chat-view.js` is an updated version of the same module. After copying in Step 1, the existing callers continue to work — verify that `_renderChatView` (the internal alias used in `routes/skills.js`) resolves to the new file.

For the commit preview, result, and 409 pages — `routes/skills.js` already requires `views/commit-view.js`. After the file copy in Step 1, these pages pick up the new design automatically.

For the **actions route** (`routes/actions.js` — `GET /actions`):

```js
const { renderActions } = require('../views/actions-view');

const body = renderActions({
  items: actions.map(a => ({
    title:        a.title,
    feature:      a.featureName,
    actionType:   a.type,            // 'Sign-off' | 'Review' | 'Resume session'
    artefactPath: a.featureSlug + '/' + a.artefactType
  }))
  // Pass [] or omit items to render the built-in empty state
});

res.end(renderShell({ title: 'My actions', bodyContent: body, user: { login: req.session.login }, active: 'actions', crumbs: ['My actions'] }));
```

---

## Step 3 — Validate

Run the full test suite:

```bash
npm test
```

All existing tests must pass. The view files are pure functions with no side effects — they do not require new test cases unless new behaviour is added. If any test fails after Step 1, the root cause is a changed export name or a missing `require` — check the error message and align the import.

Open a browser and do a manual smoke check:

- [ ] `GET /dashboard` — sidebar shows `Home` active; skill cards render; no JS errors in console
- [ ] `GET /features` — pipeline-dot table or empty state
- [ ] `GET /skills` — skill list picks up new shell (sidebar, topbar)
- [ ] Start a skill session — chat page loads with split pane; streaming works; commit flow reaches result page
- [ ] Sign out and check redirect to `/auth/github`

---

## Step 4 — Clean up

Once the port is verified:

```bash
rm -rf src/web-ui/port-extract
```

The zip (`src/web-ui/skills framework-web-ui.zip`) can also be deleted from the working tree — it was the distribution artefact, not needed at runtime.

---

## Design system reference

If you build new screens, use these classes (all defined in `html-shell.js` `<style>` block):

| Class | Purpose |
|-------|---------|
| `.sw-app` | root flex container |
| `.sw-sidebar` | left navigation sidebar |
| `.sw-main` | right content area |
| `.sw-topbar` | top bar with breadcrumbs + header actions |
| `.sw-content` | scrollable body inside `.sw-main` |
| `.sw-card`, `.sw-card--lg` | content card |
| `.sw-section-title` | uppercase section header label |
| `.sw-pill--accent\|green\|amber\|red\|neutral` | status pill |
| `.sw-btn--primary\|accent\|subtle` | action buttons |
| `.sw-input`, `.sw-textarea` | form elements |
| `.sw-doc` | serif prose document layout |
| `.sw-empty`, `.sw-empty-icon` | empty state container |
| `.sw-list` | bordered row list |

CSS variables: `--surface`, `--bg`, `--line`, `--line-2`, `--ink`, `--ink-2`, `--muted`, `--muted-2`, `--accent-soft`, `--accent-ink`, `--sans`, `--serif`, `--mono`

View the live design reference at `port/preview/preview.html` (open in browser — no server needed).

---

## Troubleshooting

**`require('../views/components')` — MODULE_NOT_FOUND**: `components.js` was not copied in Step 1. Check the file exists at `src/web-ui/views/components.js`.

**Sidebar nav item not highlighted**: Pass the `active` prop to `renderShell`. Valid values: `dashboard`, `skills`, `features`, `actions`, `status`.

**Existing chat tests fail after replacing chat-view.js**: The port's `renderChat` has the same function signature as the mfc.1 version. If tests import `chat-view.js` directly and assert on specific HTML snippets, update the expected strings to match the port's output. The data contract (`skillName`, `sessionId`, `priorQA`, `draftSections` etc.) is unchanged.

**`escHtml` from the new `html-shell.js` is not exported**: The port's `html-shell.js` exports both `renderShell` and `escHtml`. Check the `module.exports` at the bottom of the file includes `escHtml`.
