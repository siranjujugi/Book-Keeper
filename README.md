# Book Keeper

Book Keeper is a personal library app redesigned as a universal React application. The same Expo codebase runs on web, iOS, and Android, with Supabase handling authentication, database storage, and server-side AI functions.

## Current Stack

- Expo + React Native + Expo Router
- TypeScript
- Supabase Auth + PostgreSQL
- Supabase Row Level Security for private personal data
- Supabase Edge Functions for AI calls
- OpenAI for structured metadata enrichment and assistant workflows
- `pgvector` for planned semantic search

## Project Structure

```text
.
├── expo-app/                 # Universal React app
├── supabase/
│   ├── migrations/           # Database schema and RLS policies
│   └── functions/            # Server-side AI functions
├── ARCHITECTURE.md           # Architecture notes
└── README.md                 # Setup and run instructions
```

## Prerequisites

- Node.js 20 or newer
- npm
- Supabase project access
- Supabase CLI, for applying migrations and deploying functions
- OpenAI API key, only for AI Edge Functions

## Supabase Configuration

The Supabase project URL is already configured:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co
```

Create the app environment file:

```bash
cd expo-app
cp .env.example .env
```

Edit `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only put the public Supabase anon key in this file. Do not put the OpenAI API key in the Expo app.

Do not keep server-only values such as `SUPABASE_SECRET_KEY`, service-role keys, or OpenAI keys in `expo-app/.env`. Expo apps are client applications; only `EXPO_PUBLIC_*` values belong there.

## Database Setup

Install the repository-level tooling:

```bash
npm install
```

The Supabase CLI needs a personal access token to create tables, policies, functions, and storage buckets. The app anon key in `expo-app/.env` is not enough for schema changes.

Create a token in Supabase Dashboard, then either login locally:

```bash
npx supabase login
```

Or export the token in your shell:

```bash
export SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

Then link and push from the repository root:

```bash
npm run db:link
npm run db:push
```

This applies the schema in `supabase/migrations`, including:

- Books
- Authors
- Tags
- Reading logs
- Loans
- AI enrichment jobs
- Book embeddings
- Row Level Security policies

## AI Function Setup

Set the OpenAI key as a Supabase server-side secret:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
npm run functions:deploy
```

The Expo app calls Supabase functions. OpenAI credentials stay server-side.

## GitHub SSO Setup

In GitHub, create an OAuth app with:

```text
Homepage URL: http://localhost:8081
Authorization callback URL: https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

In Supabase Dashboard:

1. Go to Authentication > Providers.
2. Enable GitHub.
3. Add the GitHub OAuth Client ID and Client Secret.
4. Add these redirect URLs in Authentication > URL Configuration:

```text
http://localhost:8081
http://localhost:8081/auth/callback
bookkeeper://auth/callback
```

For cloud deployment URLs, see `docs/deployment.md`.

For production, replace the GitHub Homepage URL with your deployed app URL. The GitHub Authorization callback URL should still be the Supabase callback URL:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

## Run the App

Install dependencies:

```bash
cd expo-app
npm install
```

Run on web:

```bash
npm run web
```

Open:

```text
http://localhost:8081
```

Run on iOS simulator:

```bash
npm run ios
```

Run on Android emulator:

```bash
npm run android
```

## Validate

```bash
npm run app:typecheck
```

## Build Web

```bash
npm run app:web:build
```

## Current Features

- Library tab with searchable collection UI
- Magic-link Supabase sign-in panel
- Camera-based ISBN barcode scan screen
- Assistant tab for planned AI workflows
- Insights tab for collection stats
- Sample fallback data when Supabase is not fully configured
- Initial Supabase schema and AI enrichment Edge Function

## Next Implementation Steps

- Add create/edit book screens
- Save scanned ISBN results into Supabase
- Connect scan flow to `ai-book-enrichment`
- Add assistant query Edge Function
- Add semantic search over `book_embeddings`
- Add import/export tools for personal backups
