import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const repoRoot = process.cwd();
const csvPath = process.argv[2];
const defaultStatus = process.argv[3] ?? 'unread';
const reportPath = path.join(repoRoot, 'reports', `manual-books-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

if (!csvPath) {
  console.error('Usage: node scripts/import-manual-books-csv.mjs /path/to/manual-books.csv [defaultStatus]');
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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? '']));
  }).map((row, index) => ({ ...row, rowNumber: index + 2 }));
}

function normalizeOptionalText(value) {
  const text = String(value ?? '').trim();
  return text.length ? text : null;
}

function normalizeInteger(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRating(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStatus(value) {
  const status = String(value ?? '').trim().toLowerCase() || defaultStatus;
  if (!['unread', 'reading', 'completed', 'loaned'].includes(status)) {
    throw new Error(`Unsupported status "${value}". Use unread, reading, completed, or loaned.`);
  }
  return status;
}

function splitList(value) {
  return String(value ?? '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getProjectKeys(projectRef, accessToken) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Could not retrieve project keys: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function linkAuthors(supabase, ownerId, bookId, authors) {
  if (!authors.length) return;

  const { data: authorRows, error: authorError } = await supabase
    .from('authors')
    .upsert(authors.map((name) => ({ owner_id: ownerId, name })), { onConflict: 'owner_id,normalized_name' })
    .select('id,name');

  if (authorError) throw authorError;

  const { error } = await supabase
    .from('book_authors')
    .upsert(authorRows.map((author, position) => ({ book_id: bookId, author_id: author.id, position })), {
      onConflict: 'book_id,author_id'
    });

  if (error) throw error;
}

async function linkTags(supabase, ownerId, bookId, tags) {
  if (!tags.length) return;

  const { data: tagRows, error: tagError } = await supabase
    .from('tags')
    .upsert(tags.map((name) => ({ owner_id: ownerId, name })), { onConflict: 'owner_id,normalized_name' })
    .select('id,name');

  if (tagError) throw tagError;

  const { error } = await supabase
    .from('book_tags')
    .upsert(tagRows.map((tag) => ({ book_id: bookId, tag_id: tag.id })), {
      onConflict: 'book_id,tag_id'
    });

  if (error) throw error;
}

async function main() {
  const env = readEnv(path.join(repoRoot, 'expo-app', '.env'));
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const accessToken = env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !accessToken) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_ACCESS_TOKEN.');
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const keys = await getProjectKeys(projectRef, accessToken);
  const keyRows = Array.isArray(keys) ? keys : keys.api_keys;
  const serviceRoleKey = keyRows.find((key) => key.name === 'service_role' || key.api_key_type === 'service_role')?.api_key;

  if (!serviceRoleKey) {
    throw new Error('Could not resolve Supabase service role key.');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  if (users.users.length !== 1) {
    throw new Error(`Expected exactly one auth user, found ${users.users.length}.`);
  }

  const ownerId = users.users[0].id;
  const rows = parseCsv(csvPath);
  const results = [];

  for (const row of rows) {
    const title = normalizeOptionalText(row.title);
    const isbn13 = normalizeOptionalText(row.isbn_13);
    const isbn10 = normalizeOptionalText(row.isbn_10);

    if (!title) {
      results.push({ row: row.rowNumber, isbn_13: isbn13, status: 'skipped_missing_title' });
      continue;
    }

    const duplicateFilters = [
      isbn13 ? `isbn_13.eq.${isbn13}` : null,
      isbn10 ? `isbn_10.eq.${isbn10}` : null
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
      if (existing) {
        results.push({ row: row.rowNumber, isbn_13: isbn13, status: 'skipped_existing', title: existing.title, bookId: existing.id });
        continue;
      }
    }

    const notes = normalizeOptionalText(row.notes);
    const description = [normalizeOptionalText(row.description), notes ? `Import notes: ${notes}` : null].filter(Boolean).join('\n\n') || null;
    const status = normalizeStatus(row.status);

    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        owner_id: ownerId,
        title,
        subtitle: normalizeOptionalText(row.subtitle),
        isbn_10: isbn10,
        isbn_13: isbn13,
        publisher: normalizeOptionalText(row.publisher),
        published_year: normalizeInteger(row.published_year),
        language: normalizeOptionalText(row.language),
        page_count: normalizeInteger(row.page_count),
        description,
        cover_url: normalizeOptionalText(row.cover_url),
        location_label: normalizeOptionalText(row.location_label),
        status,
        rating: normalizeRating(row.rating)
      })
      .select('id,title')
      .single();

    if (bookError) throw bookError;

    await linkAuthors(supabase, ownerId, book.id, splitList(row.authors));
    await linkTags(supabase, ownerId, book.id, splitList(row.tags));

    results.push({ row: row.rowNumber, isbn_13: isbn13, status: 'added', title: book.title, bookId: book.id });
  }

  const summary = {
    source: csvPath,
    ownerId,
    totalRows: rows.length,
    added: results.filter((result) => result.status === 'added').length,
    skippedExisting: results.filter((result) => result.status === 'skipped_existing').length,
    skippedMissingTitle: results.filter((result) => result.status === 'skipped_missing_title').length,
    results
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, ...summary, ownerId: undefined, results: undefined }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
