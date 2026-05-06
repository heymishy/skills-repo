# Web UI redesign — integration guide

This folder contains drop-in replacements and additions for `src/web-ui/` that
deliver the Notion-calm redesign. **No new dependencies, no build step, no
client framework.** All changes are server-rendered HTML + inline CSS.

## What's in here

```
port/src/web-ui/
  utils/
    html-shell.js          ← REPLACES the existing file
  views/                   ← NEW directory — pure render functions
    components.js
    dashboard-view.js
    features-view.js
    artefact-view.js
    chat-view.js
    commit-view.js
    actions-view.js
```

## Architecture (unchanged)

- Each route handler stays in `routes/*.js`. Only the **HTML strings** they
  produce change.
- Views are pure functions: `(data) → htmlString`. They do no I/O, no auth, no
  session reads. The route handler still gathers the data and passes it in.
- `renderShell({ title, bodyContent, user, active, crumbs, headerActions })` is
  backwards-compatible — the three new optional props (`active`, `crumbs`,
  `headerActions`) just decorate the chrome.

## Per-route integration

### `routes/dashboard.js`

```js
const { renderShell } = require('../utils/html-shell');
const { renderDashboard } = require('../views/dashboard-view');

// inside the handler, after gathering data:
const body = renderDashboard({
  greetingName:        req.session.login,
  dateLabel:           formatDate(new Date()),  // your existing helper, or new
  pendingActionsCount: actions.length,
  inProgressCount:     activeSessions.length,
  skills:              skills.map(s => ({
                         name: s.name,
                         label: s.displayName || s.name,
                         desc: s.description,
                         est: s.estimatedDuration || '15 min',
                         stage: s.stage || 'Discovery'
                       })),
  actions:             actions.slice(0, 4),     // {what, feature, age, you}
  recent:              recentSessions.slice(0, 4)
});

res.end(renderShell({
  title:       'Home',
  bodyContent: body,
  user:        { login: req.session.login },
  active:      'dashboard'
}));
```

### `routes/features.js` (list view)

```js
const { renderFeaturesList } = require('../views/features-view');

const body = renderFeaturesList({
  features: features.map(f => ({
    slug: f.slug,
    title: f.title,
    stage: f.stage,                  // 'discovery' | 'definition' | 'review' | 'delivery' | 'committed'
    updated: humanDate(f.updatedAt), // '2h ago' style
    owner: f.ownerLogin,
    artefactCount: f.artefacts.length
  })),
  repoCount: 1
});

res.end(renderShell({
  title:       'Features',
  bodyContent: body,
  user:        { login: req.session.login },
  active:      'features',
  crumbs:      ['Features']
}));
```

### `routes/artefact.js` (`GET /artefact/:slug/:type`)

You already render markdown to HTML. Pass that HTML as `proseHtml`:

```js
const { renderArtefact } = require('../views/artefact-view');

const body = renderArtefact({
  proseHtml: renderedMarkdownHtml,   // your existing safe HTML
  meta: {
    title:       artefact.title,
    feature:     artefact.feature,
    stage:       'In review',
    author:      artefact.author,
    updated:     humanDate(artefact.updatedAt),
    featureSlug: artefact.featureSlug,
    fileSlug:    artefact.fileSlug
  },
  commitSha: artefact.commitSha,
  commitUrl: artefact.commitUrl,
  signoffs:  artefact.signoffs || [],     // [{login, role, signed}]
  comments:  artefact.comments || []      // [{by, text, when, resolved}]
});

res.end(renderShell({
  title:         artefact.title,
  bodyContent:   body,
  user:          { login: req.session.login },
  active:        'features',
  crumbs:        ['Features', artefact.feature, artefact.title],
  headerActions: '<button class="sw-btn">Edit</button>' +
                 '<button class="sw-btn sw-btn--primary">Sign off</button>'
}));
```

> If `signoffs` and `comments` aren't yet stored, pass `[]` — the side panels
> degrade gracefully. The comment form posts to
> `/api/artefacts/:slug/:type/annotations` (already a TODO endpoint;
> implementing it is out of scope for this port).

### `routes/skills.js`

This is the biggest change. The existing `handleGetQuestionHtml` builds its
form by hand — replace its bodyContent with the chat view. You'll also need to
extend the session state slightly to feed the live-draft pane.

#### 1. `handleGetQuestionHtml` — replace the bodyContent block

```js
const { renderChat } = require('../views/chat-view');

// inside handleGetQuestionHtml, after `result = await _getNextQuestion(...)`:

// Build draftSections from session state (already in _sessionStore).
// Each session has `sections` (from extractSections), `sectionDrafts`, and
// `pendingSectionDraft`. Feed those in directly:
const session = _getHtmlSession(sessionId);
const draftSections = (session.sections || []).map((sec, i) => {
  if (session.pendingConfirmation && session.currentSectionIndex === i) {
    return { title: sec.heading || 'Section', body: session.pendingSectionDraft, state: 'pending' };
  }
  if (session.sectionDrafts && session.sectionDrafts[i]) {
    return { title: sec.heading || 'Section', body: session.sectionDrafts[i], state: 'drafted' };
  }
  return { title: sec.heading || 'Section', body: '', state: 'empty' };
});

const body = renderChat({
  skillName:           skillName,
  skillLabel:          humanLabelForSkill(skillName),  // small helper or skill metadata
  featureSlug:         session.featureSlug || sessionId,
  sessionId:           sessionId,
  questionIndex:       result.questionIndex,
  totalQuestions:      result.totalQuestions,
  currentQuestion:     result.question,
  priorQA:             result.priorQA || [],
  draftSections:       draftSections,
  pendingConfirmation: !!session.pendingConfirmation,
  userInitial:         (req.session.login || 'M').charAt(0).toUpperCase()
});

res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
res.end(renderShell({
  title:       humanLabelForSkill(skillName) + ' · Question ' + result.questionIndex,
  bodyContent: body,
  user:        { login: req.session.login || '' },
  active:      'skills',
  crumbs:      ['Run a skill', humanLabelForSkill(skillName)]
}));
```

