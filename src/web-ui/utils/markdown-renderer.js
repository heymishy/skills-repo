'use strict';

// markdown-renderer.js — Converts markdown to sanitised HTML (no external dependencies).
// Security: strips <script> and <iframe> tags to prevent XSS (ADR-012 constraint).
// All output is server-side rendered — no raw innerHTML injection.

// ── Sanitisation ──────────────────────────────────────────────────────────

/**
 * Strip dangerous HTML tags from a string (XSS prevention).
 * Removes entire <script>...</script> and <iframe>...</iframe> blocks,
 * including their text content, plus any orphaned open/close tags.
 * @param {string} text
 * @returns {string}
 */
function sanitiseHTML(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '');
}

// ── HTML helpers ──────────────────────────────────────────────────────────

/** Escape HTML special characters for safe text embedding. */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Apply inline markdown formatting: **bold** → <strong>, *italic* → <em>.
 * @param {string} text
 * @returns {string}
 */
function applyInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
}

// ── Table renderer ────────────────────────────────────────────────────────

/**
 * Convert a block of pipe-delimited markdown table lines to an HTML table.
 * @param {string} tableText - raw table lines joined with \n
 * @returns {string} HTML table
 */
function renderTable(tableText) {
  const lines = tableText.trim().split('\n').filter(l => l.trim());

  // Header row (first line)
  const headerCells = lines[0]
    .split('|')
    .map(c => c.trim())
    .filter(c => c !== '');

  let html = '<table>\n<thead>\n<tr>';
  for (const cell of headerCells) {
    html += `<th>${escapeHtml(cell)}</th>`;
  }
  html += '</tr>\n</thead>\n<tbody>\n';

  // Skip separator row (index 1 — all dashes); process data rows from index 2
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split('|')
      .map(c => c.trim())
      .filter(c => c !== '');
    html += '<tr>';
    for (const cell of cells) {
      html += `<td>${escapeHtml(cell)}</td>`;
    }
    html += '</tr>\n';
  }

  html += '</tbody>\n</table>';
  return html;
}

// ── Metadata extraction ───────────────────────────────────────────────────

/**
 * Extract Status, Approved by, and Created fields from artefact markdown.
 * Looks for bold-field patterns: **FieldName:** Value
 * @param {string} markdown
 * @returns {{ status?: string, approvedBy?: string, created?: string }}
 */
function extractMetadata(markdown) {
  const meta = {};

  const statusMatch     = markdown.match(/\*\*Status:\*\*\s*(.+)/);
  const approvedByMatch = markdown.match(/\*\*Approved by:\*\*\s*(.+)/);
  const createdMatch    = markdown.match(/\*\*Created:\*\*\s*(.+)/);

  if (statusMatch)     meta.status     = statusMatch[1].trim();
  if (approvedByMatch) meta.approvedBy = approvedByMatch[1].trim();
  if (createdMatch)    meta.created    = createdMatch[1].trim();

  return meta;
}

// ── Metadata bar builder ──────────────────────────────────────────────────

function buildMetadataBar(meta) {
  const parts = [];
  if (meta.status)     parts.push(`<span class="meta-status">${escapeHtml(meta.status)}</span>`);
  if (meta.approvedBy) parts.push(`<span class="meta-approved-by">${escapeHtml(meta.approvedBy)}</span>`);
  if (meta.created)    parts.push(`<span class="meta-created">${escapeHtml(meta.created)}</span>`);
  return parts.join('\n');
}

// ── Markdown to HTML conversion ───────────────────────────────────────────

/**
 * Convert markdown to sanitised HTML prose.
 * Handles: headings (h1-h6), paragraphs, unordered lists, pipe tables, bold, italic.
 * XSS-safe: <script> and <iframe> tags are stripped before processing.
 * If meta is provided, a <div class="metadata-bar"> is prepended before the <article>.
 *
 * @param {string} markdown - raw markdown input
 * @param {{ status?: string, approvedBy?: string, created?: string }} [meta] - optional metadata
 * @returns {string} sanitised HTML
 */
function renderArtefactToHTML(markdown, meta) {
  // 1. Sanitise: strip dangerous tags from the raw input
  const text  = sanitiseHTML(markdown);
  const lines = text.split('\n');

  let html = '';
  let i    = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${applyInline(headingMatch[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Table — line starts with |
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      html += renderTable(tableLines.join('\n')) + '\n';
      continue;
    }

    // Unordered list
    if (line.match(/^[-*+]\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
        const itemContent = lines[i].replace(/^[-*+]\s+/, '');
        listItems.push(`<li>${applyInline(itemContent)}</li>`);
        i++;
      }
      html += `<ul>\n${listItems.join('\n')}\n</ul>\n`;
      continue;
    }

    // Blank line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].match(/^[-*+]\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html += `<p>${applyInline(paraLines.join(' '))}</p>\n`;
    }
  }

  const article = `<article>\n${html}</article>`;

  // If metadata is provided, prepend the metadata bar before the article
  if (meta && Object.keys(meta).length > 0) {
    const metaBar = buildMetadataBar(meta);
    return `<div class="metadata-bar">\n${metaBar}\n</div>\n${article}`;
  }

  return article;
}

module.exports = { renderArtefactToHTML, extractMetadata };
