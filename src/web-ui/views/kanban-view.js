'use strict';

// kanban-view.js — board view for features + ideas backlog
// renderKanban({ features, ideas }) → HTML string

const { escHtml } = require('../utils/html-shell');

const LANES = [
  { id: 'idea',       label: 'Ideas',       stages: [] },
  { id: 'discovery',  label: 'Discovery',   stages: ['discovery', 'benefit-metric', 'ideation'] },
  { id: 'definition', label: 'Definition',  stages: ['definition'] },
  { id: 'review',     label: 'In Review',   stages: ['review', 'test-plan', 'definition-of-ready'] },
  { id: 'delivery',   label: 'In Delivery', stages: ['branch-setup', 'implementation-plan', 'subagent-execution', 'verify-completion', 'branch-complete'] },
  { id: 'done',       label: 'Done',        stages: ['definition-of-done', 'released', 'done'] }
];

function healthColor(health) {
  if (health === 'green')  return '#22c55e';
  if (health === 'amber')  return '#f59e0b';
  if (health === 'red')    return '#ef4444';
  return 'var(--muted-2)';
}

function ageDays(updated) {
  if (!updated) return null;
  const d = new Date(updated);
  if (isNaN(d)) return null;
  const days = Math.floor((Date.now() - d) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return days + 'd ago';
}

function truncateTitle(title, max) {
  if (title.length <= max) return title;
  return title.slice(0, max) + '…';
}

function featureCard(f) {
  const age = ageDays(f.updated || f.lastUpdated);
  const dot = '<span class="kb-dot" style="background:' + healthColor(f.health) + '"></span>';
  const fullTitle = f.title || f.slug;
  const displayTitle = truncateTitle(fullTitle, 48);
  const count = typeof f.artefactCount === 'number' ? f.artefactCount : null;
  const badge = count === null ? '' :
    count === 0
      ? '<span class="kb-artefact-badge kb-artefact-badge--empty">no artefacts yet</span>'
      : '<span class="kb-artefact-badge">' + count + ' artefact' + (count === 1 ? '' : 's') + '</span>';
  return [
    '<a class="kb-card" href="/features/' + escHtml(f.slug) + '" title="' + escHtml(fullTitle) + '">',
      '<div class="kb-card-head">',
        dot,
        '<span class="kb-card-title">' + escHtml(displayTitle) + '</span>',
      '</div>',
      badge,
      '<div class="kb-card-meta">',
        '<span class="kb-slug">' + escHtml(f.slug) + '</span>',
        age ? (' · <span class="kb-age">' + escHtml(age) + '</span>') : '',
      '</div>',
    '</a>'
  ].join('');
}

function ideaCard(idea) {
  const age = ageDays(idea.createdAt);
  return [
    '<div class="kb-card kb-card--idea" data-idea-id="' + escHtml(idea.id) + '">',
      '<div class="kb-card-head">',
        '<span class="kb-card-title">' + escHtml(idea.title) + '</span>',
        '<button class="kb-idea-del" data-id="' + escHtml(idea.id) + '" title="Remove idea" aria-label="Remove idea">✕</button>',
      '</div>',
      idea.notes ? '<p class="kb-card-notes">' + escHtml(idea.notes) + '</p>' : '',
      '<div class="kb-card-foot">',
        age ? '<span class="kb-age">' + escHtml(age) + '</span>' : '',
        '<a class="kb-start-link" href="/skills/discovery/sessions?idea=' + escHtml(idea.id) + '">Start Discovery →</a>',
      '</div>',
    '</div>'
  ].join('');
}

function addIdeaForm() {
  return [
    '<form class="kb-add-form" id="kb-add-idea-form">',
      '<input class="kb-add-input" type="text" name="title" placeholder="New idea…" maxlength="120" required autocomplete="off">',
      '<button class="kb-add-btn" type="submit">Add</button>',
    '</form>'
  ].join('');
}

function lane(laneConfig, cards, wipLimit) {
  const count = cards.length;
  const overWip = wipLimit && count > wipLimit;
  const wipBadge = overWip
    ? '<span class="kb-wip kb-wip--over" title="WIP limit exceeded">' + count + '/' + wipLimit + '</span>'
    : '<span class="kb-wip">' + count + '</span>';
  return [
    '<div class="kb-lane" data-lane="' + escHtml(laneConfig.id) + '">',
      '<div class="kb-lane-head">',
        '<span class="kb-lane-label">' + escHtml(laneConfig.label) + '</span>',
        wipBadge,
      '</div>',
      '<div class="kb-lane-cards">',
        laneConfig.id === 'idea' ? addIdeaForm() : '',
        cards.join(''),
        count === 0 ? '<div class="kb-empty">—</div>' : '',
      '</div>',
    '</div>'
  ].join('');
}

/**
 * @param {object} data
 * Supports two signatures:
 * 1. Old: { features: [], ideas?: [] } — pipeline-state features/ideas (rendered with complex lanes)
 * 2. New: { columns: [], ideas?: [] } — generic columns/cards (rendered as simple board; product/org/tenant scope)
 * @param {Array}  data.features  — (old) from pipeline-state.json (slug, title, stage, health, updated)
 * @param {Array}  data.columns   — (new) generic stage columns with cards
 * @param {Array}  data.ideas     — (optional) ideas backlog
 * @param {object} [data.wipLimits] — { delivery: 3 } etc. optional (old only)
 */
function renderKanban(data) {
  // kbc-s1 (AC1, AC6): dispatch on shape -- new generic {columns} signature
  // renders via the simplified board renderer; legacy {features} signature
  // (still used by /features?view=board) keeps its original lane-based output.
  if (data && data.columns) {
    return _renderKanbanColumns(data);
  }

  const features = data.features || [];
  const ideas    = data.ideas    || [];
  const wipLimits = data.wipLimits || { delivery: 5, review: 4 };

  const lanes = LANES.map(function(l) {
    if (l.id === 'idea') {
      const cards = ideas.map(ideaCard);
      return lane(l, cards, null);
    }
    const matching = features.filter(function(f) { return l.stages.indexOf(f.stage) !== -1; });
    const cards = matching.map(featureCard);
    return lane(l, cards, wipLimits[l.id] || null);
  });

  const totalActive = features.filter(function(f) { return f.stage !== 'released' && f.stage !== 'done' && f.stage !== 'definition-of-done'; }).length;

  return [
    '<style>',
      '.kb-board { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; min-height: 520px; align-items: flex-start; }',
      '.kb-lane { flex: 0 0 220px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; display: flex; flex-direction: column; max-height: 680px; }',
      '.kb-lane-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }',
      '.kb-lane-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; color: var(--muted); }',
      '.kb-wip { font-size: 11px; font-weight: 600; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 1px 7px; color: var(--muted); }',
      '.kb-wip--over { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }',
      '.kb-lane-cards { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; flex: 1; }',
      '.kb-card { display: block; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; text-decoration: none; color: var(--ink); transition: border-color 0.12s; }',
      '.kb-card:hover { border-color: var(--accent, #1a6ef5); }',
      '.kb-card--idea { border-style: dashed; }',
      '.kb-card-head { display: flex; align-items: flex-start; gap: 7px; }',
      '.kb-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }',
      '.kb-card-title { font-size: 13px; font-weight: 500; line-height: 1.4; flex: 1; }',
      '.kb-card-meta { margin-top: 5px; font-size: 11px; color: var(--muted); display: flex; gap: 4px; }',
      '.kb-slug { font-family: var(--mono); }',
      '.kb-age { color: var(--muted); }',
      '.kb-card-notes { margin: 6px 0 0; font-size: 12px; color: var(--muted); line-height: 1.4; }',
      '.kb-card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 8px; }',
      '.kb-start-link { font-size: 11px; color: var(--accent, #1a6ef5); text-decoration: none; white-space: nowrap; }',
      '.kb-start-link:hover { text-decoration: underline; }',
      '.kb-idea-del { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 13px; padding: 0 2px; line-height: 1; flex-shrink: 0; }',
      '.kb-idea-del:hover { color: #dc2626; }',
      '.kb-empty { font-size: 12px; color: var(--muted); text-align: center; padding: 20px 0; }',
      '.kb-add-form { display: flex; gap: 6px; margin-bottom: 2px; }',
      '.kb-add-input { flex: 1; font: inherit; font-size: 12px; padding: 5px 8px; border: 1px solid var(--line); border-radius: 5px; background: var(--surface); color: var(--ink); min-width: 0; }',
      '.kb-add-input:focus { outline: 2px solid var(--accent, #1a6ef5); outline-offset: -1px; }',
      '.kb-add-btn { font: inherit; font-size: 12px; padding: 5px 10px; border-radius: 5px; background: var(--accent, #1a6ef5); color: #fff; border: none; cursor: pointer; white-space: nowrap; }',
      '.kb-add-btn:hover { opacity: 0.88; }',
      '.kb-board-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }',
      '.kb-view-toggle { display: flex; gap: 4px; }',
      '.kb-toggle-btn { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); cursor: pointer; font: inherit; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }',
      '.kb-toggle-btn--active { background: var(--surface); color: var(--ink); font-weight: 500; }',
    '</style>',
    '<div class="sw-feat">',
      '<div class="kb-board-head">',
        '<div>',
          '<h1 class="sw-page-h1">Features</h1>',
          '<p class="sw-page-sub">' + totalActive + ' in flight · ' + ideas.length + ' idea' + (ideas.length === 1 ? '' : 's') + ' in backlog</p>',
        '</div>',
        '<div class="kb-view-toggle">',
          '<a class="kb-toggle-btn" href="/features">☰ List</a>',
          '<a class="kb-toggle-btn kb-toggle-btn--active" href="/features?view=board">⊞ Board</a>',
        '</div>',
      '</div>',
      '<div class="kb-board" id="kb-board">',
        lanes.join(''),
      '</div>',
    '</div>',
    '<script>',
      '(function() {',
      '  var form = document.getElementById("kb-add-idea-form");',
      '  if (form) {',
      '    form.addEventListener("submit", function(e) {',
      '      e.preventDefault();',
      '      var title = form.elements.title.value.trim();',
      '      if (!title) return;',
      '      fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title }) })',
      '        .then(function(r) { if (r.ok) window.location.reload(); });',
      '    });',
      '  }',
      '  document.querySelectorAll(".kb-idea-del").forEach(function(btn) {',
      '    btn.addEventListener("click", function(e) {',
      '      e.preventDefault(); e.stopPropagation();',
      '      var id = btn.dataset.id;',
      '      if (!id) return;',
      '      fetch("/api/ideas/" + encodeURIComponent(id), { method: "DELETE" })',
      '        .then(function(r) { if (r.ok) btn.closest(".kb-card--idea").remove(); });',
      '    });',
      '  });',
      '})();',
    '</script>'
  ].join('');
}

/**
 * Simplified kanban renderer for generic columns/cards (product/org/tenant scope)
 * @param {object} data
 * @param {Array}  data.columns - array of {stage, cards: []}
 * @param {Array}  [data.ideas] - optional ideas array
 */
function _cardHealthLabel(health) {
  if (health === 'red' || health === 'blocked')   return 'Blocked';
  if (health === 'amber' || health === 'at-risk') return 'Warning';
  if (health === 'green' || health === 'on-track') return 'Healthy';
  return 'Unknown';
}

// s1.2 (AC1) -- short, always-visible, plain-language label for the routine
// "session still in progress" case. Text-based, never colour-only.
function _notReadyLabel() {
  return 'Not ready to advance';
}

// s1.2 (AC1, AC2) -- longer, stage-named explanation, available via the
// element's title attribute (hover/focus detail, per this story's own
// "server-rendered title attribute ... per implementation choice" test-plan
// wording). Expands the stage name in plain language (CLAUDE.md convention).
function _notReadyDetail(stage) {
  var stageName = stage || 'current';
  return 'This feature’s ' + stageName + ' turn is still in progress — it has not produced a finished artefact yet.';
}

function _renderKanbanColumns(data) {
  var columns = data.columns || [];

  if (!columns || columns.length === 0) {
    return '<div class="kb-empty">No stages available</div>';
  }

  var columnHtml = columns.map(function(col) {
    var cardHtml = (col.cards || []).map(function(card) {
      var health = card.health || 'neutral';
      var healthClass = 'kb-health-' + escHtml(health);
      // NFR-Accessibility: health is never colour-only -- a text label always
      // accompanies the coloured border (deriveBlockerIndicator/_healthLabel
      // pattern already used by products.js/status-board.js).
      var healthLabel = card.healthLabel || _cardHealthLabel(health);

      // s1.1 (AC1, AC2) -- only cards whose caller explicitly computed
      // readiness (typeof card.ready === 'boolean') get the Advance action or
      // any not-ready state at all. Callers that never supply readiness data
      // (legacy {columns} fixtures, other consumers of this shared renderer)
      // render exactly as before this story -- zero behaviour change for them.
      var hasReadiness = typeof card.ready === 'boolean';
      // s1.2 (AC4) -- a real gate-confirm validation failure is a DIFFERENT
      // failure mode from the routine "session still in progress" not-ready
      // case, and must never share its class or text (mutually exclusive:
      // validationFailed takes precedence over the plain ready/not-ready state).
      var isValidationFailed = hasReadiness && !!card.validationFailed;
      var stateClass = !hasReadiness ? '' :
        isValidationFailed ? ' kb-card--validation-failed' :
        card.ready ? ' kb-card--ready' : ' kb-card--not-ready';

      var actionHtml = '';
      if (hasReadiness && isValidationFailed) {
        // s1.2 (AC4) -- distinct, honestly-labelled treatment for a real
        // validation failure -- never the routine not-ready label/styling.
        var failReason = card.validationFailedReason || 'Advance failed validation.';
        actionHtml = '<div class="kb-validation-failed" tabindex="0" title="' + escHtml(failReason) + '">' +
          '<span class="kb-validation-failed-icon" aria-hidden="true">&#10007;</span> ' +
          '<span class="kb-validation-failed-text">Advance failed</span>' +
        '</div>';
      } else if (hasReadiness && card.ready) {
        // s3.4 -- pass event so kbAdvanceCard can stop it reaching the card's
        // own wrapping <a> (AC1); the button's action must not also navigate.
        actionHtml = '<div class="kb-card-actions">' +
          '<button type="button" class="kb-advance-btn" data-journey-id="' + escHtml(card.id) + '" onclick="kbAdvanceCard(this, event)">Advance &rarr;</button>' +
        '</div>';
      } else if (hasReadiness) {
        // s1.2 (AC1, AC2) -- routine not-ready case: a short, always-visible,
        // non-colour-only text label, plus a longer plain-language detail
        // available on hover/keyboard-focus via the title attribute.
        actionHtml = '<div class="kb-not-ready" tabindex="0" title="' + escHtml(_notReadyDetail(col.stage)) + '">' +
          '<span class="kb-not-ready-icon" aria-hidden="true">&#9203;</span> ' +
          '<span class="kb-not-ready-text">' + escHtml(_notReadyLabel()) + '</span>' +
        '</div>';
      }

      // s3.4 (AC1) -- the card is now a real, keyboard-activatable link to
      // its detail view (confirmed destination: /journey/:id -- see
      // decisions.md "S3.4 route/identifier investigation" -- card.id
      // already IS the journeyId, no separate identifier mapping needed).
      // The "?from=" query value is appended client-side (kbAppendBoardBackLinks
      // below), not server-rendered here, since this shared renderer has no
      // reliable knowledge of which of the 3 board-scope pages is calling it.
      return [
        '<a class="kb-card kb-card-link ' + healthClass + stateClass + '" data-journey-id="' + escHtml(card.id) + '" href="/journey/' + escHtml(card.id) + '">',
          '<div class="kb-card-title">' + escHtml(card.title || card.name || '(untitled)') + '</div>',
          '<div class="kb-card-meta">',
            '<span class="kb-card-id">' + escHtml(card.id) + '</span>',
            ' · <span class="kb-health-label">' + escHtml(healthLabel) + '</span>',
          '</div>',
          actionHtml,
        '</a>'
      ].join('');
    }).join('');

    return [
      '<div class="kb-column" data-stage="' + escHtml(col.stage) + '">',
        '<div class="kb-column-head">' + escHtml(col.stage) + '</div>',
        '<div class="kb-cards">',
          cardHtml || '<div class="kb-empty">—</div>',
        '</div>',
      '</div>'
    ].join('');
  }).join('');

  return [
    '<style>',
      '.kb-board { display: flex; gap: 12px; overflow-x: auto; padding: 16px; min-height: 400px; }',
      '.kb-column { flex: 0 0 240px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }',
      '.kb-column-head { font-weight: 600; font-size: 14px; padding-bottom: 12px; border-bottom: 2px solid var(--line); margin-bottom: 12px; color: var(--ink); }',
      '.kb-cards { display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; }',
      // s3.4 (AC1) -- .kb-card is now an <a> (see cardHtml above); these
      // properties keep it visually identical to the previous plain <div>.
      // s2.1 (AC1) -- health-border colours use the shared design-system
      // tokens (var(--green)/(--amber)/(--red)), not raw hex.
      '.kb-card { display: block; background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 10px; text-decoration: none; color: inherit; }',
      '.kb-health-on-track, .kb-health-green { border-left: 4px solid var(--green); }',
      '.kb-health-at-risk, .kb-health-amber { border-left: 4px solid var(--amber); }',
      '.kb-health-blocked, .kb-health-red { border-left: 4px solid var(--red); }',
      '.kb-health-neutral { border-left: 4px solid var(--muted-2); }',
      '.kb-card-title { font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--ink); }',
      '.kb-card-meta { font-size: 11px; color: var(--muted); }',
      '.kb-card-id { font-family: var(--mono); }',
      '.kb-health-label { color: var(--muted); }',
      '.kb-empty { text-align: center; color: var(--muted); font-size: 12px; padding: 16px 0; }',
      '.kb-card-actions { margin-top: 8px; }',
      '.kb-advance-btn { font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 5px; border: 1px solid var(--accent); background: none; color: var(--accent); cursor: pointer; }',
      '.kb-advance-btn:hover { background: var(--accent); color: var(--bg); }',
      '.kb-advance-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
      '.kb-advance-btn:disabled { opacity: 0.6; cursor: default; }',
      // s1.2 (AC1, AC3) -- kb-card--not-ready gets its own distinct left-border
      // treatment, layered ON TOP of (not replacing) the health-colour border,
      // so a not-ready card is visually distinguishable from a ready card at a
      // glance -- but colour is never the ONLY signal (a text label always
      // accompanies it, per NFR-Accessibility above).
      '.kb-card--not-ready { opacity: 0.85; }',
      '.kb-not-ready { margin-top: 8px; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); border: 1px dashed var(--line); border-radius: 5px; padding: 3px 8px; cursor: default; }',
      '.kb-not-ready:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
      // s1.2 (AC4) -- a real validation failure is a DIFFERENT failure mode
      // from the routine not-ready case -- distinct colour AND distinct text,
      // never the same class or wording as .kb-not-ready above.
      '.kb-card--validation-failed { border-left-color: var(--red) !important; }',
      '.kb-validation-failed { margin-top: 8px; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; color: var(--red); border: 1px solid var(--red); background: var(--red-soft); border-radius: 5px; padding: 3px 8px; cursor: default; }',
      '.kb-validation-failed:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }',
    '</style>',
    '<div class="kb-board">',
      columnHtml,
    '</div>',
    '<script>',
      // s1.1 (AC1) -- click the board's own "Advance" action instead of
      // leaving the board to confirm the gate from the chat-session UI.
      // On success: reload so the card re-renders in its new stage's column
      // (matches this file's other fetch-then-reload actions, e.g.
      // products.js's pshTriggerSync). On failure: surface the REAL reason
      // from the response body (AC5) via an alert -- never a generic message.
      'function kbAdvanceCard(btn, event) {',
      // s3.4 -- the button now sits inside the card's own wrapping <a> (AC1);
      // stop the click from also triggering the card's navigation.
      '  if (event) { event.preventDefault(); event.stopPropagation(); }',
      '  var journeyId = btn.getAttribute("data-journey-id");',
      '  if (!journeyId) return;',
      '  btn.disabled = true;',
      '  var origText = btn.textContent;',
      '  btn.textContent = "Advancing…";',
      '  fetch("/api/board/journey/" + encodeURIComponent(journeyId) + "/advance", { method: "POST" })',
      '    .then(function(r) {',
      '      return r.json().catch(function() { return {}; }).then(function(body) { return { ok: r.ok, body: body }; });',
      '    })',
      '    .then(function(result) {',
      '      if (result.ok) { window.location.reload(); return; }',
      '      btn.disabled = false; btn.textContent = origText;',
      '      alert(_kbAdvanceErrorMessage(result.body));',
      '    })',
      '    .catch(function(e) {',
      '      btn.disabled = false; btn.textContent = origText;',
      '      alert("Advance failed: " + e.message);',
      '    });',
      '}',
      'function _kbAdvanceErrorMessage(body) {',
      '  if (body && body.error === "validation-failed") {',
      '    return "Advance failed: " + (body.detail || "artefact validation failed") + (body.exitCode != null ? " (exit code " + body.exitCode + ")" : "");',
      '  }',
      '  if (body && body.reason) { return body.reason; }',
      '  return "Advance failed.";',
      '}',
      // s3.4 (AC3) -- append the current board page's own URL as each card
      // link's ?from= value, so the detail view (handleGetJourneyById,
      // journey.js) can render a "Back to board" link that returns to
      // wherever the operator actually came from (product/org/tenant board).
      // Done client-side since this shared renderer has no reliable
      // knowledge of which of the 3 board-scope pages is calling it.
      'document.querySelectorAll(".kb-card-link").forEach(function(a) {',
      '  a.href = a.getAttribute("href") + "?from=" + encodeURIComponent(window.location.pathname + window.location.search);',
      '});',
    '<\/script>'
  ].join('');
}

module.exports = { renderKanban, LANES, _renderKanbanColumns };
