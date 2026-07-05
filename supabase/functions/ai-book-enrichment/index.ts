import OpenAI from 'npm:openai@4.104.0';

type EnrichmentInput = {
  isbn?: string;
  title?: string;
  author?: string;
  description?: string;
  imageUrl?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as EnrichmentInput;
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: 'Extract and enrich personal-library book metadata. Return only fields supported by the schema.'
        },
        {
          role: 'user',
          content: JSON.stringify(input)
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'book_enrichment',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: ['string', 'null'] },
              subtitle: { type: ['string', 'null'] },
              authors: { type: 'array', items: { type: 'string' } },
              isbn_10: { type: ['string', 'null'] },
              isbn_13: { type: ['string', 'null'] },
              publisher: { type: ['string', 'null'] },
              published_year: { type: ['integer', 'null'] },
              language: { type: ['string', 'null'] },
              page_count: { type: ['integer', 'null'] },
              tags: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
              review_notes: { type: 'array', items: { type: 'string' } }
            },
            required: ['title', 'subtitle', 'authors', 'isbn_10', 'isbn_13', 'publisher', 'published_year', 'language', 'page_count', 'tags', 'confidence', 'review_notes']
          }
        }
      }
    });

    return Response.json({ result: response.output_text }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500, headers: corsHeaders });
  }
});
