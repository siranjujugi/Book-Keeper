# Book Keeper Expo App

This folder contains the Expo app used for Book Keeper web and mobile clients.

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Supabase client

## Environment

Create `expo-app/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://mvcsvnhjuouuavilxkzj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

Only public Supabase values belong here. Server-side secrets are configured in Supabase Edge Function secrets.

## Run

```bash
npm install
npm run web
```

Mobile development:

```bash
npm run ios
npm run android
```

## Build

From the repository root:

```bash
npm run app:web:build
```

The static web output is generated in:

```text
expo-app/dist
```

The root build command also copies Cloudflare Pages `_redirects` and `_headers` files into `dist`.

## Main Screens

- Library
- Book detail and edit
- Scan
- Import
- Assistant
- Insights
