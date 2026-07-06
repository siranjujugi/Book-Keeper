export type BookStatus = 'unread' | 'reading' | 'completed' | 'loaned';

export type Book = {
  id: string;
  title: string;
  subtitle?: string | null;
  isbn_10?: string | null;
  isbn_13?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  language?: string | null;
  page_count?: number | null;
  description?: string | null;
  cover_url?: string | null;
  location_label?: string | null;
  status: BookStatus;
  rating?: number | null;
  created_at: string;
  authors?: string[];
  tags?: string[];
};

export type BookMetadata = {
  title: string;
  subtitle?: string | null;
  authors: string[];
  isbn_10?: string | null;
  isbn_13?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  language?: string | null;
  page_count?: number | null;
  description?: string | null;
  cover_url?: string | null;
  tags?: string[];
};

export type LibraryStats = {
  totalBooks: number;
  unread: number;
  reading: number;
  completed: number;
  loaned: number;
};
