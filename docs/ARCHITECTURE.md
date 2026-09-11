# Architecture

## Why one platform, not three

Marketplace, freelance and courses look like three products, but they share
the parts that are hard: identity, listings, checkout, payouts, disputes and
reputation. Splitting them would mean maintaining that spine three times.
ZAFONEX keeps one spine and varies only the delivery model:

| Storefront  | Delivery      | Escrow          |
|-------------|---------------|-----------------|
| Product     | instant file  | released at once |
| Course      | instant access| released at once |
| Service     | human work    | held until accepted |

## The ledger is the source of truth

`LedgerAccount.balance` is a cache. The truth is the append-only
`LedgerEntry` table. `postTransaction()` in `src/lib/ledger.js` is the only
code allowed to change a balance, and it refuses any group of entries whose
debits and credits do not cancel.

Account types:

- `USER_AVAILABLE`   — spendable
- `USER_ESCROW`      — buyer money locked against an open order
- `USER_PENDING`     — reserved for delayed release rules
- `PLATFORM_REVENUE` — commission
- `PLATFORM_GATEWAY` — the chain wallet

`GET /api/v1/admin/ledger/audit` replays recent transactions and reports any
that fail to balance. If that endpoint ever goes red, stop taking orders.

## Money in six decimal places

USDT has six decimals. Floats do not. Amounts are stored as
`Decimal(18,6)` and manipulated as `BigInt` micros in `src/lib/money.js`.
Never do arithmetic on a `Number` that represents money.

## Auth

Access tokens live 15 minutes and carry `sub`, `role` and `username`.
Refresh tokens live 30 days, are stored **hashed**, and rotate on every use —
a stolen refresh token is single-use and its reuse is detectable because the
original row is already revoked.

Passwords use Argon2id at 19 MiB memory cost, which is the OWASP baseline.

## Request lifecycle

```
helmet → cors → json → cookies → pino-http → rate limit
  → route → validate(zod) → requireAuth → requireRole → handler
  → errorHandler
```

Handlers are wrapped in `asyncHandler`, so a rejected promise becomes a JSON
error response instead of an unhandled rejection.
