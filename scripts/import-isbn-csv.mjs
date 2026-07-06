import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const projectRef = 'mvcsvnhjuouuavilxkzj';
const repoRoot = process.cwd();
const csvPath = process.argv[2];
const defaultLocation = process.argv[3] ?? '';
const defaultStatus = process.argv[4] ?? 'unread';
const reportPath = path.join(repoRoot, 'reports', `isbn-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

if (!csvPath) {
  console.error('Usage: node scripts/import-isbn-csv.mjs /path/to/scans.csv [defaultLocation] [defaultStatus]');
  process.exit(2);
}

function readEnv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => /^\s*[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
      })
  );
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function normalizeIsbn(value) {
  return String(value ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function isValidIsbn13(isbn) {
  if (!/^[0-9]{13}$/.test(isbn)) return false;
  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += Number(isbn[index]) * (index % 2 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(isbn[12]);
}

function isBookIsbn(isbn) {
  return isbn.length === 13 && (isbn.startsWith('978') || isbn.startsWith('979')) && isValidIsbn13(isbn);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProjectKeys(accessToken) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Could not retrieve project keys: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function lookupMetadata(supabase, isbn) {
  const { data, error } = await supabase.functions.invoke('isbn-lookup', {
    body: { isbn }
  });

  if (error) {
    throw new Error(error.message || 'ISBN lookup failed');
  }

  if (!data?.title) {
    throw new Error('No metadata returned');
  }

  return data;
}

async function addBook(supabase, ownerId, metadata, options) {
  const duplicateFilters = [
    metadata.isbn_13 ? `isbn_13.eq.${metadata.isbn_13}` : null,
    metadata.isbn_10 ? `isbn_10.eq.${metadata.isbn_10}` : null
  ].filter(Boolean).join(',');

  if (duplicateFilters) {
    const { data: existing, error } = await supabase
      .from('books')
      .select('id,title')
      .eq('owner_id', ownerId)
      .or(duplicateFilters)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (existing) return { action: 'skipped_existing', id: existing.id, title: existing.title };
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert({
      owner_id: ownerId,
      title: metadata.title,
      subtitle: metadata.subtitle ?? null,
      isbn_10: metadata.isbn_10 ?? null,
      isbn_13: metadata.isbn_13 ?? null,
      publisher: metadata.publisher ?? null,
      published_year: metadata.published_year ?? null,
      language: metadata.language ?? null,
      page_count: metadata.page_count ?? null,
      description: metadata.description ?? null,
      cover_url: metadata.cover_url ?? null,
      location_label: options.location_label || null,
      status: options.status
    })
    .select('id,title')
    .single();

  if (bookError) throw bookError;

  const authors = (metadata.authors ?? []).map((name) => name.trim()).filter(Boolean);
  if (authors.length > 0) {
    const { data: authorRows, error: authorError } = await supabase
      .from('authors')
      .upsert(authors.map((name) => ({ owner_id: ownerId, name })), { onConflict: 'owner_id,normalized_name' })
      .select('id,name');

    if (authorError) throw authorError;

    if (authorRows?.length) {
      const { error } = await supabase
        .from('book_authors')
        .insert(authorRows.map((author, position) => ({ book_id: book.id, author_id: author.id, position })));

      if (error) throw error;
    }
  }

  const tags = (metadata.tags ?? []).map((name) => name.trim()).filter(Boolean).slice(0, 8);
  if (tags.length > 0) {
    const { data: tagRows, error: tagError } = await supabase
      .from('tags')
      .upsert(tags.map((name) => ({ owner_id: ownerId, name })), { onConflict: 'owner_id,normalized_name' })
      .select('id,name');

    if (tagError) throw tagError;

    if (tagRows?.length) {
      const { error } = await supabase
        .from('book_tags')
        .insert(tagRows.map((tag) => ({ book_id: book.id, tag_id: tag.id })));

      if (error) throw error;
    }
  }

  if (options.status === 'reading') {
    const { error } = await supabase
      .from('reading_logs')
      .insert({
        owner_id: ownerId,
        book_id: book.id,
        status: 'started',
        started_at: new Date().toISOString().slice(0, 10)
      });

    if (error) throw error;
  }

  return { action: 'added', id: book.id, title: book.title };
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const dataIndex = header.includes('data') ? header.indexOf('data') : header.includes('isbn') ? header.indexOf('isbn') : 0;
  const seen = new Set();
  const candidates = [];
  const duplicates = [];
  const rejected = [];

  lines.slice(1).forEach((line, index) => {
    const row = index + 2;
    const cells = splitCsvLine(line);
    const raw = cells[dataIndex] ?? '';
    const isbn = normalizeIsbn(raw);

    if (!isBookIsbn(isbn)) {
      rejected.push({ row, raw, isbn });
      return;
    }

    if (seen.has(isbn)) {
      duplicates.push({ row, isbn });
      return;
    }

    seen.add(isbn);
    candidates.push({ row, isbn, raw });
  });

  return { totalRows: lines.length - 1, candidates, duplicates, rejected };
}

async function main() {
  const env = readEnv(path.join(repoRoot, 'expo-app', '.env'));
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const accessToken = env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !accessToken) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN.');
  }

  const keys = await getProjectKeys(accessToken);
  const serviceRoleKey = keys.find((key) => key.name === 'service_role')?.api_key;
  const anonKey = keys.find((key) => key.name === 'anon')?.api_key ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!serviceRoleKey || !anonKey) {
    throw new Error('Could not resolve Supabase service role or anon key.');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const lookupClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: users, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) throw usersError;
  if (users.users.length !== 1) {
    throw new Error(`Expected exactly one auth user, found ${users.users.length}.`);
  }

  const ownerId = users.users[0].id;
  const parsed = parseCsv(csvPath);
  const results = [];

  for (let index = 0; index < parsed.candidates.length; index += 1) {
    const candidate = parsed.candidates[index];
    process.stdout.write(`\rImporting ${index + 1}/${parsed.candidates.length}: ${candidate.isbn}`);

    try {
      const metadata = await lookupMetadata(lookupClient, candidate.isbn);
      const saved = await addBook(admin, ownerId, metadata, {
        status: defaultStatus,
        location_label: defaultLocation
      });
      results.push({ ...candidate, status: saved.action, title: saved.title, bookId: saved.id });
    } catch (error) {
      results.push({ ...candidate, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }

    await sleep(150);
  }

  process.stdout.write('\n');

  const summary = {
    source: csvPath,
    ownerId,
    totalRows: parsed.totalRows,
    uniqueCandidates: parsed.candidates.length,
    duplicateRows: parsed.duplicates,
    rejectedRows: parsed.rejected,
    added: results.filter((result) => result.status === 'added').length,
    skippedExisting: results.filter((result) => result.status === 'skipped_existing').length,
    failed: results.filter((result) => result.status === 'failed').length,
    results
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({
    reportPath,
    totalRows: summary.totalRows,
    uniqueCandidates: summary.uniqueCandidates,
    added: summary.added,
    skippedExisting: summary.skippedExisting,
    failed: summary.failed,
    rejectedRows: summary.rejectedRows.length,
    duplicateRows: summary.duplicateRows.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
