'use strict';
// renderPreviewPanel(doc, { content: string, complete: boolean }) → void
// Creates/updates the [data-role="artefact-preview"] element in the DOM.
// The panel has: aria-live="polite", an h2 heading, and a commit button.
// Commit button is disabled when complete:false, enabled when complete:true.
module.exports = { renderPreviewPanel };
function renderPreviewPanel(doc, state) {
  var content  = state.content  || '';
  var complete = state.complete === true;
  // Find or create the panel
  var panel = doc.querySelector('[data-role="artefact-preview"]');
  if (!panel) {
    panel = doc.createElement('section');
    panel.setAttribute('data-role', 'artefact-preview');
    doc.body.appendChild(panel);
  }
  panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '';
  // Heading
  var heading = doc.createElement('h2');
  heading.textContent = 'Artefact Preview';
  panel.appendChild(heading);
  // Content area
  var pre = doc.createElement('pre');
  pre.textContent = content;
  panel.appendChild(pre);
  // Commit button
  var btn = doc.createElement('button');
  btn.setAttribute('data-action', 'commit-artefact');
  btn.textContent = 'Commit artefact';
  btn.disabled = !complete;
  panel.appendChild(btn);
}
