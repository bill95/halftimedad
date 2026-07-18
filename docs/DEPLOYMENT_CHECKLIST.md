# Deployment Checklist

## Before preview

- Create the Supabase project and run `supabase.sql`.
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel Preview.
- Add Stripe test secret, webhook secret, and monthly/annual price IDs to Vercel Preview.
- Register the preview webhook and select the documented subscription events.
- Re-run `supabase.sql` so the Stripe webhook event ledger exists.
- Confirm the site builds from the intended Git commit.

## Preview QA

- Test desktop and phone layouts.
- Submit monthly and annual founding-interest forms.
- Complete monthly and annual Stripe test checkouts.
- Confirm founder numbers and referral codes are written once per email.
- Confirm Stripe customer/subscription IDs and `active` status appear in Supabase.
- Confirm cancelled or past-due test subscriptions update Supabase through webhooks.
- Confirm `invoice.paid`, `invoice.payment_failed`, and `invoice.finalization_failed` deliveries are accepted.
- Resend one event and confirm it is recorded once in `stripe_webhook_events`.
- Test the Peace Monitor, incident reset, local persistence, and share link.
- Test privacy, terms, sitemap, and footer links.
- Confirm the Free Range Dad link opens the correct store.
- Confirm the success page never marks an unpaid or invalid session as active.

## Before production

- Create the product and monthly/annual Prices again in Stripe live mode; sandbox IDs do not work in live mode.
- Add a restricted live Stripe key, the live webhook signing secret, and live Price IDs to Vercel Production only.
- Register `https://www.halftimedad.co/api/stripe/webhook` as a live webhook with the documented events.
- Complete one small live transaction and refund/cancel it before announcing enrollment.
- Have privacy and terms reviewed by qualified counsel.
- Verify `halftimedad.co` and `www.halftimedad.co` domain behavior.
- Promote only a green preview build.
