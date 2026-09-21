'use strict';

// artefact-edit-merge.js -- ep2-s4. Intercepts the edit-mode artefact
// <form>'s submit, POSTs JSON instead of a full-page form submission, and
// listens for pushed merge updates from a concurrent save via SSE.
// journey.js's edit-mode markup has no editor.js today (this file did not
// exist before this story) -- see decisions.md for the full investigation.

(function () {
  var form = document.querySelector('.sv-edit-bar')
    ? document.querySelector('.sv-edit-bar').closest('form')
    : null;
  if (!form) return; // not on an edit-mode page

  var textarea = form.querySelector('textarea[name="content"]');
  var saveUrl = form.getAttribute('action');

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    fetch(saveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: textarea.value })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.content != null) textarea.value = data.content;
      })
      .catch(function () { /* SSE/fetch failures must degrade gracefully -- web-ui/core.md */ });
  });

  // Derive the SSE URL from the save URL's own journeyId/stageName segments
  // (saveUrl shape: /api/journey/:journeyId/stage/:stageName/artefact).
  var match = saveUrl.match(/^\/api\/journey\/([^/]+)\/stage\/([^/]+)\/artefact$/);
  if (!match) return;
  var streamUrl = '/api/journey/' + match[1] + '/stage/' + match[2] + '/artefact-merged';

  var source = new EventSource(streamUrl);
  source.onmessage = function (evt) {
    try {
      var payload = JSON.parse(evt.data);
      if (payload.content != null) textarea.value = payload.content;
    } catch (_) { /* ignore malformed frame */ }
  };
  window.addEventListener('beforeunload', function () { source.close(); });
})();
