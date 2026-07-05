# Book Keeper Redesign Architecture

## Direction

Book Keeper is now a universal React application built with Expo. The legacy Angular and Flask implementation has been removed so the repository represents the redesigned app only.

## Runtime Architecture

```text
Expo app
  Library tab
  Scan tab
  Assistant tab
  Insights tab
       |
       v
Supabase
  Auth
  PostgreSQL
  Storage
  Edge Functions
  pgvector
       |
       v
OpenAI
  Structured book metadata enrichment
  Natural-language assistant
  Embeddings for semantic search
```

## Data Ownership

All primary tables include `owner_id` and row-level security policies. The app is intended for personal use, but it still treats library data as private by default.

## AI Boundary

OpenAI calls should only happen from Supabase Edge Functions. The Expo app must never contain the OpenAI API key.

Initial AI functions:

- `ai-book-enrichment`: convert ISBN/manual text/image-derived text into structured book metadata
- planned `assistant-query`: translate natural-language questions into safe search/retrieval operations
- planned `embedding-refresh`: update semantic-search embeddings after metadata changes

## Important Folders

- `expo-app`: universal React app
- `supabase/migrations`: database schema
- `supabase/functions`: server-side AI functions
