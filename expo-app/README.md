# Book Keeper Universal App

This is the redesigned React-based Book Keeper app. It is built with Expo so the same codebase can run on iOS, Android, and web.

## Stack

- Expo + React Native + Expo Router
- TypeScript
- Supabase Auth + PostgreSQL
- Supabase Edge Functions for AI calls
- OpenAI for structured book enrichment and assistant workflows

## Local Setup

Create `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run web
```

For mobile:

```bash
npm run ios
npm run android
```

## Current State

Implemented:

- Mobile/web app shell with Library, Scan, Assistant, and Insights tabs
- Supabase client configuration
- Magic-link sign-in panel
- Camera barcode scanning screen
- Rich first-pass UI for collection and insights
- Sample fallback data when Supabase is not fully configured

Next:

- Add create/edit book flows
- Wire scan results to ISBN lookup and AI enrichment
- Add assistant edge function invocation
- Add semantic search over `book_embeddings`
- Add import/export from the old SQLite schema
