'use strict';

var _fn = function() {
  throw new Error('Adapter not wired: productContext. Call setProductContextAdapter() before use.');
};

function getProductContext(productId) {
  return _fn(productId);
}

function setProductContextAdapter(fn) {
  _fn = fn;
}

module.exports = { getProductContext, setProductContextAdapter };
