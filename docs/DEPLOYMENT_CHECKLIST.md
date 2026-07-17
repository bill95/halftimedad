# Deployment Checklist

## Before preview

- Create the Supabase project and run `supabase.sql`.
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Vercel Preview.
- Add Stripe test secret, webhook secret, and monthly/annual price IDs to Vercel Preview.
- Register the preview webhook and select the documented subscription events.
- Confirm the site builds from the intended Git commit.

## Preview QA

- Test desktop and phone layouts.
- Submit monthly and annual founding-interest forms.
- Complete monthly and annual Stripe test checkouts.
- Confirm founder numbers and referral codes are written once per email.
- Confirm Stripe customer/subscription IDs and `active` status appear in Supabase.
- Confirm cancelled or past-due test subscriptions update Supabase through webhooks.
- Test the Peace Monitor, incident reset, local persistence, and share link.
- Test privacy, terms, sitemap, and footer links.
- Confirm the Free Range Dad link opens the correct store.
- Confirm the success page never marks an unpaid or invalid session as active.

## Before production

- Add the same environment values to Vercel Production.
- Replace Stripe test keys and price IDs with live-mode values in Production only.
- Complete one small live transaction and refund/cancel it before announcing enrollment.
- Have privacy and terms reviewed by qualified counsel.
- Verify `halftimedad.co` and `www.halftimedad.co` domain behavior.
- Promote only a green preview build.
