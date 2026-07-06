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

The mobile/web app needs the public anon key in `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The AI edge function needs a server-side OpenAI key:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-key
npm run functions:deploy
```

Do not put the OpenAI API key in the Expo app.

The ISBN lookup function uses Google Books through a server-side secret:

```bash
supabase secrets set GOOGLE_BOOKS_API_KEY=your-google-books-api-key
npm run functions:deploy
```

If `GOOGLE_BOOKS_API_KEY` is missing, the function still attempts an unauthenticated Google Books lookup, but quota behavior is less predictable.
