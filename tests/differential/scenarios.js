'use strict';
// dfp-s1 -- the statements the app issues against users and products, in the order a signup and a product creation
// issue them. Each step has a `sql` and `params`, where params may be a function of the context captured by earlier
// steps (for example, the id a product insert returned on that same database). `capture` stores a value for later steps.
// The statements are the app's own (src/web-ui/routes/auth-email.js, src/web-ui/routes/products.js).

const SCENARIOS = [
  {
    name: 'users: signup inserts a user and returns its id',
    sql: 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    params: function () { return ['alice@example.com', 'hash-a']; },
  },
  {
    name: 'users: a second signup with the same email is a duplicate',
    sql: 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    params: function () { return ['alice@example.com', 'hash-b']; },
  },
  {
    name: 'users: lookup by email returns the stored row',
    sql: 'SELECT id, email, password_hash FROM users WHERE email = $1',
    params: function () { return ['alice@example.com']; },
  },
  {
    name: 'users: lookup of an unknown email returns no rows',
    sql: 'SELECT id, email, password_hash FROM users WHERE email = $1',
    params: function () { return ['nobody@example.com']; },
  },
  {
    name: 'products: creating the first product returns its id',
    sql: 'INSERT INTO products (tenant_id, name, description, mission, tech_stack, constraints, roadmap, architecture_guardrails, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING product_id',
    params: function () { return ['tenant-a', 'Alpha', 'first', 'mission', 'stack', 'limits', 'roadmap', 'guardrails', 'tenant-a']; },
    capture: function (rows, ctx) { ctx.alpha = rows[0].product_id; },
  },
  {
    name: 'products: creating a second product for the same tenant',
    sql: 'INSERT INTO products (tenant_id, name, description, mission, tech_stack, constraints, roadmap, architecture_guardrails, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING product_id',
    params: function () { return ['tenant-a', 'Beta', 'second', 'mission', 'stack', 'limits', 'roadmap', 'guardrails', 'tenant-a']; },
    capture: function (rows, ctx) { ctx.beta = rows[0].product_id; },
  },
  {
    name: 'products: list for the tenant, newest first',
    sql: 'SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC',
    params: function () { return ['tenant-a']; },
  },
  {
    name: 'products: list ids for another tenant is empty',
    sql: 'SELECT product_id FROM products WHERE tenant_id = $1',
    params: function () { return ['tenant-b']; },
  },
  {
    name: 'products: name by product id',
    sql: 'SELECT name FROM products WHERE product_id = $1',
    params: function (ctx) { return [ctx.alpha]; },
  },
  {
    name: 'products: name, tenant and repository columns of a product that has no repository yet',
    sql: 'SELECT name, tenant_id, repo_owner, repo_name FROM products WHERE product_id = $1',
    params: function (ctx) { return [ctx.alpha]; },
  },
  {
    name: 'products: an unknown product id returns no rows',
    sql: 'SELECT name FROM products WHERE product_id = $1',
    params: function () { return ['00000000-0000-0000-0000-000000000000']; },
  },
];

module.exports = { SCENARIOS };
