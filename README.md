# HalfTimeDad

Production-ready Next.js site centered on “Perspective before reaction” and The Founding Hundred.

## Included

- Story-first responsive homepage
- $9.99 monthly and $99 annual Stripe subscriptions
- Stripe-hosted Checkout and a verified webhook
- Supabase founder-number, billing-status, and referral records
- Idempotent fulfillment from both the webhook and `/welcome`
- Domestic Peace Monitor at `/peace-monitor`
- Privacy, terms, sitemap, robots, and Open Graph metadata

## 1. Supabase

Create a Supabase project and run `supabase.sql` in its SQL Editor. The script works for a fresh table and upgrades the earlier pre-Stripe table.

## 2. Stripe product and prices

In Stripe **test mode**:

1. Create one product named `HalfTimeDad Founding Membership`.
2. Add a recurring monthly price of **$9.99 USD**.
3. Add a recurring annual price of **$99 USD**.
4. Copy both `price_...` IDs.
5. In Branding, add the HalfTimeDad name, icon, colors, and support contact.
6. Configure the Customer Portal for subscription cancellation and payment-method updates. Do not expose a portal link until the site has authenticated member accounts.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in test values. In Vercel, add the same variables to Preview first:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (for example, the preview URL or `https://halftimedad.co`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`

Never expose the service-role key or Stripe secret key with a `NEXT_PUBLIC_` prefix.

## 4. Stripe webhook

For local testing, use Stripe CLI to forward events to:

`http://localhost:3000/api/stripe/webhook`

For Vercel, register:

`https://YOUR_DOMAIN/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the endpoint’s `whsec_...` secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Run and verify

1. `npm install`
2. `npm run dev`
3. Use Stripe’s test card `4242 4242 4242 4242`, any future expiration date, and any three-digit CVC.
4. Confirm the browser returns to `/welcome`.
5. Confirm the Supabase row becomes `active` and stores Stripe customer and subscription IDs.
6. Run `npm run lint` and `npm run build`.

## Go-live sequence

1. Complete a full test-mode purchase on a Vercel preview.
2. Confirm webhook delivery succeeds in Stripe.
3. Confirm the Supabase membership status is accurate.
4. Create or copy the product and both prices into Stripe live mode.
5. Replace test secret, webhook secret, and price IDs with live values in Vercel Production.
6. Verify the business name, statement descriptor, receipt email, support details, cancellation terms, tax settings, and refund policy in Stripe.
7. Have qualified counsel review the privacy policy and terms.
8. Deploy production and complete one small live transaction before announcing enrollment.

Stripe Checkout creates subscriptions; the webhook is the source of truth for membership access. Never grant access based only on a browser redirect.
