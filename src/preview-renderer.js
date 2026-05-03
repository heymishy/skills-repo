'use strict';

function renderPreviewPanel(doc, state) {
  const root     = doc.querySelector('#root') || doc.body;
  const content  = (state && state.content)  || '';
  const complete = !!(state && state.complete);
  root.innerHTML = [
    '<section data-role="artefact-preview" aria-live="polite">',
    '  <h2>Artefact Preview</h2>',
    '  <div data-role="preview-content">' + escapeHtml(content) + '</div>',
    '  <button data-action="commit-artefact"' + (complete ? '' : ' disabled') + '>',
    '    Commit artefact',
    '  </button>',
    '</section>'
  ].join('\n');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = { renderPreviewPanel };
