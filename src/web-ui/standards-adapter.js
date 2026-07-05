'use strict';

var _fn = function() {
  throw new Error('Adapter not wired: standards. Call setStandardsAdapter() before use.');
};

function getActiveStandards(productId, orgId) {
  return _fn(productId, orgId);
}

function setStandardsAdapter(fn) {
  _fn = fn;
}

module.exports = { getActiveStandards, setStandardsAdapter };
