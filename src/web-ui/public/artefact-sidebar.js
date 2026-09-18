// src/web-ui/public/artefact-sidebar.js -- dsa-s1
// Sign Off button (POST /sign-off, reusing the existing, unmodified
// endpoint) and Comments card (list on load already server-rendered;
// this script only handles posting a new comment without a full reload).
(function () {
  'use strict';

  function initSignOff() {
    var btn = document.getElementById('sign-off-btn');
    var errorEl = document.getElementById('sign-off-error');
    if (!btn || !errorEl) return;

    btn.addEventListener('click', function () {
      var artefactPath = btn.getAttribute('data-artefact-path');
      var csrfToken = btn.getAttribute('data-csrf-token');
      btn.disabled = true;
      errorEl.textContent = '';

      fetch('/sign-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artefactPath: artefactPath, _csrf: csrfToken })
      })
        .then(function (r) {
          return r.json().then(function (body) { return { status: r.status, body: body }; });
        })
        .then(function (result) {
          if (result.status === 200) {
            // Success -- reload to pick up the server-rendered signed-off
            // state (simplest correct approach: the sign-off card's real
            // approver/date comes from detectExistingSignOff on next render,
            // avoiding a second client-side state-guessing path).
            window.location.reload();
            return;
          }
          if (result.status === 409) {
            errorEl.textContent = 'Already signed off by ' + (result.body.approver || 'someone') + ' on ' + (result.body.date || 'an earlier date') + '.';
          } else if (result.status === 429) {
            errorEl.textContent = 'Too many requests -- please wait a moment and try again.';
          } else {
            errorEl.textContent = result.body.error || 'Sign-off failed. Please try again.';
          }
          btn.disabled = false;
        })
        .catch(function () {
          errorEl.textContent = 'Sign-off failed. Please try again.';
          btn.disabled = false;
        });
    });
  }

  function initComments() {
    var card = document.querySelector('.sw-comments-card');
    var submitBtn = document.getElementById('comment-submit-btn');
    var input = document.getElementById('comment-input');
    var listContainer = document.getElementById('comments-list-container');
    if (!card || !submitBtn || !input || !listContainer) return;

    var resourceType = card.getAttribute('data-resource-type');
    var resourceId = card.getAttribute('data-resource-id');
    var csrfToken = card.getAttribute('data-csrf-token');

    submitBtn.addEventListener('click', function () {
      var body = input.value.trim();
      if (!body) return;
      submitBtn.disabled = true;

      fetch('/api/artefact-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: resourceType, resourceId: resourceId, body: body, _csrf: csrfToken })
      })
        .then(function (r) { return r.json(); })
        .then(function (result) {
          if (result.success) {
            var emptyState = document.getElementById('comments-empty-state');
            if (emptyState) emptyState.remove();
            var list = document.getElementById('comments-list');
            if (!list) {
              list = document.createElement('ul');
              list.id = 'comments-list';
              list.style.listStyle = 'none';
              list.style.padding = '0';
              listContainer.appendChild(list);
            }
            var item = document.createElement('li');
            item.style.padding = '8px 0';
            item.style.borderBottom = '1px solid var(--line-2)';
            var strong = document.createElement('strong');
            strong.textContent = result.comment.userId;
            var span = document.createElement('span');
            span.style.color = 'var(--muted)';
            span.style.fontSize = '12px';
            span.textContent = ' ' + result.comment.createdAt;
            var p = document.createElement('p');
            p.textContent = result.comment.body;
            item.appendChild(strong);
            item.appendChild(span);
            item.appendChild(p);
            list.appendChild(item);
            input.value = '';
          }
          submitBtn.disabled = false;
        })
        .catch(function () { submitBtn.disabled = false; });
    });
  }

  initSignOff();
  initComments();
})();
