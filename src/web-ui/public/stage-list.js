// src/web-ui/public/stage-list.js — ep2-s2
// Role-filtered pipeline stage list: reads journeyId from the
// #stage-list element's data-journey-id attribute (matching this
// codebase's established data-* convention -- see routes/journey.js's
// and views/kanban-view.js's own precedent, and the equivalent pattern
// an earlier story's presence-sidebar.js already uses), fetches the
// collaborator's role-filtered view, renders it, and wires a "Show all
// stages" toggle that persists via localStorage for the session (no
// server round trip on toggle -- matches this story's own NFR: toggle
// response ≤200ms).
(function () {
  'use strict';

  var STAGE_LABELS = {
    'ideate': 'Ideate', 'discovery': 'Discovery', 'benefit-metric': 'Benefit Metric',
    'design': 'Design', 'definition': 'Definition', 'review': 'Review',
    'test-plan': 'Test Plan', 'definition-of-ready': 'Definition of Ready'
  };

  function label(stage) { return STAGE_LABELS[stage] || stage; }

  function render(listEl, stages, completedStages) {
    listEl.innerHTML = '';
    stages.forEach(function (stage) {
      var item = document.createElement('li');
      item.className = 'stage-item' + (completedStages.indexOf(stage) !== -1 ? ' stage-completed' : '');
      item.tabIndex = 0;
      item.textContent = label(stage);
      listEl.appendChild(item);
    });
  }

  function init() {
    var container = document.getElementById('stage-list');
    if (!container) return;
    var journeyId = container.getAttribute('data-journey-id');
    if (!journeyId) return;
    var listEl = document.getElementById('stage-list-items');
    var toggleBtn = document.getElementById('stage-list-toggle');
    if (!listEl || !toggleBtn) return;

    var storageKey = 'stage-list-show-all-' + journeyId;
    var data = null;

    function applyView() {
      if (!data) return;
      var showAll = window.localStorage.getItem(storageKey) === 'true';
      render(listEl, showAll ? data.allStages : data.visibleStages, data.completedStages);
      toggleBtn.textContent = showAll ? 'Show role-filtered view' : 'Show all stages';
      toggleBtn.setAttribute('aria-pressed', String(showAll));
    }

    toggleBtn.addEventListener('click', function () {
      var showAll = window.localStorage.getItem(storageKey) === 'true';
      window.localStorage.setItem(storageKey, String(!showAll));
      applyView();
    });

    fetch('/api/journey/' + encodeURIComponent(journeyId) + '/stage-visibility')
      .then(function (r) { return r.json(); })
      .then(function (json) { data = json; applyView(); })
      .catch(function () { /* graceful degrade: list stays empty if the fetch fails */ });
  }

  init();
})();
