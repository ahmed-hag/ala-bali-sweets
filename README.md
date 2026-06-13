# Ala Bali Sweets - Bakery Ordering Platform

Full-stack pnpm monorepo with React storefront, Express API, PostgreSQL/Drizzle, Stripe payments, and admin tooling.

---

## Quick Start

```bash
# 1. Install dependencies (requires pnpm)
pnpm install

# 2. Set up environment variables
cp packages/api-server/.env.example packages/api-server/.env
cp artifacts/bakery/.env.example artifacts/bakery/.env

# 3. Start PostgreSQL (via Docker or local)
docker run --name postgres \
  -e POSTGRES_USER=bakery \
  -e POSTGRES_PASSWORD=*** \
  -e POSTGRES_DB=ala_bali_sweets \
  -p 5432:5432 \
  -d postgres:16

# 4. Push database schema
cd packages/db && pnpm db:push

# 5. (Optional) Seed sample products
cd packages/db && pnpm db:seed

# 6. Start both servers (in separate terminals)

# Terminal 1 - API Server (default PORT=3001)
cd artifacts/api-server
PORT=3001 NODE_ENV=development pnpm dev

# Terminal 2 - Storefront (default PORT=5173)
cd artifacts/bakery
PORT=5173 BASE_PATH=/ VITE_API_URL=http://localhost:3001/api pnpm dev

# 7. Open http://localhost:5173
```

---

## Project Structure

```
ala-bali-sweets/
├── lib/                          # Shared workspace packages
│   ├── db/                       # Drizzle ORM + Postgres client
│   ├── api-spec/                 # OpenAPI 3.1 spec (source of truth)
│   ├── api-zod/                  # Zod schemas generated from OpenAPI
│   └── api-client-react/         # React Query client + hooks
├── artifacts/                    # Deployable applications
│   ├── api-server/               # Express 5 backend
│   └── bakery/                   # React 19 + Vite + Tailwind 4 storefront
├── scripts/                      # Utility scripts
├── pnpm-workspace.yaml           # Workspace config
└── package.json                  # Root scripts
```

---

## Available Scripts

### Root (run from repo root)

```bash
pnpm install              # Install all deps
pnpm run build            # Typecheck + build all packages
pnpm run typecheck        # TypeScript check all
```

### Database (`packages/db`)

```bash
pnpm db:push              # Push schema to database (dev)
pnpm db:migrate           # Run migrations (prod)
pnpm db:studio            # Open Drizzle Studio GUI
pnpm db:seed              # Seed sample products
pnpm db:generate          # Generate migrations from schema changes
```

### API Server (`artifacts/api-server`)

```bash
pnpm dev                  # Build + start (requires PORT env)
pnpm build                # Bundle with esbuild → dist/
pnpm start                # Run built server (requires PORT env)
pnpm typecheck            # TypeScript check
```

### Storefront (`artifacts/bakery`)

```bash
pnpm dev                  # Start Vite dev server (requires PORT, BASE_PATH)
pnpm build                # Production build → dist/public
pnpm serve                # Preview production build
pnpm typecheck            # TypeScript check
```

---

## Environment Variables

### API Server (`artifacts/api-server/.env`)

```bash
# Required
PORT=3001                              # Server port
DATABASE_URL=postgresql://bakery:***@localhost:5432/ala_bali_sweets
SESSION_SECRET=*** (min 32 chars)

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=***        # For webhook endpoint

# Optional
NODE_ENV=development
FRONTEND_URL=http://localhost:5173     # For CORS
```

### Storefront (`artifacts/bakery/.env`)

```bash
# Required
PORT=5173                              # Vite dev server port
BASE_PATH=/                            # Base path (use "/" for local)
VITE_API_URL=http://localhost:3001/api # API server URL

# Optional
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx # For Stripe.js
```

---

## Database Schema

### Products
| Field | Type |
|-------|------|
| id | serial PK |
| name | text |
| description | text |
| price | numeric(10,2) |
| category | enum: 'brownie' \| 'cupcake' |
| imageUrl | text |
| available | boolean |

### Orders
| Field | Type |
|-------|------|
| id | serial PK |
| customerName | text |
| customerEmail | text |
| customerPhone | text |
| deliveryType | enum: 'delivery' \| 'pickup' |
| deliveryAddress | text |
| totalAmount | numeric(10,2) |
| status | enum: pending/paid/preparing/ready/completed/cancelled |
| paymentIntentId | text |
| notes | text |
| createdAt | timestamp |

