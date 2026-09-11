# ZAFONEX Community

A digital marketplace, a freelance board and a course platform sharing one
wallet and one double-entry ledger. Settled in USDT, so it works in regions
where card processors will not onboard creators.

## Stack

| Layer    | Choice                                                    |
|----------|-----------------------------------------------------------|
| Frontend | React 18 · Vite 5 · TailwindCSS 3 · Zustand · React Router |
| Backend  | Node 20+ · Express 4 · Prisma 6 · PostgreSQL 16            |
| Auth     | JWT access + rotating refresh · Argon2id · RBAC            |
| Money    | Double-entry ledger, escrow, USDT deposits and payouts     |

## Quick start

```bash
npm run db:up        # PostgreSQL 16 + Adminer via Docker
npm run db:migrate   # create the schema
npm run db:seed      # categories + 3 demo accounts
npm run dev          # API :4000 · web :5173
```

Demo logins (all `Passw0rd!demo`): `admin@zafonex.local`,
`seller@zafonex.local`, `buyer@zafonex.local`.

## Layout

```
apps/api    Express + Prisma. Modules under src/modules/<domain>/
apps/web    React. Pages, stores (Zustand), components, lib/api.js
docs/       Architecture, API reference, deployment
```

See `docs/` for the full guide.
