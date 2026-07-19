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
      return [
        '<div class="kb-card ' + healthClass + '">',
          '<div class="kb-card-title">' + escHtml(card.title || card.name || '(untitled)') + '</div>',
          '<div class="kb-card-meta">',
            '<span class="kb-card-id">' + escHtml(card.id) + '</span>',
            ' · <span class="kb-health-label">' + escHtml(healthLabel) + '</span>',
          '</div>',
        '</div>'
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
      '.kb-card { background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 10px; }',
      '.kb-health-on-track, .kb-health-green { border-left: 4px solid #22c55e; }',
      '.kb-health-at-risk, .kb-health-amber { border-left: 4px solid #f59e0b; }',
      '.kb-health-blocked, .kb-health-red { border-left: 4px solid #ef4444; }',
      '.kb-health-neutral { border-left: 4px solid var(--muted-2); }',
      '.kb-card-title { font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--ink); }',
      '.kb-card-meta { font-size: 11px; color: var(--muted); }',
      '.kb-card-id { font-family: var(--mono); }',
      '.kb-health-label { color: var(--muted); }',
      '.kb-empty { text-align: center; color: var(--muted); font-size: 12px; padding: 16px 0; }',
    '</style>',
    '<div class="kb-board">',
      columnHtml,
    '</div>'
  ].join('');
}

module.exports = { renderKanban, LANES, _renderKanbanColumns };
