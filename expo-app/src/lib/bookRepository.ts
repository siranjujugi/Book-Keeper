import { supabase, supabaseReady } from '@/lib/supabase';
import { Book, LibraryStats } from '@/lib/types';

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
