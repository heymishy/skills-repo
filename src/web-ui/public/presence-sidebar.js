// src/web-ui/public/presence-sidebar.js — ep2-s1
// Team presence sidebar: reads journeyId from the #team-sidebar element's
// data-journey-id attribute (this codebase's established convention for
// feeding server-rendered data to a client script -- see routes/journey.js's
// own data-journey-id usage), opens an SSE stream for live status, and
// re-renders "last seen Xm ago" text every second without a network round
// trip.
(function () {
  'use strict';

  function fmtLastSeen(lastSeenMs) {
    if (lastSeenMs == null) return 'unknown';
    var mins = Math.floor((Date.now() - lastSeenMs) / 60000);
    if (mins < 1) return 'just now';
    return mins + 'm ago';
  }

  function render(listEl, collaborators) {
    listEl.innerHTML = '';
    collaborators.forEach(function (c) {
      var item = document.createElement('li');
      item.className = 'presence-item presence-' + c.status;
      item.tabIndex = 0;
      var label = c.userId + ' (' + c.roleId +
        (c.status === 'offline' ? ', offline — last seen ' + fmtLastSeen(c.lastSeenMs) : '') +
        ')';
      item.textContent = label;
      listEl.appendChild(item);
    });
  }

  function init() {
    var sidebar = document.getElementById('team-sidebar');
    if (!sidebar) return;
    var journeyId = sidebar.getAttribute('data-journey-id');
    if (!journeyId) return;
    var listEl = document.getElementById('team-sidebar-list');
    if (!listEl) return;

    var latest = [];

    function refresh(data) {
      latest = (data && data.collaborators) || [];
      render(listEl, latest);
    }

    fetch('/api/journey/' + encodeURIComponent(journeyId) + '/collaborators-presence')
      .then(function (r) { return r.json(); })
      .then(refresh)
      .catch(function () { /* graceful degrade: sidebar stays empty until SSE delivers a payload */ });

    var es = new EventSource('/api/journey/' + encodeURIComponent(journeyId) + '/presence-stream');
    es.onmessage = function (evt) {
      try { refresh(JSON.parse(evt.data)); } catch (_) { /* ignore malformed frame */ }
    };
    es.onerror = function () {
      // graceful degrade: keep last-known render; browser's EventSource auto-reconnects
    };

    // Live-recompute "last seen" text every second without a network round trip.
    setInterval(function () {
      if (latest.length) render(listEl, latest);
    }, 1000);

    // Keep this viewer's own presence registered while the tab is open.
    setInterval(function () {
      fetch('/api/journey/' + encodeURIComponent(journeyId) + '/heartbeat', { method: 'POST' });
    }, 12000);
  }

  // The script tag is emitted after the #team-sidebar element in the page's
  // HTML stream, so the element already exists in the DOM by the time this
  // synchronous script runs -- no need to wait for DOMContentLoaded.
  init();
})();
