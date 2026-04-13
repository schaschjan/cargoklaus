# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev                   # Start dev server
pnpm build                 # Production build
pnpm start                 # Start production server
pnpm lint                  # Run ESLint
pnpm lint:fix              # Run ESLint with auto-fix
pnpm generate:types        # Regenerate payload-types.ts after schema changes
pnpm generate:importmap    # Regenerate admin import map after adding components
pnpm test                  # Run all tests (integration + e2e)
pnpm test:int              # Run integration tests (Vitest, tests/int/**/*.int.spec.ts)
pnpm test:e2e              # Run e2e tests (Playwright)
pnpm stripe-webhooks       # Forward Stripe webhooks to localhost:3000
```

Validate TypeScript without emitting: `tsc --noEmit`

Seed the database via the admin panel UI button, or `GET /next/seed` when the server is running.

## Environment Variables

Copy `.env.example` to `.env`. Required vars:
- `PAYLOAD_SECRET`, `DATABASE_URL` (MongoDB)
- `NEXT_PUBLIC_SERVER_URL` / `PAYLOAD_PUBLIC_SERVER_URL`
- `PREVIEW_SECRET`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOKS_SIGNING_SECRET`

## Architecture

This is a **Next.js 16 + Payload CMS 3** ecommerce app using MongoDB. The project uses `pnpm` and ESM (`"type": "module"`). Import alias `@/` maps to `src/`.

### Route Groups

- `src/app/(app)/` — Customer-facing Next.js frontend (shop, checkout, account, orders)
- `src/app/(payload)/` — Payload admin panel (auto-managed by `@payloadcms/next`)

### Payload Collections & Globals

Defined in `src/payload.config.ts`. Base collections: `Users`, `Pages`, `Categories`, `Media`. Globals: `Header`, `Footer`.

The **`@payloadcms/plugin-ecommerce`** plugin injects additional collections: `products`, `variants`, `variantOptions`, `variantTypes`, `carts`, `orders`, `transactions`, `addresses`. These are configured in `src/plugins/index.ts`.

**Products** are not a plain `CollectionConfig` — they use a `CollectionOverride` pattern from the ecommerce plugin:

```ts
// src/collections/Products/index.ts
export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [ /* custom fields merged with plugin defaults */ ],
})
```

This is passed to `ecommercePlugin({ products: { productsCollectionOverride: ProductsCollection } })`.

### Access Control

Reusable access functions live in `src/access/`. The `roles` field on `Users` has two values: `admin` and `customer`. The ecommerce plugin receives access functions explicitly via its config (see `src/plugins/index.ts`).

### Frontend Auth

Client-side authentication state is managed by `AuthProvider` at `src/providers/Auth/index.tsx`, which calls Payload's REST auth endpoints (`/api/users/login`, `/me`, `/logout`, etc.). Use the `useAuth()` hook in client components to access the current user.

### Content Blocks

Reusable page blocks (used in Pages and Products layouts) are in `src/blocks/`. Each block has a `config.ts` (Payload field config) and a `Component.tsx` (React render). `src/blocks/RenderBlocks.tsx` maps block slugs to components.

### Generated Types

`src/payload-types.ts` is auto-generated — **never edit it manually**. Run `pnpm generate:types` after any collection/field schema change.

### Seeding

`src/endpoints/seed/index.ts` creates demo data: categories, products with variants (hat, t-shirt with size/color options), media, pages, addresses, carts, orders, and transactions. The seed endpoint is exposed at `src/app/(app)/next/seed/route.ts`.

## Payload-Specific Rules

See `AGENTS.md` for comprehensive Payload CMS patterns: security rules (overrideAccess, hook transactions, infinite loop prevention), access control patterns, query operators, hooks, components, and common gotchas.

Key points specific to this project:
- Roles are `admin` | `customer` (not `editor` or `user`)
- After modifying collections or fields: run `generate:types`, then `generate:importmap` if components changed
- MongoDB requires a replica set to use transactions
