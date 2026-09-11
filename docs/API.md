# API reference — /api/v1

All request and response bodies are JSON. Authenticated routes take
`Authorization: Bearer <accessToken>`.

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | email, username, password (10+), displayName |
| POST | `/auth/login` | returns user + accessToken + refreshToken |
| POST | `/auth/refresh` | rotates the refresh token |
| POST | `/auth/logout` | revokes the refresh token |
| GET | `/auth/me` | current user |

## Catalogue
| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | all categories |
| GET | `/products` | `q, category, min, max, sort, page, limit` |
| GET | `/products/:slug` | detail with reviews |
| POST | `/products` | SELLER or ADMIN |
| PATCH | `/products/:id` | owner or ADMIN |
| DELETE | `/products/:id` | soft archive |
| GET | `/services` · `/services/:slug` | packages included |
| POST | `/services` | creates service plus 1–3 packages |
| GET | `/courses` · `/courses/:slug` | non-preview lessons locked when not enrolled |
| POST | `/courses` · `/courses/:id/modules` | instructor only |
| POST | `/courses/lessons/:lessonId/progress` | recomputes enrolment percentage |

## Orders
| Method | Path | Notes |
|---|---|---|
| POST | `/orders/checkout` | mixed baskets allowed |
| GET | `/orders` | as buyer |
| GET | `/orders/selling` | as seller |
| POST | `/orders/items/:itemId/deliver` | seller marks work delivered |
| POST | `/orders/items/:itemId/accept` | buyer accepts, escrow releases |

## Wallet
| Method | Path | Notes |
|---|---|---|
| GET | `/wallet` | balances, last 30 ledger entries, deposit address |
| POST | `/wallet/deposits` | declare an on-chain transfer |
| POST | `/wallet/deposits/:id/confirm` | ADMIN — credits the wallet |
| POST | `/wallet/withdrawals` | debits available immediately |
| GET | `/wallet/withdrawals` | payout history |

## Admin
`/admin/stats`, `/admin/deposits`, `/admin/withdrawals`,
`/admin/withdrawals/:id/sent`, `/admin/ledger/audit`, `/admin/users/:id`.

## Errors

```json
{ "error": { "message": "…", "code": "UNPROCESSABLE", "details": [ … ] } }
```

`400` bad request · `401` unauthenticated · `403` role or ownership ·
`404` missing · `409` conflict · `422` validation · `429` rate limited.
