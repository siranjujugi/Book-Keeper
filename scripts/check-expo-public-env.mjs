import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(process.cwd(), 'expo-app/.env');

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return values;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return values;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      values[key] = rawValue.replace(/^['"]|['"]$/g, '');
      return values;
    }, {});
}

const fileEnv = parseEnvFile(envFile);
const requiredKeys = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missingKeys = requiredKeys.filter((key) => !(process.env[key] || fileEnv[key]));

if (missingKeys.length > 0) {
  console.error(`Missing required Expo public environment variables: ${missingKeys.join(', ')}`);
  console.error('For Cloudflare Pages, add them as build environment variables and redeploy.');
  console.error('For local development, add them to expo-app/.env.');
  process.exit(1);
}
