import { supabase, supabaseReady } from '@/lib/supabase';
import { Book, BookMetadata, BookStatus, LibraryStats } from '@/lib/types';

const sampleBooks: Book[] = [
  {
    id: 'sample-1',
    title: 'The Pragmatic Programmer',
    subtitle: 'Your Journey to Mastery',
    isbn_13: '9780135957059',
    publisher: 'Addison-Wesley',
    published_year: 2019,
    language: 'English',
    page_count: 352,
    description: 'A practical software craftsmanship book.',
    cover_url: null,
    location_label: 'Study Shelf A',
    status: 'reading',
    rating: 5,
    created_at: new Date().toISOString(),
    authors: ['David Thomas', 'Andrew Hunt'],
    tags: ['Software', 'Craft']
  },
  {
    id: 'sample-2',
    title: 'Ponniyin Selvan',
    subtitle: null,
    isbn_13: null,
    publisher: 'Vanathi',
    published_year: null,
    language: 'Tamil',
    page_count: null,
    description: 'Historical fiction from a personal Tamil collection.',
    cover_url: null,
    location_label: 'Living Room Shelf 2',
    status: 'unread',
    rating: null,
    created_at: new Date().toISOString(),
    authors: ['Kalki'],
    tags: ['History', 'Fiction']
  }
];

export async function listBooks(): Promise<Book[]> {
  if (!supabaseReady) {
    return sampleBooks;
  }

  const { data, error } = await supabase
    .from('books_enriched')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data as Book[];
}

export async function getLibraryStats(): Promise<LibraryStats> {
  const books = await listBooks();
  return {
    totalBooks: books.length,
    unread: books.filter((book) => book.status === 'unread').length,
    reading: books.filter((book) => book.status === 'reading').length,
    completed: books.filter((book) => book.status === 'completed').length,
    loaned: books.filter((book) => book.status === 'loaned').length
  };
}

export async function addBookToLibrary(metadata: BookMetadata, options: { status: BookStatus; location_label?: string | null }) {
  if (!supabaseReady) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Sign in before adding books.');
  }

  const duplicateFilters = [metadata.isbn_13 ? `isbn_13.eq.${metadata.isbn_13}` : null, metadata.isbn_10 ? `isbn_10.eq.${metadata.isbn_10}` : null]
    .filter(Boolean)
    .join(',');

  if (duplicateFilters) {
    const { data: existing, error: duplicateError } = await supabase
      .from('books')
      .select('id,title')
      .or(duplicateFilters)
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (existing) {
      throw new Error(`This ISBN is already in your library as "${existing.title}".`);
    }
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert({
      title: metadata.title,
      subtitle: metadata.subtitle ?? null,
      isbn_10: metadata.isbn_10 ?? null,
      isbn_13: metadata.isbn_13 ?? null,
      publisher: metadata.publisher ?? null,
      published_year: metadata.published_year ?? null,
      language: metadata.language ?? null,
      page_count: metadata.page_count ?? null,
      description: metadata.description ?? null,
      cover_url: metadata.cover_url ?? null,
      location_label: options.location_label?.trim() || null,
      status: options.status
    })
    .select('id')
    .single();

  if (bookError) {
    throw bookError;
  }

  const owner_id = userData.user.id;
  const authors = metadata.authors.map((name) => name.trim()).filter(Boolean);

  if (authors.length > 0) {
    const { data: authorRows, error: authorError } = await supabase
      .from('authors')
      .upsert(
        authors.map((name) => ({ owner_id, name })),
        { onConflict: 'owner_id,normalized_name' }
      )
      .select('id,name');

    if (authorError) {
      throw authorError;
    }

    if (authorRows?.length) {
      const { error: linkError } = await supabase
        .from('book_authors')
        .insert(authorRows.map((author, position) => ({ book_id: book.id, author_id: author.id, position })));

      if (linkError) {
        throw linkError;
      }
    }
  }

  const tags = (metadata.tags ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 8);

  if (tags.length > 0) {
    const { data: tagRows, error: tagError } = await supabase
      .from('tags')
      .upsert(
        tags.map((name) => ({ owner_id, name })),
        { onConflict: 'owner_id,normalized_name' }
      )
      .select('id,name');

    if (tagError) {
      throw tagError;
    }

    if (tagRows?.length) {
      const { error: linkError } = await supabase
        .from('book_tags')
        .insert(tagRows.map((tag) => ({ book_id: book.id, tag_id: tag.id })));

      if (linkError) {
        throw linkError;
      }
    }
  }

  if (options.status === 'reading') {
    const { error: logError } = await supabase
      .from('reading_logs')
      .insert({
        book_id: book.id,
        status: 'started',
        started_at: new Date().toISOString().slice(0, 10)
      });

    if (logError) {
      throw logError;
    }
  }

  return book.id as string;
}