### Order Items
| Field | Type |
|-------|------|
| id | serial PK |
| orderId | FK → orders |
| productId | FK → products |
| productName | text |
| quantity | integer |
| unitPrice | numeric(10,2) |
| subtotal | numeric(10,2) |

---

## Customizing Images

Product images are served from `artifacts/bakery/public/images/` and referenced by `imageUrl` in the database.

### Current Stock Images
```
artifacts/bakery/public/images/
├── hero.jpg                    # Homepage hero banner
├── brownie-1.jpg
├── brownie-2.jpg
├── classic-dark-brownie.jpg
├── salted-caramel-brownie.jpg
├── cupcake-1.jpg
└── cupcake-2.jpg
```

### To Replace with Your Photos

1. **Convert to web format** (WebP recommended, JPEG/PNG also work):
   ```bash
   # macOS: Right-click → Quick Actions → Convert Image → WebP
   # Or use: brew install imagemagick && magick input.HEIC output.webp
   ```

2. **Replace files** (keep same filenames for zero-config update):
   ```bash
   # Example: your brownie photo → brownie-1.jpg
   cp your-photo.jpg artifacts/bakery/public/images/brownie-1.jpg
   ```

3. **Update database** if filename extension changed:
   ```bash
   # Via Drizzle Studio (easiest)
   pnpm db:studio
   # Edit products table → imageUrl column
   
   # Or run a quick script
   cd packages/db && pnpm tsx scripts/update-images.ts
   ```

---

## API Endpoints

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/healthz` | Health check |
| GET | `/products` | List all products |
| GET | `/products/:id` | Get single product |
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Get order |
| POST | `/payments/create-intent` | Create Stripe PaymentIntent |
| POST | `/payments/confirm` | Confirm payment |
| GET | `/delivery-options` | Get delivery/pickup options |

---

## Stripe Setup (for payments)

1. **Create Stripe account** → https://dashboard.stripe.com/register
2. **Get test keys** → Developers → API keys
3. **Add to `.env`** files (both API and storefront)
4. **Set up webhook** (for production):
   ```bash
   # Local testing with Stripe CLI
   stripe listen --forward-to localhost:3001/api/payments/webhook
   ```
5. **Add test products/prices** in Stripe Dashboard matching your DB products

---

## Development Workflow

### Adding a New Product

1. **Add image** to `artifacts/bakery/public/images/`
2. **Insert via Drizzle Studio** or API:
   ```bash
   pnpm db:studio
   # Or POST to /api/products (admin only)
   ```
3. **Verify** on storefront at `/menu`

### Making Schema Changes

```bash
# 1. Edit schema in packages/db/src/schema/
# 2. Generate migration
cd packages/db && pnpm db:generate

# 3. Apply to local DB
cd packages/db && pnpm db:push

# 4. Commit migration file
git add packages/db/drizzle/
```

### Type-Safe API Changes

1. **Edit OpenAPI spec**: `lib/api-spec/openapi.yaml`
2. **Regenerate clients**:
   ```bash
   cd lib/api-spec && pnpm generate
   ```
3. **Types flow to**: `api-zod` → `api-client-react` → frontend & backend

---

## Deployment (Replit)

The project is configured for Replit via `.replit-artifact` files.

1. **Push to GitHub**
2. **Import in Replit** → Select monorepo
3. **Add secrets** in Replit Secrets tab:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
4. **Run** → Replit detects `pnpm` and starts both servers

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `PORT` required error | Set `PORT=3001` (API) or `PORT=5173` (Vite) |
| `BASE_PATH` required | Set `BASE_PATH=/` for local dev |
| Database connection failed | Check `DATABASE_URL`, ensure Postgres running |
| Stripe webhook 404 | Use Stripe CLI for local: `stripe listen --forward-to localhost:3001/api/payments/webhook` |
| React Query cache stale | Dev tools → "Invalidate Queries" or refresh |
| Type errors after schema change | Run `pnpm run typecheck` from root, regenerate API client |
| Images not loading | Check `public/images/` filenames match DB `imageUrl` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, Tailwind 4, TanStack Query, Wouter, Radix UI |
| **Backend** | Express 5, Drizzle ORM, Postgres, Stripe, pino logging |
| **Shared** | OpenAPI 3.1 → Orval → Zod + React Query (type-safe end-to-end) |
| **Package Manager** | pnpm (workspace, security-hardened) |
| **Deployment** | Replit (configured) |

---

## License

MIT — Built for Ala Bali Sweets, Beaumont, CA