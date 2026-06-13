# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Bakery Application ("The Green Crumb")

A fully functional bakery ordering website for a small business selling brownies and cupcakes.

### Features
- Elegant green botanical theme with Playfair Display serif font
- Home page with hero, featured products, story/about, delivery info
- Menu page with category filtering, search, and product quick-view
- Cart-based ordering with Zustand + localStorage persistence
- Order form: customer info, in-town delivery or pickup selection
- Stripe payment integration (requires STRIPE_SECRET_KEY + VITE_STRIPE_PUBLISHABLE_KEY)
- Order confirmation page with full details
- In-town delivery ($3 fee) and out-of-town pickup support

### Architecture
- **Frontend**: `artifacts/bakery` — React + Vite + Tailwind + shadcn/ui
- **Backend**: `artifacts/api-server` — Express + Drizzle ORM
- **DB Schema**: `lib/db/src/schema/` — products, orders, order_items tables
- **API Contract**: `lib/api-spec/openapi.yaml` (codegen via Orval)
- **Generated hooks**: `lib/api-client-react` (React Query)
- **Zod schemas**: `lib/api-zod`

### API Routes (all prefixed with /api)
- `GET /products` — list all products
- `GET /products/:id` — single product
- `POST /orders` — create order (computes price server-side)
- `GET /orders/:id` — order by id
- `POST /payments/create-intent` — create Stripe payment intent
- `POST /payments/confirm` — confirm payment after Stripe success
- `GET /delivery-options` — delivery/pickup info

### Environment Variables Required
- `DATABASE_URL` — provisioned automatically
- `STRIPE_SECRET_KEY` — from Stripe integration (connect via Replit Stripe connector)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (set as env var in bakery)

### Products Seeded (8 items)
- Brownies: Classic Dark, Salted Caramel, Triple Chocolate, Nutella Swirl
- Cupcakes: Vanilla Dream, Red Velvet, Lemon Lavender, Chocolate Ganache

### Notes
- pnpm-workspace.yaml overrides react + react-dom to 19.1.0 to prevent duplicate copies
- Orval codegen patches api-zod index.ts barrel to avoid duplicate export conflicts
- Product images stored in artifacts/bakery/public/images/
