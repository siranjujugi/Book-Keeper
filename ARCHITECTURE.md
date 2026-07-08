# Book Keeper Architecture

## Runtime

```text
Expo app
  Library
  Book detail/edit
  Scan
  Import
  Assistant
  Insights
       |
       v
Supabase
  Auth
  PostgreSQL
  Storage
  Edge Functions
       |
       v
External services
  Google Books
  Open Library
  OpenAI
```

## App Layer

The Expo app is a client-side React Native application using Expo Router. It runs on web and can also run on iOS/Android through Expo.

Primary routes:

- `/(tabs)` Library
- `/(tabs)/[bookId]` Book detail, status updates, metadata editing, deletion
- `/(tabs)/scan` Camera/manual ISBN lookup
- `/(tabs)/import` Bulk ISBN import
- `/(tabs)/assistant` AI Q&A with current-session chat history
- `/(tabs)/insights` Library health and collection stats
- `/auth/callback` Supabase OAuth callback

## Data Layer

Supabase PostgreSQL stores the library data:

- `books`
- `authors`
- `book_authors`
- `tags`
- `book_tags`
- `reading_logs`
- `loans`
- `notes`
- `ai_enrichment_jobs`
- `book_embeddings`

All user-owned tables include `owner_id` and use row-level security. The client uses the Supabase anon/publishable key and can only access rows owned by the authenticated user.

## Edge Functions

OpenAI and Google API keys stay server-side in Supabase secrets. The Expo app never contains server API keys.

Current Edge Functions:

- `isbn-lookup`: resolves ISBN metadata through Google Books with Open Library fallback.
- `library-assistant`: answers questions over the provided library context and recent chat turns.
- `ai-book-enrichment`: converts partial metadata into structured book fields.

## Deployment

The recommended web deployment target is Cloudflare Pages. The app exports to static files in `expo-app/dist`, with Cloudflare `_redirects` and `_headers` copied during `npm run app:web:build`.

Supabase remains the hosted platform for auth, database, storage, and Edge Functions.

## Important Folders

- `expo-app`: Expo application
- `expo-app/public`: Cloudflare Pages routing/header files
- `supabase/migrations`: database schema and policies
- `supabase/functions`: server-side functions
- `docs`: deployment/import guides
- `scripts`: local admin/import helpers
