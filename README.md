This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Importing a prototype backup

The old prototype (a Claude-artifact web app that predates this app) has an
"Export backup" button that produces a JSON file shaped like:

```json
{ "exportedAt": "2026-01-01T00:00:00.000Z", "people": [ {...} ], "posts": [ {...} ] }
```

`scripts/import-backup.ts` is a one-time script that reads that file and
inserts its `people`/`posts` records into the real Supabase tables. Run it
with:

```bash
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
  npx tsx scripts/import-backup.ts <path-to-export.json> <owner-user-id>
```

Run `npx tsx scripts/import-backup.ts --help` for full usage.

Where to find the two values it needs:

- **Service role key** - Supabase dashboard -> your project -> Project
  Settings -> API -> `service_role` secret key. This key bypasses Row Level
  Security, so only export it in your shell for this one command; never
  commit it or put it in a file that gets committed (`.env.local` is
  gitignored, but the recommended way to run this script is to pass the key
  inline as a one-off env var as shown above).
- **Owner user id** - Supabase dashboard -> your project -> Authentication
  -> Users -> copy the `UID` column value for your account. Every imported
  row is stamped with this id since RLS scopes all rows to `user_id`.

The project URL (`NEXT_PUBLIC_SUPABASE_URL`) is read automatically from
`.env.local`.

**Re-running is safe.** Before inserting, the script checks for existing
rows belonging to the same `owner-user-id` and skips any that already
match - by `name` for people, and by `title` + `date_posted` for posts.
Running the script twice against the same backup file will not create
duplicate rows. Fields that are missing or the wrong type in the source
file are logged as warnings and filled with the column's normal default
(e.g. `stage` defaults to `Connected`) rather than crashing or being
skipped silently; records missing a required field (e.g. a person with no
`name`) are skipped entirely and reported in the final summary.
