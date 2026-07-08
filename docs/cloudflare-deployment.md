# Cloudflare Pages Deployment

Book Keeper is a static Expo web app backed by Supabase. Cloudflare Pages can host the generated web files at very low cost.

## Build Settings

Connect the repository to Cloudflare and use these settings:

```text
Framework preset: None
Path / Root directory: /
Build command: npm run app:install && npm run app:web:build
Deploy command: npx wrangler pages deploy expo-app/dist --project-name book-keeper
Node.js version: 20 or newer
```

The deploy command uploads the generated `expo-app/dist` folder to the Cloudflare Pages project named `book-keeper`.

Set these Cloudflare build variables:

```text
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
```

Set this Cloudflare build secret:

```text
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

The API token must include `Account > Cloudflare Pages > Edit` for the account that owns the `book-keeper` Pages project.

Do not add OpenAI keys, Supabase service-role keys, or `SUPABASE_ACCESS_TOKEN` to Cloudflare. Those belong in Supabase secrets or local admin shells only.

## Routing

The app uses client-side routes such as `/auth/callback` and book detail URLs. Cloudflare Pages needs an SPA fallback.

This repo includes:

```text
expo-app/public/_redirects
expo-app/public/_headers
```

After `npm run app:web:build`, the root build script copies those files into `expo-app/dist`.

## Supabase Auth Configuration

After Cloudflare creates the production URL, update Supabase Dashboard > Authentication > URL Configuration.

Set Site URL:

```text
https://your-cloudflare-pages-domain.pages.dev
```

Add Redirect URLs:

```text
https://your-cloudflare-pages-domain.pages.dev
https://your-cloudflare-pages-domain.pages.dev/auth/callback
http://localhost:8081
http://localhost:8081/auth/callback
bookkeeper://auth/callback
```

If you add a custom domain later, add both the root URL and `/auth/callback` for that custom domain too.

## GitHub OAuth App

In GitHub OAuth app settings:

```text
Homepage URL: https://your-cloudflare-pages-domain.pages.dev
Authorization callback URL: https://mvcsvnhjuouuavilxkzj.supabase.co/auth/v1/callback
```

The callback URL stays pointed at Supabase because Supabase handles the OAuth exchange.

## Supabase Edge Function Secrets

Confirm these are set in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set GOOGLE_BOOKS_API_KEY=your-google-books-api-key
npm run functions:deploy
```

## Smoke Test

After deployment, test:

- GitHub sign-in
- `/auth/callback` returns to the app instead of 404
- Library loads
- Book detail opens
- Edit metadata and save
- Change status to Reading/Read
- Assistant answers a simple question
- Scan/manual ISBN lookup works
- Insights loads metadata health and duplicate watch

## Troubleshooting

If deployment fails with:

```text
Could not detect a directory containing static files
```

Cloudflare is running the Worker deploy command instead of the Pages Direct Upload command. Use this exact deploy command:

```bash
npx wrangler pages deploy expo-app/dist --project-name book-keeper
```

Do not use `npx wrangler deploy` for this app unless the project is intentionally converted to Cloudflare Workers Static Assets with a Wrangler assets configuration.