#### 2. `handleGetCommitPreviewHtml` — bodyContent block

```js
const { renderCommitPreview } = require('../views/commit-view');

const body = renderCommitPreview({
  artefactPath:    preview.artefactPath,
  artefactContent: preview.artefactContent,
  commitFormAction: '/api/skills/' + encodeURIComponent(skillName) +
                    '/sessions/'  + encodeURIComponent(sessionId) + '/commit',
  branchName:      preview.branchName || ('skill/' + skillName + '/' + sessionId),
  defaultMessage:  preview.commitMessage || ('artefact: ' + skillName + ' [' + sessionId + ']'),
  reviewers:       preview.suggestedReviewers || []
});

res.end(renderShell({
  title:       'Review & commit',
  bodyContent: body,
  user:        { login: req.session.login },
  active:      'skills',
  crumbs:      ['Run a skill', humanLabelForSkill(skillName), 'Review & commit']
}));
```

#### 3. `handleGetResultHtml` — bodyContent block

```js
const { renderCommitResult } = require('../views/commit-view');

const body = renderCommitResult({
  artefactPath:   result.artefactPath,
  featureSlug:    result.featureSlug,
  artefactType:   result.artefactType,
  prUrl:          result.prUrl,
  nextSkillName:  result.nextSkill,         // optional — null if no follow-on
  nextSkillLabel: result.nextSkillLabel
});

res.end(renderShell({
  title:       'Committed',
  bodyContent: body,
  user:        { login: req.session.login },
  active:      'skills'
}));
```

#### 4. 409 already-committed branch

Inside the catch block where status is 409:

```js
const { renderAlreadyCommitted } = require('../views/commit-view');

const body = renderAlreadyCommitted({
  artefactUrl: '/artefact/' + featureSlug + '/' + artefactType
});
res.writeHead(409, { 'Content-Type': 'text/html; charset=utf-8' });
res.end(renderShell({
  title: 'Already committed',
  bodyContent: body,
  user: { login: req.session.login },
  active: 'skills'
}));
```

### `routes/actions.js` (the empty-state-aware list)

```js
const { renderActions } = require('../views/actions-view');

const body = renderActions({
  items: actions.map(a => ({
    title:        a.title,
    feature:      a.featureName,
    actionType:   a.type,                  // 'Sign-off' | 'Review' | 'Resume session'
    artefactPath: a.featureSlug + '/' + a.artefactType
  }))
});

res.end(renderShell({
  title:       'My actions',
  bodyContent: body,
  user:        { login: req.session.login },
  active:      'actions',
  crumbs:      ['My actions']
}));
```

## Data shape gaps to fill

These data points aren't in the current `_sessionStore` / route handlers; the
views accept them but degrade gracefully when missing. List in priority order:

| Field | View(s) | Today | Effort |
|---|---|---|---|
| `humanLabelForSkill(name)` | chat, commit, all | name only | 15 min — read `name:` frontmatter from `SKILL.md` |
| `featureSlug` on session | chat | not stored | 30 min — capture during `/skills/:name/sessions` POST |
| `signoffs[]`, `comments[]` | artefact | not stored | bigger — needs a `feature/<slug>/.review.json` or similar |
| `nextSkill` on commit result | commit-result | not surfaced | 15 min — static map `discovery → definition`, `definition → story-shaping`, etc. |
| `recentSessions` for dashboard | dashboard | not exposed | 30 min — list from `sessionManager` |

The redesign **renders correctly without any of these**. They unlock the next
layer of value but aren't blockers.

## Visual primitives the views expose

If you build new screens, reach for these classes — they're the design system:

- Layout: `.sw-app .sw-sidebar .sw-main .sw-topbar .sw-content`
- Cards: `.sw-card .sw-card--lg`, `.sw-section-title`
- Lists: `.sw-list` (rows = `<li>`)
- Pills: `.sw-pill .sw-pill--accent|green|amber|red|neutral`, `.sw-pill--nodot`
- Buttons: `.sw-btn .sw-btn--primary|accent|subtle`
- Forms: `.sw-input .sw-textarea`
- Document: `.sw-doc` for serif prose
- Empty state: `.sw-empty .sw-empty-icon`

The `views/components.js` file exports `pill(tone, label, opts)`,
`btn(variant, label, opts)`, and `avatar(login)` so route code never has to
hand-roll these strings.

## Removing this folder

Once the port is merged, this `port/` directory is no longer needed — it was
only a staging layer to keep the redesign isolated from the original codebase
during review.
