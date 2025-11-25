export interface Book {
  id?: number;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publication_year?: number;
  language?: string;
  genre?: string;
  pages?: number;
  location?: string;
  cover_image_url?: string;
  description?: string;
  date_added?: string;
}

export interface ReadingLog {
  id?: number;
  book_id: number;
  status: 'reading' | 'completed' | 'borrowed' | 'returned';
  start_date?: string;
  end_date?: string;
  borrower_name?: string;
  notes?: string;
  rating?: number;
  created_at?: string;
}

export interface AnalyticsOverview {
  total_books: number;
  books_by_language: { language: string; count: number }[];
  books_by_genre: { genre: string; count: number }[];
  borrowed_books: number;
  books_read_this_year: number;
}

export interface WeeklyPattern {
  books_completed: { week: string; count: number }[];
  books_started: { week: string; count: number }[];
}

export interface ReadingStats {
  books_per_month: { month: number; count: number }[];
  top_genres: { genre: string; count: number }[];
  languages_read: { language: string; count: number }[];
  average_rating: number | null;
}

export interface FilterOptions {
  languages: string[];
  genres: string[];
  authors: string[];
}

// Made with Bob
