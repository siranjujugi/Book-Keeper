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

## Database Setup

From the repository root:

```bash
supabase link --project-ref mvcsvnhjuouuavilxkzj
supabase db push
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
supabase functions deploy ai-book-enrichment
```

The Expo app calls Supabase functions. OpenAI credentials stay server-side.

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
cd expo-app
npm run typecheck
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
