# Checkout + QPay E2E Audit

**Date:** 2026-07-28  
**Scope:** Live `https://eseller.mn` + `Sarana-eseller/nextjs` source  
**Auth:** No production buyer credentials in CI — structural + unauth probes only unless `ESELLER_*` env set.

---

## 1. Flow map (intended)

```
Cart (client)
  → POST /api/checkout/create-invoice   [JWT required]
      → prisma.order.create(status: pending, paymentMethod: qpay)
      → QPay createInvoice  OR  demo invoice if isDemoMode()
      → order.paymentId = invoice_id
      → PaymentTransaction PENDING
  → Client shows QR (qr_image / qrDataUrl)
  → Poll GET /api/checkout/check-payment/[invoiceId]
      OR GET /api/payment/qpay/check/[invoiceId]
  → QPay callback POST /api/payment/qpay/callback
      → mark order paid / release escrow hooks
```

### Alternate entry points

| Path | Role |
|------|------|
| `POST /api/payment/qpay/create` | Low-level invoice only (orderId + amount) |
| `POST /api/checkout/create-invoice` | **Primary** web/mobile checkout (auth + order) |
| `POST /api/payment/socialpay` | SocialPay alternate |
| `GET /api/buyer/orders` | Buyer order list (auth) |
| `GET /api/orders` | **404 on live** — not the buyer surface |

---

## 2. Live unauth probes (2026-07-28)

| Endpoint | Method | Result | Expected |
|----------|--------|--------|----------|
| `/api/checkout/create-invoice` | GET | 405 | POST only |
| `/api/checkout/create-invoice` | POST no body/token | 401 | Auth required ✅ |
| `/api/payment/qpay` | GET | 404 | Use `/create` or `/check` |
| `/api/payment/qpay/create` | GET | 405 | POST only |
| `/api/buyer/orders` | GET | 401 | Auth required ✅ |
| `/api/orders` | GET | **404** | Mobile legacy path mismatch ⚠️ |
| `/api/health` | GET | 200 | OK |

---

## 3. Code review findings

### 3.1 Strengths

- Checkout **requires JWT** (`getAuthUser`) — no anonymous paid orders.
- Platform fee (2%) computed server-side.
- Demo mode path exists when QPay credentials missing (`isDemoMode()`).
- Seller push notification best-effort after order create.
- PaymentTransaction written for webhook correlation.

### 3.2 Gaps / risks

| ID | Severity | Issue | Fix |
|----|----------|--------|-----|
| Q1 | 🔴 | **Orders ≈ 0** on live (`/api/stats.orderCount=0`, public stats totalOrders=1) — E2E never proven with real money | Seed test buyer + run demo QPay checkout; enable real QPay only after sandbox green |
| Q2 | 🔴 | **Catalog empty** blocks cart from store surface | P0 catalog fix (salePrice + demo + visibility) |
| Q3 | 🟠 | Dual QPay stacks: `lib/payment/qpay` (checkout) vs `lib/qpay` (payment/create) | Unify on one module + one envelope |
| Q4 | 🟠 | `POST /api/payment/qpay/create` **does not require auth** — anyone with orderId can mint invoice | Require auth + order ownership check |
| Q5 | 🟠 | Mobile may call `/api/orders` (404) instead of `/api/buyer/orders` | Alias route or mobile path fix |
| Q6 | 🟡 | Callback/webhook idempotency not verified in this pass | Add script: double-callback same invoice |
| Q7 | 🟡 | No automated smoke with token in CI (credentials) | `ESELLER_LOGIN_*` + `scripts/smoke-checkout-qpay.ts` |
| Q8 | 🟡 | Multi-shop: order.shopId derived from first product’s owner’s **first** shop — may be wrong store | Prefer `product.shopId` |

### 3.3 Auth contract for real E2E

```bash
# From nextjs/
export DATABASE_URL=...   # optional for DB asserts
export ESELLER_API_BASE=https://eseller.mn
export ESELLER_LOGIN_IDENTIFIER=buyer@example.com
export ESELLER_LOGIN_PASSWORD=...

# 1) Login
curl -s -X POST "$ESELLER_API_BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$ESELLER_LOGIN_IDENTIFIER\",\"password\":\"$ESELLER_LOGIN_PASSWORD\"}"

# 2) Create invoice (use TOKEN + a real public productId)
curl -s -X POST "$ESELLER_API_BASE/api/checkout/create-invoice" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<id>","name":"Test","price":10000,"quantity":1}],"totalAmount":10000,"phone":"99001122"}'

# 3) Poll check-payment with invoice id from response
```

**Demo mode expectation:** QR points at order page; payment not real.  
**Production QPay:** requires `QPAY_*` env on Vercel; verify with sandbox merchant.

---

## 4. Pass criteria (when credentials available)

- [ ] Login returns JWT + optional `shops[]`
- [ ] Create-invoice returns `orderId` + `invoice` + QR (demo or real)
- [ ] Order appears in `GET /api/buyer/orders`
- [ ] Unauth create-invoice stays 401
- [ ] Forged orderId cannot create invoice for another user (after Q4 fix)
- [ ] Callback marks paid once only

---

## 5. Recommended next implementation (ordered)

1. P0 catalog data (`scripts/fix-catalog-data.ts --apply`) so cart has real SKUs  
2. Secure `payment/qpay/create` with auth + ownership  
3. Prefer `product.shopId` when attaching order.shopId  
4. Add `scripts/smoke-checkout-qpay.ts` behind env credentials  
5. Unify QPay client libraries  

---

## 6. Related routes (source)

- `src/app/api/checkout/create-invoice/route.ts`
- `src/app/api/checkout/check-payment/[invoiceId]/route.ts`
- `src/app/api/payment/qpay/create/route.ts`
- `src/app/api/payment/qpay/check/[invoiceId]/route.ts`
- `src/app/api/payment/qpay/callback/route.ts`
- `src/app/api/buyer/orders/route.ts`
- `src/lib/payment/qpay.ts` / `src/lib/qpay.ts`
