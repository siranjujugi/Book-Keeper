import OpenAI from 'npm:openai@4.104.0';

type LibraryBook = {
  title: string;
  subtitle?: string | null;
  authors?: string[];
  status?: string | null;
  language?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  page_count?: number | null;
  location_label?: string | null;
  tags?: string[];
  rating?: number | null;
  isbn_13?: string | null;
};

type AssistantRequest = {
  question?: string;
  books?: LibraryBook[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function compactBook(book: LibraryBook) {
  return {
    title: book.title,
    subtitle: book.subtitle ?? null,
    authors: book.authors ?? [],
    status: book.status ?? null,
    language: book.language ?? null,
    publisher: book.publisher ?? null,
    published_year: book.published_year ?? null,
    page_count: book.page_count ?? null,
    location_label: book.location_label ?? null,
    tags: book.tags ?? [],
    rating: book.rating ?? null,
    isbn_13: book.isbn_13 ?? null
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured in Supabase secrets.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const input = (await req.json()) as AssistantRequest;
    const question = input.question?.trim();
    const books = (input.books ?? []).filter((book) => book.title).slice(0, 500).map(compactBook);

    if (!question) {
      return Response.json({ error: 'Question is required.' }, { status: 400, headers: corsHeaders });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: [
        'You are a personal library assistant.',
        'Answer only from the provided library JSON.',
        'If the question cannot be answered from the provided data, say what field or detail is missing.',
        'Be concise and include book titles when making recommendations or reporting counts.'
      ].join(' '),
      input: [
        {
          role: 'user',
          content: JSON.stringify({
            question,
            library_size: books.length,
            books
          })
        }
      ]
    });

    return Response.json({ answer: response.output_text }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown assistant error.' },
      { status: 500, headers: corsHeaders }
    );
  }
});
