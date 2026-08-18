# Mobile7 finance contract

The mobile client models invoice and payment status but does not calculate totals or authorize payments. The server remains authoritative for tenant scope, invoice state, currency, payment limits, and duplicate prevention.

Confirmed mobile boundary: typed invoice/summary/payment contracts, read-only offline behavior, positive amount validation, and required idempotency keys.

API gaps to resolve before production payment flow: authenticated invoice listing, finance summary, payment intent/checkout creation, payment status polling/webhooks, receipts, refunds, and currency policy. No payment provider credentials are stored in the mobile app.
