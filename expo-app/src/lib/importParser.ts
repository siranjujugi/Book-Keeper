import { BookStatus } from '@/lib/types';

export type ImportCandidate = {
  isbn: string;
  location_label?: string | null;
  status?: BookStatus;
};

const validStatuses = new Set<BookStatus>(['unread', 'reading', 'completed', 'loaned']);

export function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, '').toUpperCase();
}

export function isLikelyIsbn(value: string) {
  const cleaned = normalizeIsbn(value);
  return cleaned.length === 10 || (cleaned.length === 13 && cleaned.startsWith('97'));
}

function splitCsvLine(line: string) {
  const result: string[] = [];
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

export function parseImportText(input: string, defaults: { status: BookStatus; location_label?: string | null }) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { candidates: [] as ImportCandidate[], rejected: [] as string[], duplicates: [] as string[] };
  }

  const firstCells = splitCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = firstCells.includes('isbn');
  const header = hasHeader ? firstCells : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const isbnIndex = hasHeader ? header.indexOf('isbn') : 0;
  const locationIndex = hasHeader ? header.indexOf('location') : -1;
  const statusIndex = hasHeader ? header.indexOf('status') : -1;
  const seen = new Set<string>();
  const candidates: ImportCandidate[] = [];
  const rejected: string[] = [];
  const duplicates: string[] = [];

  dataLines.forEach((line) => {
    const cells = splitCsvLine(line);
    const isbn = normalizeIsbn(cells[isbnIndex] ?? line);

    if (!isLikelyIsbn(isbn)) {
      rejected.push(line);
      return;
    }

    if (seen.has(isbn)) {
      duplicates.push(isbn);
      return;
    }

    seen.add(isbn);

    const rawStatus = statusIndex >= 0 ? cells[statusIndex]?.toLowerCase() : undefined;
    const status = rawStatus && validStatuses.has(rawStatus as BookStatus) ? rawStatus as BookStatus : defaults.status;
    const location_label = locationIndex >= 0 ? cells[locationIndex] || defaults.location_label : defaults.location_label;

    candidates.push({ isbn, status, location_label });
  });

  return { candidates, rejected, duplicates };
}
