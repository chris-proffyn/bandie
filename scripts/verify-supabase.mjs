#!/usr/bin/env node
/**
 * Smoke test: Supabase connectivity and Bandie app registration.
 * Reads VITE_* vars from apps/web/.env.local or repo root .env
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = {
  ...loadEnvFile(resolve(root, '.env')),
  ...loadEnvFile(resolve(root, 'apps/web/.env.local')),
  ...process.env,
};

const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env (server-side verify only)');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.from('platform_apps').select('app_code, app_name, status').eq('app_code', 'bandie').maybeSingle();

if (error) {
  console.error('Supabase query failed:', error.message);
  process.exit(1);
}

if (!data) {
  console.error('Bandie app not registered in platform_apps');
  process.exit(1);
}

console.log('Supabase OK — bandie registered:', data);
process.exit(0);
