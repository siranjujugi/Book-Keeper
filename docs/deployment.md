# Deployment

Book Keeper is deployed as a static Expo web app backed by Supabase.

The recommended deployment target is Cloudflare Pages:

[cloudflare-deployment.md](cloudflare-deployment.md)

## Build

From the repository root:

```bash
npm run app:web:build
```

The static output is generated in:

```text
expo-app/dist
```

The build copies Cloudflare Pages `_redirects` and `_headers` files into the output directory so client-side routes work on refresh.

## GitHub OAuth

For local development, use:

```text
Homepage URL: http://localhost:8081
Authorization callback URL: https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

The GitHub authorization callback remains the Supabase callback URL because Supabase handles the OAuth exchange.

In Supabase Authentication settings, allow these local redirect URLs:

```text
http://localhost:8081
http://localhost:8081/auth/callback
bookkeeper://auth/callback
```

For production:

1. Deploy to Cloudflare Pages.
2. Set the GitHub OAuth Homepage URL to the Cloudflare URL.
3. Keep the GitHub OAuth Authorization callback URL as:

```text
https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

4. Add the Cloudflare app URL and `/auth/callback` URL to Supabase Auth redirect URLs.

## Required Production Secrets

Supabase Edge Functions need these secrets:

```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
npx supabase secrets set GOOGLE_BOOKS_API_KEY=your-google-books-api-key
npm run functions:deploy
```

Do not put these secrets in the Expo app or Cloudflare Pages environment.
