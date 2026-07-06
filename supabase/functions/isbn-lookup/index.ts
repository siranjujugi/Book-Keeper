type GoogleIndustryIdentifier = {
  type: string;
  identifier: string;
};

type GoogleVolumeInfo = {
  title?: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  industryIdentifiers?: GoogleIndustryIdentifier[];
  pageCount?: number;
  language?: string;
  description?: string;
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  categories?: string[];
};

type OpenLibraryEdition = {
  title?: string;
  subtitle?: string;
  authors?: { key: string }[];
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  languages?: { key: string }[];
  covers?: number[];
  isbn_10?: string[];
  isbn_13?: string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function cleanIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase();
}

function extractYear(value?: string) {
  if (!value) return null;
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function pickIsbn(identifiers: GoogleIndustryIdentifier[] | undefined, type: 'ISBN_10' | 'ISBN_13') {
  return identifiers?.find((item) => item.type === type)?.identifier?.replace(/[^0-9Xx]/g, '').toUpperCase() ?? null;
}

function normalizeImageUrl(url?: string) {
  if (!url) return null;
  return url.startsWith('http://') ? url.replace('http://', 'https://') : url;
}

async function lookupOpenLibrary(cleaned: string) {
  const response = await fetch(`https://openlibrary.org/isbn/${cleaned}.json`, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    return null;
  }

  const edition = await response.json() as OpenLibraryEdition;
  const authorKeys = edition.authors?.map((author) => author.key).filter(Boolean).slice(0, 6) ?? [];
  const authors = await Promise.all(
    authorKeys.map(async (key) => {
      try {
        const authorResponse = await fetch(`https://openlibrary.org${key}.json`, {
          headers: { accept: 'application/json' }
        });
        if (!authorResponse.ok) return null;
        const author = await authorResponse.json();
        return typeof author.name === 'string' ? author.name : null;
      } catch {
        return null;
      }
    })
  );

  const coverId = edition.covers?.[0];

  if (!edition.title) {
    return null;
  }

  return {
    title: edition.title,
    subtitle: edition.subtitle ?? null,
    authors: authors.filter(Boolean),
    isbn_10: edition.isbn_10?.[0] ?? (cleaned.length === 10 ? cleaned : null),
    isbn_13: edition.isbn_13?.[0] ?? (cleaned.length === 13 ? cleaned : null),
    publisher: edition.publishers?.[0] ?? null,
    published_year: extractYear(edition.publish_date),
    language: edition.languages?.[0]?.key?.split('/').pop() ?? null,
    page_count: edition.number_of_pages ?? null,
    description: null,
    cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
    tags: []
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { isbn } = await req.json();
    const cleaned = cleanIsbn(String(isbn ?? ''));

    if (cleaned.length !== 10 && cleaned.length !== 13) {
      return json({ error: 'A valid ISBN-10 or ISBN-13 is required.' }, 400);
    }

    const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', `isbn:${cleaned}`);
    url.searchParams.set('maxResults', '1');

    if (apiKey) {
      url.searchParams.set('key', apiKey);
    }

    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
      return json({
        error: payload?.error?.message ?? 'Google Books lookup failed.',
        providerStatus: response.status
      }, response.status);
    }

    const volume = payload.items?.[0]?.volumeInfo as GoogleVolumeInfo | undefined;

    if (!volume) {
      const fallback = await lookupOpenLibrary(cleaned);
      if (fallback) {
        return json(fallback);
      }
      return json({ error: 'No book details found for this ISBN.' }, 404);
    }

    return json({
      title: volume.title || 'Untitled book',
      subtitle: volume.subtitle ?? null,
      authors: volume.authors ?? [],
      isbn_10: pickIsbn(volume.industryIdentifiers, 'ISBN_10') ?? (cleaned.length === 10 ? cleaned : null),
      isbn_13: pickIsbn(volume.industryIdentifiers, 'ISBN_13') ?? (cleaned.length === 13 ? cleaned : null),
      publisher: volume.publisher ?? null,
      published_year: extractYear(volume.publishedDate),
      language: volume.language ?? null,
      page_count: volume.pageCount ?? null,
      description: volume.description ?? null,
      cover_url: normalizeImageUrl(volume.imageLinks?.thumbnail ?? volume.imageLinks?.smallThumbnail),
      tags: volume.categories ?? []
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
