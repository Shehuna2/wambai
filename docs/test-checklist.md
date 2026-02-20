# Test Checklist

## Manual test scenarios

1. **Auth/register/login (buyer/vendor)**
   - Register buyer and vendor accounts.
   - Login both and verify JWT-authenticated API access.

2. **Vendor creates shop → remains unapproved → not visible in buyer browse**
   - Vendor creates shop via `/api/shops/`.
   - Confirm `is_approved=false` in admin.
   - Buyer `GET /api/shops/` should not include that shop.

3. **Admin approves shop → buyer can see shop**
   - Use admin action “Approve selected shops”.
   - Confirm `is_approved=true`, `approved_at`, `approved_by` set.
   - Buyer `GET /api/shops/` now includes approved active shop.

4. **Vendor creates product (fabric with qty_step 0.5) → unapproved → not visible**
   - Vendor creates product under own shop with unit `yard`, `qty_step=0.5`.
   - Confirm `is_approved=false` in admin.
   - Buyer `GET /api/products/` should not include it.

5. **Admin approves product → buyer can see product**
   - Use admin action “Approve selected products”.
   - Confirm `is_approved=true`, `approved_at`, `approved_by` set.
   - Buyer `GET /api/products/` includes product only when product+shop active/approved.

6. **Buyer adds 1.5 yard to cart → passes; 1.2 yard fails**
   - For product with min `1.0`, step `0.5`: add qty `1.5` succeeds.
   - Add qty `1.2` fails validation.

7. **Wallet top-up (Fincra init) → webhook success → wallet credited**
   - Initialize topup for supported currency.
   - Send signed successful webhook.
   - Confirm pending TOPUP ledger entry posts once and balance updates in correct minor units.

8. **Wallet checkout NGN → order PAID, stock decremented (Decimal-safe)**
   - Fund NGN wallet and checkout with wallet.
   - Confirm order transitions to `PAID`, stock decremented without negative drift.

9. **Wallet checkout non-NGN → stays pending until conversion webhook then PAID**
   - Checkout using non-NGN wallet currency.
   - Confirm order starts as `PENDING_PAYMENT` with pending conversion entries.
   - Send conversion success webhook and verify conversion posting then order `PAID`.

10. **Vendor sees VendorOrders and updates status**
    - Vendor fetches their vendor orders.
    - Vendor updates order status (e.g., `PROCESSING`) successfully.

11. **Admin wallet adjustment credit/debit with audit trail**
    - In admin create WalletAdjustment credit and debit.
    - Confirm debit cannot make balance negative.
    - Confirm corresponding immutable posted `LedgerEntry` exists with reason/creator metadata.

## Automated checks

- Run full backend tests:
  - `cd backend && python manage.py test`
