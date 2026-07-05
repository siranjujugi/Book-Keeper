create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subtitle text,
  isbn_10 text,
  isbn_13 text,
  publisher text,
  published_year integer,
  language text,
  page_count integer,
  description text,
  cover_url text,
  location_label text,
  status text not null default 'unread' check (status in ('unread', 'reading', 'completed', 'loaned')),
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(trim(name))) stored,
  created_at timestamptz not null default now(),
  unique (owner_id, normalized_name)
);

create table if not exists public.book_authors (
  book_id uuid not null references public.books(id) on delete cascade,
  author_id uuid not null references public.authors(id) on delete cascade,
  position integer not null default 0,
  primary key (book_id, author_id)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text generated always as (lower(trim(name))) stored,
  created_at timestamptz not null default now(),
  unique (owner_id, normalized_name)
);

create table if not exists public.book_tags (
  book_id uuid not null references public.books(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (book_id, tag_id)
);

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text not null check (status in ('started', 'paused', 'completed', 'abandoned')),
  started_at date,
  completed_at date,
  notes text,
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  borrower_name text not null,
  loaned_at date not null default current_date,
  returned_at date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_enrichment_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  source text not null check (source in ('isbn', 'barcode', 'cover_image', 'manual_text', 'bulk_import')),
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_embeddings (
  book_id uuid primary key references public.books(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

create or replace view public.books_enriched
with (security_invoker = true) as
select
  b.*,
  coalesce(array_remove(array_agg(distinct a.name), null), '{}') as authors,
  coalesce(array_remove(array_agg(distinct t.name), null), '{}') as tags
from public.books b
left join public.book_authors ba on ba.book_id = b.id
left join public.authors a on a.id = ba.author_id
left join public.book_tags bt on bt.book_id = b.id
left join public.tags t on t.id = bt.tag_id
group by b.id;

alter table public.books enable row level security;
alter table public.authors enable row level security;
alter table public.book_authors enable row level security;
alter table public.tags enable row level security;
alter table public.book_tags enable row level security;
alter table public.reading_logs enable row level security;
alter table public.loans enable row level security;
alter table public.ai_enrichment_jobs enable row level security;
alter table public.book_embeddings enable row level security;

create policy "books are owned by current user" on public.books
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "authors are owned by current user" on public.authors
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "tags are owned by current user" on public.tags
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "reading logs are owned by current user" on public.reading_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "loans are owned by current user" on public.loans
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "ai jobs are owned by current user" on public.ai_enrichment_jobs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "embeddings are owned by current user" on public.book_embeddings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "book authors follow book ownership" on public.book_authors
  for all using (
    exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
  );

create policy "book tags follow book ownership" on public.book_tags
  for all using (
    exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
  );
