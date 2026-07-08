# Supabase Setup

Project URL:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co
```

## Apply Schema

Install and authenticate the Supabase CLI, link this project, then run:

```bash
npm install
npx supabase login
npm run db:link
npm run db:push
```

Non-interactive environments can use:

```bash
export SUPABASE_ACCESS_TOKEN=your-supabase-access-token
npm run db:link
npm run db:push
```

## Required Secrets

The Expo app needs the public Supabase anon/publishable key in `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Do not put `SUPABASE_ACCESS_TOKEN`, service-role keys, OpenAI keys, or Google API keys in `expo-app/.env`.

The AI Edge Functions need a server-side OpenAI key:

```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-key
npm run functions:deploy
```

Do not put the OpenAI API key in the Expo app.

The ISBN lookup function uses Google Books through a server-side secret:

```bash
npx supabase secrets set GOOGLE_BOOKS_API_KEY=your-google-books-api-key
npm run functions:deploy
```

If `GOOGLE_BOOKS_API_KEY` is missing, the function still attempts an unauthenticated Google Books lookup, but quota behavior is less predictable.
