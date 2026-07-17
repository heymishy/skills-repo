# Product

## What it is

A product is a tenant's named entry in the existing `products` table (`src/web-ui/server.js`), with a web UI at `/products`, `/products/:id`, and `/products/:id/kanban`. Each product row optionally carries a connected repo (`repo_provider`/`repo_owner`/`repo_name`, added by `prc-s1.1`) and a standards-hierarchy set of fields (`mission`, `roadmap`, `tech_stack`, `constraints`, `architecture_guardrails`, added by `psh-s3`) mirroring this platform's own `product/*.md` files.

Product is not a new primitive introduced alongside the other seven — it formally documents an entity that already exists in code and has been in production use since `psh-s1`. Adding it here closes a gap where the platform's own conceptual model didn't yet reflect what the codebase already does.

## Why it exists

A tenant's "product" already is a repo — if that repo runs this pipeline, its own `pipeline-state.json` is the natural rollup target for that same entity. Before this was formally named, the `products` table existed purely as a SaaS domain object with no explicit place in the platform's own conceptual vocabulary, even though it was the foundation for later work (repo association, standards hierarchy, and the product-rollup feature that reads a product's connected repo).

## How it works

A product row is created via the existing `/products/new` flow (`src/web-ui/routes/products.js`), scoped by `tenant_id` — the same application-layer tenant-scoping convention (ADR-025) used across this codebase. A product can optionally connect a GitHub repo, giving it a `repo_owner`/`repo_name` pair that other features (sign-off write-back, product rollup) use to reach that repo's own governed state.

skills-framework registers itself as a product in its own `products` table, using the same mechanism any tenant's product uses — the degenerate case of "a product whose repo happens to be this one." This gives features like product rollup one consistent code path for both a tenant's connected repo and this platform's own repo.

## What you do with it

You create a product through the web UI's "New product" flow. You do not need to do anything for skills-framework's own product row — it self-registers at server startup if `PLATFORM_TENANT_ID`, `GITHUB_REPO_OWNER`, and `GITHUB_REPO_NAME` are configured (see `.env.example`).

## Further reading

Optional further reading: [Pipeline state](pipeline-state.md) — explains the per-feature state a product's connected repo's rollup reads from.
