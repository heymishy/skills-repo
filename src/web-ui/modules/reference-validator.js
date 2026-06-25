'use strict';
var path = require('path');
var fs   = require('fs');

var MAX_SIZE_BYTES = 1_048_576; // 1 MB

/**
 * Validate a reference file candidate.
 * @param {{ name: string, size: number, content: Buffer }} file
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateReferenceFile(file) {
  var name    = file.name || '';
  var size    = file.size || 0;
  var content = file.content;

  if (!name.toLowerCase().endsWith('.md')) {
    return { valid: false, error: '"' + name + '" is not a valid markdown file — only .md files are accepted' };
  }

  if (size > MAX_SIZE_BYTES) {
    return { valid: false, error: '"' + name + '" exceeds the 1 MB size limit (' + size + ' bytes)' };
  }

  if (content) {
    try {
      // TextDecoder with fatal:true throws on invalid UTF-8 sequences
      new TextDecoder('utf-8', { fatal: true }).decode(content);
    } catch (_) {
      return { valid: false, error: '"' + name + '" is not valid UTF-8 and cannot be used as a reference file' };
    }
  }

  return { valid: true };
}

/**
 * Write a validated reference file to disk.
 * Path traversal guard: resolved path must be inside repoRoot.
 * @param {string} repoRoot
 * @param {string} featureSlug
 * @param {string} filename
 * @param {string} content — UTF-8 string
 * @throws if path traversal detected
 */
function writeReferenceFile(repoRoot, featureSlug, filename, content) {
  var refDir  = path.resolve(repoRoot, 'artefacts', featureSlug, 'reference');
  var outPath = path.resolve(refDir, filename);

  if (!outPath.startsWith(repoRoot + path.sep)) {
    throw Object.assign(new Error('Path traversal detected in filename: ' + filename), { code: 'PATH_TRAVERSAL' });
  }

  fs.mkdirSync(refDir, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
}

module.exports = { validateReferenceFile, writeReferenceFile };
