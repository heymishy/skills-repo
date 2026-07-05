'use strict';

var _generateFn = function() {
  throw new Error('Adapter not wired: generateProductDraft. Call setGenerateProductDraft() before use.');
};

function generateProductDraft(fields) {
  return _generateFn(fields);
}

function setGenerateProductDraft(fn) {
  _generateFn = fn;
}

module.exports = { generateProductDraft, setGenerateProductDraft };
