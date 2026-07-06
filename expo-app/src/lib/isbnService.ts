import { BookMetadata } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function fetchBookMetadataByIsbn(isbn: string): Promise<BookMetadata> {
  const cleaned = isbn.replace(/[^0-9Xx]/g, '').toUpperCase();

  const { data, error } = await supabase.functions.invoke<BookMetadata>('isbn-lookup', {
    body: { isbn: cleaned }
  });

  if (error) {
    throw new Error(error.message || 'Book lookup failed. Try again or enter details manually.');
  }

  if (!data) {
    throw new Error('No book details found for this ISBN.');
  }

  return data;
}
