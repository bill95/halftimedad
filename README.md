# Half Time Dad

A polished, anonymous Domestic Peace Monitor built with Next.js and designed for Vercel.

## Features

- Anonymous dashboard creation
- Persistent local counter and statistics
- Shareable dashboard URLs with no account required
- Incident resets, longest streaks, averages, predictions, and badges
- Responsive mobile-first interface
- No database or environment variables required for v1

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Upload all project files to the root of your GitHub repository.
2. Import the repository into Vercel.
3. Vercel should detect **Next.js** automatically.
4. Leave Build and Output Settings at their defaults.
5. Click **Deploy**.
6. Add `halftimedad.co` under Project Settings > Domains.

## Sharing model

Dashboard state is encoded into the URL fragment after `#d=`. This means:

- Shared links work without a database.
- Vercel and web servers do not receive the dashboard data in the fragment.
- A shared dashboard is a snapshot at the time the link is generated.
- Reset and share again to distribute an updated snapshot.

A future database release can add live public profiles, accounts, leaderboards, and incident history.
