'use strict';

// annotation-renderer.js — server-side HTML rendering of annotation affordances and existing annotations (wuce.8)
// DOM-state output: produces HTML string; does not require a browser.
// Accessibility: each section heading gets a focusable annotation button (WCAG 2.1 AA).

const { parseExistingAnnotations } = require('./annotation-utils');

/**
 * Render annotation affordances and existing annotations for an artefact.
 * Each ## or ### heading gets a focusable "Add annotation" button.
 * Existing annotations are rendered below their target section.
 *
 * @param {string} artefactContent - raw markdown content of the artefact
 * @returns {string} HTML string with annotation affordances and existing annotations
 */
function renderAnnotations(artefactContent) {
  if (typeof artefactContent !== 'string' || !artefactContent.trim()) {
    return '<div class="artefact-annotations-container"></div>';
  }

  // Normalise CRLF so heading regex and line splitting work consistently
  const normalised = artefactContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const annotations = parseExistingAnnotations(normalised);
  const annotationsBySection = {};
  for (const ann of annotations) {
    const key = ann.sectionHeading;
    if (!annotationsBySection[key]) annotationsBySection[key] = [];
    annotationsBySection[key].push(ann);
  }

  const lines = normalised.split('\n');
  let html = '<div class="artefact-annotations-container">\n';

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[2].trim();
      // Skip rendering affordances for the ## Annotations section itself
      if (headingText === 'Annotations') continue;

      html += '<div class="annotation-section" data-section="' + _escapeAttr(headingText) + '">\n';
      html += '  <span class="section-heading">' + _escapeHtml(headingText) + '</span>\n';
      html += '  <button class="annotation-affordance" tabindex="0" aria-label="Add annotation to section: ' + _escapeAttr(headingText) + '">';
      html += 'Add annotation</button>\n';

      // Render existing annotations for this section
      const sectionAnns = annotationsBySection[headingText] || [];
      for (const ann of sectionAnns) {
        html += '  <div class="annotation-entry">\n';
        html += '    <span class="annotation-author">' + _escapeHtml(ann.annotatorName) + '</span>\n';
        html += '    <span class="annotation-date">' + _escapeHtml(ann.date) + '</span>\n';
        html += '    <p class="annotation-text">' + _escapeHtml(ann.text) + '</p>\n';
        html += '  </div>\n';
      }

      html += '</div>\n';
    }
  }

  html += '</div>';
  return html;
}

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

module.exports = { renderAnnotations };
