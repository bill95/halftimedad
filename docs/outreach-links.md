# Outreach links and creator codes

Every link we put into the world carries a tag, so Vercel Analytics can show which creator, post or email sent each signup and sale. The site records the first tag a visitor arrives with (a 90-day cookie, no personal data) and attaches it to `account_created`, `script_used`, `checkout_started` and `paid`.

## The format

```
https://halftimedad.co/?utm_source=<who>&utm_campaign=<what>
```

Shows up in analytics as `<who>/<what>`. Lowercase, hyphens, no spaces.

| Where the link goes | utm_source | utm_campaign | Example |
| --- | --- | --- | --- |
| A creator's post, bio or story | creator handle | `outreach-2026` | `?utm_source=menstherapypod&utm_campaign=outreach-2026` |
| A podcast episode's show notes | show name | episode or date | `?utm_source=mens-therapy-podcast&utm_campaign=ep-2026-11` |
| A newsletter or Substack mention | publication | issue or date | `?utm_source=dadletter&utm_campaign=2026-11-09` |
| Practitioner referral card | practice name | `referral-card` | `?utm_source=smith-mediation&utm_campaign=referral-card` |
| Our Instagram bio | `instagram` | `bio` | `?utm_source=instagram&utm_campaign=bio` |
| Our Instagram post or reel | `instagram` | short post slug | `?utm_source=instagram&utm_campaign=holiday-exchange` |
| Sunday Reset email | `sunday-reset` | issue number | `?utm_source=sunday-reset&utm_campaign=issue-004` |

Link to the page that fits the message, not always the homepage: `/peace-monitor`, `/research`, or a public play once those exist. The tag works on any page.

Member-to-member shares use `?ref=<referral code>` instead and show up as `ref:<code>`.

## Creator codes in Stripe

Until January 31, 2027 the founding price is the price on the site, so a code would not save anyone money. Before then, attribution comes from the UTM link above, and a creator's audience simply pays the founding price.

Create discount codes when the standard tier goes live (the `NEXT_PUBLIC_ACTIVE_TIER` flip). A creator code then keeps founding pricing available to that creator's audience:

1. Stripe > Product catalog > Coupons > New. Amount off equal to standard minus founding price, duration "Forever", applies to the HalfTimeDad products.
2. On that coupon, add one promotion code per creator, named after them (for example `MENSTHERAPY`).
3. Checkout already accepts codes. The `paid` event records `promo: yes` when one is used.

Send each creator their UTM link now and their code at the price flip.
