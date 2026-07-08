# Book Keeper

Book Keeper is a personal library app for cataloging, searching, reviewing, and managing a home book collection. The app is built with Expo and React Native for web and mobile, with Supabase providing authentication, PostgreSQL storage, row-level security, and server-side Edge Functions.

## Stack

- Expo + React Native + Expo Router
- TypeScript
- Supabase Auth + PostgreSQL
- Supabase Row Level Security
- Supabase Edge Functions
- OpenAI for library assistant and metadata enrichment
- Google Books + Open Library for ISBN lookup
- Cloudflare Pages for the recommended web deployment

## Project Structure

```text
.
├── expo-app/                 # Expo app for web, iOS, and Android
├── supabase/
│   ├── migrations/           # Database schema, policies, storage setup
│   └── functions/            # ISBN lookup, AI assistant, enrichment functions
├── docs/                     # Deployment and import documentation
├── scripts/                  # Local admin/import helpers
├── ARCHITECTURE.md           # Runtime and data architecture
└── README.md
```

## Environment

Create `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Only `EXPO_PUBLIC_*` values belong in `expo-app/.env` or Cloudflare Pages. Do not put `SUPABASE_ACCESS_TOKEN`, service-role keys, OpenAI keys, or Google API keys in the Expo app.

Server-side secrets belong in Supabase:

```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
npx supabase secrets set GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

`SUPABASE_ACCESS_TOKEN` is only for Supabase CLI/admin commands. Keep it in your shell when needed:

```bash
export SUPABASE_ACCESS_TOKEN=your-supabase-personal-access-token
```

## Install

From the repository root:

```bash
npm install
npm run app:install
```

## Run Locally

```bash
npm run app:web
```

Open:

```text
http://localhost:8081
```

Mobile development:

```bash
cd expo-app
npm run ios
npm run android
```

## Database and Functions

Apply schema changes:

```bash
npx supabase login
npm run db:link
npm run db:push
```

Deploy Edge Functions:

```bash
npm run functions:deploy
```

If you use a shell token instead of `supabase login`:

```bash
export SUPABASE_ACCESS_TOKEN=your-supabase-personal-access-token
npm run functions:deploy
```

## Current Features

- GitHub and email-link sign-in through Supabase Auth
- Private library inventory protected by row-level security
- Library search by title, author, language, shelf, and tag
- Book detail view
- Book metadata editing for title, subtitle, authors, ISBNs, publisher, year, language, page count, description, cover URL, shelf, rating, and tags
- Reading status management: unread, reading, completed, loaned
- Reading log entries when status changes to reading or completed
- Book deletion with confirmation
- Camera ISBN scanning and manual ISBN entry
- ISBN lookup through Supabase Edge Function with Google Books and Open Library fallback
- Bulk ISBN paste/import from scanner apps
- Manual CSV import scripts for books without ISBNs
- AI Assistant with current-session follow-up support
- Insights dashboard for status counts, metadata health, language balance, top authors, top tags, and duplicate watch
- Cloudflare Pages static web deployment support with SPA routing headers

## Bulk Import Format

The Import tab accepts one ISBN per line:

```text
9780593230251
9780135957059
```

It also accepts CSV:

```csv
isbn,location,status
9780593230251,Shelf A1,unread
9780135957059,Shelf A1,reading
```

Supported status values are `unread`, `reading`, `completed`, and `loaned`.

For manually researched books, use:

[docs/manual-books-template.csv](docs/manual-books-template.csv)

## Deployment

The recommended web deployment is Cloudflare Pages:

[docs/cloudflare-deployment.md](docs/cloudflare-deployment.md)

Build locally:

```bash
npm run app:web:build
```

The deployable output is:

```text
expo-app/dist
```

The build script copies Cloudflare `_redirects` and `_headers` into `expo-app/dist` so routes like `/auth/callback` and book detail URLs work on refresh.

## Validate

```bash
npm run app:typecheck
npm run app:web:build
```

## GitHub OAuth

For local development:

```text
Homepage URL: http://localhost:8081
Authorization callback URL: https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

In Supabase Authentication settings, allow:

```text
http://localhost:8081
http://localhost:8081/auth/callback
bookkeeper://auth/callback
```

For production, set the GitHub OAuth Homepage URL to the Cloudflare Pages URL. The Authorization callback URL remains:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

Add the production app URL and `/auth/callback` URL to Supabase Auth redirect URLs.
