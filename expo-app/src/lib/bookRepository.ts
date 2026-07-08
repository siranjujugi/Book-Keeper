import { supabase, supabaseReady } from '@/lib/supabase';
import { Book, BookMetadata, BookStatus, BookUpdateInput, LibraryInsightItem, LibraryInsights, LibraryStats } from '@/lib/types';

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

export async function getBook(bookId: string): Promise<Book> {
  if (!supabaseReady) {
    const book = sampleBooks.find((item) => item.id === bookId);
    if (!book) throw new Error('Book not found.');
    return book;
  }

  const { data, error } = await supabase
    .from('books_enriched')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error) {
    throw error;
  }

  return data as Book;
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

function topCounts(values: string[], limit = 6): LibraryInsightItem[] {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function duplicateCounts(values: string[], limit = 8): LibraryInsightItem[] {
  return topCounts(values, 200)
    .filter((item) => item.count > 1)
    .slice(0, limit);
}

export async function getLibraryInsights(): Promise<LibraryInsights> {
  const books = await listBooks();
  const stats = {
    totalBooks: books.length,
    unread: books.filter((book) => book.status === 'unread').length,
    reading: books.filter((book) => book.status === 'reading').length,
    completed: books.filter((book) => book.status === 'completed').length,
    loaned: books.filter((book) => book.status === 'loaned').length
  };

  return {
    stats,
    languages: topCounts(books.map((book) => book.language ?? 'Unknown')),
    topTags: topCounts(books.flatMap((book) => book.tags ?? [])),
    topAuthors: topCounts(books.flatMap((book) => book.authors ?? [])),
    missing: {
      author: books.filter((book) => !book.authors?.length).length,
      isbn: books.filter((book) => !book.isbn_10 && !book.isbn_13).length,
      pageCount: books.filter((book) => !book.page_count).length,
      cover: books.filter((book) => !book.cover_url).length,
      shelf: books.filter((book) => !book.location_label).length
    },
    duplicates: {
      isbn: duplicateCounts(books.map((book) => book.isbn_13 || book.isbn_10 || '').filter(Boolean)),
      title: duplicateCounts(books.map((book) => book.title.trim().toLowerCase()).filter(Boolean))
    }
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

export async function updateBookStatus(bookId: string, status: BookStatus) {
  if (!supabaseReady) {
    throw new Error('Supabase is not configured.');
  }

  const { error: bookError } = await supabase
    .from('books')
    .update({ status })
    .eq('id', bookId);

  if (bookError) {
    throw bookError;
  }

  if (status === 'reading' || status === 'completed') {
    const today = new Date().toISOString().slice(0, 10);
    const { error: logError } = await supabase
      .from('reading_logs')
      .insert({
        book_id: bookId,
        status: status === 'reading' ? 'started' : 'completed',
        started_at: status === 'reading' ? today : null,
        completed_at: status === 'completed' ? today : null
      });

    if (logError) {
      throw logError;
    }
  }
}

export async function updateBookMetadata(bookId: string, input: BookUpdateInput): Promise<Book> {
  if (!supabaseReady) {
    throw new Error('Supabase is not configured.');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Sign in before editing books.');
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error('Title is required.');
  }

  const { error: bookError } = await supabase
    .from('books')
    .update({
      title,
      subtitle: input.subtitle?.trim() || null,
      isbn_10: input.isbn_10?.trim() || null,
      isbn_13: input.isbn_13?.trim() || null,
      publisher: input.publisher?.trim() || null,
      published_year: input.published_year ?? null,
      language: input.language?.trim() || null,
      page_count: input.page_count ?? null,
      description: input.description?.trim() || null,
      cover_url: input.cover_url?.trim() || null,
      location_label: input.location_label?.trim() || null,
      rating: input.rating ?? null
    })
    .eq('id', bookId);

  if (bookError) {
    throw bookError;
  }

  const owner_id = userData.user.id;
  const authors = input.authors.map((name) => name.trim()).filter(Boolean);

  const { error: deleteAuthorsError } = await supabase
    .from('book_authors')
    .delete()
    .eq('book_id', bookId);

  if (deleteAuthorsError) {
    throw deleteAuthorsError;
  }

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
        .insert(authorRows.map((author, position) => ({ book_id: bookId, author_id: author.id, position })));

      if (linkError) {
        throw linkError;
      }
    }
  }

  const tags = (input.tags ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 12);

  const { error: deleteTagsError } = await supabase
    .from('book_tags')
    .delete()
    .eq('book_id', bookId);

  if (deleteTagsError) {
    throw deleteTagsError;
  }

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
        .insert(tagRows.map((tag) => ({ book_id: bookId, tag_id: tag.id })));

      if (linkError) {
        throw linkError;
      }
    }
  }

  return getBook(bookId);
}

export async function deleteBook(bookId: string) {
  if (!supabaseReady) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (error) {
    throw error;
  }
}
