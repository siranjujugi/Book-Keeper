import { supabase, supabaseReady } from '@/lib/supabase';
import { Book } from '@/lib/types';

export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function askLibraryAssistant(question: string, books: Book[], history: AssistantChatMessage[] = []): Promise<string> {
  if (!supabaseReady) {
    throw new Error('Supabase is not configured.');
  }

  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error('Enter a question first.');
  }

  const { data, error } = await supabase.functions.invoke('library-assistant', {
    body: {
      question: trimmed,
      history: history.slice(-10),
      books: books.slice(0, 500).map((book) => ({
        title: book.title,
        subtitle: book.subtitle,
        authors: book.authors ?? [],
        status: book.status,
        language: book.language,
        publisher: book.publisher,
        published_year: book.published_year,
        page_count: book.page_count,
        location_label: book.location_label,
        tags: book.tags ?? [],
        rating: book.rating,
        isbn_13: book.isbn_13
      }))
    }
  });

  if (error) {
    throw new Error(error.message || 'Assistant request failed.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.answer) {
    throw new Error('Assistant did not return an answer.');
  }

  return data.answer as string;
}
