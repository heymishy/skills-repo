// src/web-ui/public/approval-modal.js — ep2-s3
// Sign Off modal: reason-capture form that (1) POSTs to the new
// /api/journey/:journeyId/approve endpoint to record the approval as a
// decisions.md entry, then (2) on success, submits the EXISTING,
// unmodified gate-confirm form to actually advance the stage -- see
// decisions.md (2026-09-18) for why this two-step client-side chain,
// rather than touching handlePostGateConfirm directly.
(function () {
  'use strict';

  function init() {
    var signOffBtn = document.getElementById('sign-off-btn');
    var modal = document.getElementById('sign-off-modal');
    if (!signOffBtn || !modal) return;

    var journeyId = signOffBtn.getAttribute('data-journey-id');
    var csrfToken = signOffBtn.getAttribute('data-csrf-token');
    var reasonInput = document.getElementById('sign-off-reason');
    var approveBtn = document.getElementById('sign-off-approve-btn');
    var cancelBtn = document.getElementById('sign-off-cancel-btn');
    var errorEl = document.getElementById('sign-off-error');
    var gateConfirmForm = document.querySelector('form[action^="/api/journey/"][action$="/gate-confirm"]');

    function showModal() {
      modal.style.display = 'block';
      errorEl.textContent = '';
      if (reasonInput) reasonInput.focus();
    }
    function hideModal() {
      modal.style.display = 'none';
    }

    signOffBtn.addEventListener('click', showModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    approveBtn.addEventListener('click', function () {
      var reason = reasonInput ? reasonInput.value.trim() : '';
      if (!reason) {
        errorEl.textContent = 'Reason cannot be empty';
        return;
      }
      fetch('/api/journey/' + encodeURIComponent(journeyId) + '/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason, _csrf: csrfToken })
      })
        .then(function (r) {
          if (!r.ok) return r.json().then(function (body) { throw new Error(body.error || 'Approval failed'); });
          return r.json();
        })
        .then(function () {
          hideModal();
          // Chain into the existing, unmodified gate-confirm mechanism to
          // actually advance the stage -- same real form the plain
          // "Continue to [nextStage]" button already submits.
          if (gateConfirmForm) gateConfirmForm.submit();
        })
        .catch(function (err) {
          errorEl.textContent = err.message || 'Approval failed. Please try again.';
        });
    });
  }

  init();
})();
