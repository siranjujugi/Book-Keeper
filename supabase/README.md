# Supabase Setup

Project URL:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co
```

## Apply Schema

Install and login to the Supabase CLI, link this project, then run:

```bash
supabase link --project-ref mvcsvnhjuouuavilxkzj
supabase db push
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
supabase functions deploy ai-book-enrichment
```

Do not put the OpenAI API key in the Expo app.
