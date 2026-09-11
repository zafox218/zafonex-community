# Deployment

## Before you go live

1. Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
2. Set a real `POSTGRES_PASSWORD` and a managed database URL.
3. Set `USDT_DEPOSIT_ADDRESS` to a wallet whose keys you control offline.
4. `NODE_ENV=production` — this hides internal error messages.
5. Put the API behind TLS. Refresh tokens over plain HTTP are a breach.

## Migrations

Development uses `prisma migrate dev`. Production uses:

```bash
npm run prisma:deploy --workspace=apps/api
```

Never run `migrate dev` against production — it can reset data.

## Frontend

```bash
npm run build          # apps/web/dist
```

Serve `dist/` from any static host with a SPA fallback to `index.html`, and
set `VITE_API_URL` to your API origin at build time.

## Operational checks

- `/health` for liveness.
- `/api/v1/admin/ledger/audit` in a daily cron. Any unbalanced transaction is
  a data-integrity incident: freeze withdrawals first, investigate second.
- Back up PostgreSQL before every deploy. The ledger is unreplayable if lost.

## Scaling path

The scaffold is deliberately single-node. When traffic justifies it:
Redis for session and rate-limit state, S3-compatible object storage for
product files, a queue for on-chain confirmation polling, then containerise
and move to Kubernetes.
