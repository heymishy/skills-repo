'use strict';
// dfp-s1 -- the users and products tables as the app creates them. Each statement is copied from the source named in
// `source`; tests/check-dfp-s1-fake-db-differential.js (T3) fails if a statement is no longer in its source, after
// whitespace is collapsed on both sides. The app's own modules are not required here: importing them re-boots the
// server (see the story's Architecture Constraints).

const SCHEMA = [
  { source: 'src/web-ui/server.js', statement: 'CREATE TABLE IF NOT EXISTS users ( id SERIAL PRIMARY KEY, email VARCHAR UNIQUE NOT NULL, password_hash TEXT NOT NULL, first_login BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() )' },
  { source: 'src/web-ui/server.js', statement: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT true' },
  { source: 'src/web-ui/server.js', statement: 'CREATE TABLE IF NOT EXISTS products ( product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id VARCHAR NOT NULL, name VARCHAR NOT NULL, description TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by VARCHAR NOT NULL DEFAULT \'system\', updated_at TIMESTAMPTZ DEFAULT NOW() )' },
  { source: 'src/web-ui/routes/products.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS mission TEXT' },
  { source: 'src/web-ui/routes/products.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS roadmap TEXT' },
  { source: 'src/web-ui/routes/products.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS tech_stack TEXT' },
  { source: 'src/web-ui/routes/products.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS constraints TEXT' },
  { source: 'src/web-ui/routes/products.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS architecture_guardrails TEXT' },
  { source: 'src/web-ui/modules/product-repo.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_provider VARCHAR' },
  { source: 'src/web-ui/modules/product-repo.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_owner VARCHAR' },
  { source: 'src/web-ui/modules/product-repo.js', statement: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_name VARCHAR' },
];

module.exports = { SCHEMA };
